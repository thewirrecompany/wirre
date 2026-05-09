import { config } from './config.js';

/**
 * GitHub API helpers for fetching diffs between template and candidate repos.
 * Uses the GitHub App installation token for authentication (same pattern as
 * the existing Supabase edge functions).
 */

// ─── JWT helpers (ported from existing edge functions) ──────────────────────

function base64url(input: string | Uint8Array): string {
  let str: string;
  if (typeof input === 'string') {
    str = Buffer.from(input).toString('base64');
  } else {
    str = Buffer.from(input).toString('base64');
  }
  return str.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function pemToArrayBuffer(pem: string): ArrayBuffer {
  const formatted = pem.replace(/\\n/g, '\n');
  const b64 = formatted
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\s/g, '');
  const binary = Buffer.from(b64, 'base64');
  return binary.buffer.slice(binary.byteOffset, binary.byteOffset + binary.byteLength);
}

async function getInstallationToken(): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iat: now - 60,
    exp: now + 10 * 60,
    iss: config.githubAppId,
  };

  const header = { alg: 'RS256', typ: 'JWT' };
  const encodedHeader = base64url(JSON.stringify(header));
  const encodedPayload = base64url(JSON.stringify(payload));
  const signatureInput = `${encodedHeader}.${encodedPayload}`;

  const key = await crypto.subtle.importKey(
    'pkcs8',
    pemToArrayBuffer(config.githubPrivateKey),
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signatureBuffer = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    key,
    new TextEncoder().encode(signatureInput)
  );

  const signature = base64url(new Uint8Array(signatureBuffer));
  const jwt = `${signatureInput}.${signature}`;

  const response = await fetch(
    `https://api.github.com/app/installations/${config.githubInstallationId}/access_tokens`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${jwt}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to get GitHub installation token: ${await response.text()}`);
  }

  const data = await response.json();
  return data.token;
}

// Cache the token for its validity period
let cachedToken: { token: string; expiresAt: number } | null = null;

async function getToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt) {
    return cachedToken.token;
  }
  const token = await getInstallationToken();
  // Cache for 8 minutes (tokens are valid for 10)
  cachedToken = { token, expiresAt: Date.now() + 8 * 60 * 1000 };
  return token;
}

// ─── Public API ─────────────────────────────────────────────────────────────

/**
 * Fetch the git diff between the template repo and a candidate's submission repo.
 *
 * Strategy:
 * 1. Fetch the full file tree from the candidate repo
 * 2. Fetch the full file tree from the template repo
 * 3. For changed/added files, fetch content and build a unified diff string
 *
 * We use the Git Trees API + blob content since GitHub's compare API
 * doesn't work across different repositories.
 */
export async function getSubmissionDiff(
  templateOwner: string,
  templateRepo: string,
  candidateRepoUrl: string
): Promise<{ diff: string, readme: string | null, fullCodebase: string, changedFiles: { added: string[], modified: string[], deleted: string[] } }> {
  const token = await getToken();
  const cleanUrl = candidateRepoUrl.replace(/\.git$/, '');
  const candidateRepoName = cleanUrl.split('/').pop()!;
  const org = config.githubOrg;

  // 1. Get recursive tree for both repos
  const [templateTree, candidateTree] = await Promise.all([
    getRepoTree(token, templateOwner, templateRepo),
    getRepoTree(token, org, candidateRepoName),
  ]);

  // 2. Build SHA maps
  const templateShaMap = new Map<string, string>();
  for (const item of templateTree) {
    if (item.type === 'blob') {
      templateShaMap.set(item.path, item.sha);
    }
  }

  const candidateShaMap = new Map<string, string>();
  for (const item of candidateTree) {
    if (item.type === 'blob') {
      candidateShaMap.set(item.path, item.sha);
    }
  }

  // 3. Identify changed/added/deleted files
  const changedFiles: string[] = [];
  const addedFiles: string[] = [];
  const deletedFiles: string[] = [];

  for (const [path, sha] of candidateShaMap) {
    if (!templateShaMap.has(path)) {
      addedFiles.push(path);
    } else if (templateShaMap.get(path) !== sha) {
      changedFiles.push(path);
    }
  }

  for (const path of templateShaMap.keys()) {
    if (!candidateShaMap.has(path)) {
      deletedFiles.push(path);
    }
  }

  // 4. Build diff output — fetch content for changed and added files
  const diffParts: string[] = [];

  // Filter out binary/large files and common non-code files
  const skipPatterns = [
    /node_modules\//,
    /\.lock$/,
    /package-lock\.json$/,
    /\.png$/i, /\.jpg$/i, /\.jpeg$/i, /\.gif$/i, /\.ico$/i, /\.svg$/i,
    /\.woff/i, /\.ttf$/i, /\.eot$/i,
    /\.min\.js$/, /\.min\.css$/,
    /dist\//, /build\//, /\.next\//,
  ];

  const shouldSkip = (path: string) => skipPatterns.some(p => p.test(path));

  for (const path of addedFiles) {
    if (shouldSkip(path)) continue;
    try {
      const content = await getFileContent(token, org, candidateRepoName, path);
      if (content !== null) {
        diffParts.push(`\n=== NEW FILE: ${path} ===\n${content}`);
      }
    } catch {
      diffParts.push(`\n=== NEW FILE: ${path} === [failed to fetch content]`);
    }
  }

  for (const path of changedFiles) {
    if (shouldSkip(path)) continue;
    try {
      const [oldContent, newContent] = await Promise.all([
        getFileContent(token, templateOwner, templateRepo, path),
        getFileContent(token, org, candidateRepoName, path),
      ]);
      if (oldContent !== null && newContent !== null) {
        diffParts.push(
          `\n=== MODIFIED FILE: ${path} ===\n--- template/${path}\n+++ submission/${path}\n\n` +
          `[TEMPLATE VERSION]:\n${oldContent}\n\n[CANDIDATE VERSION]:\n${newContent}`
        );
      }
    } catch {
      diffParts.push(`\n=== MODIFIED FILE: ${path} === [failed to fetch content]`);
    }
  }

  for (const path of deletedFiles) {
    if (shouldSkip(path)) continue;
    diffParts.push(`\n=== DELETED FILE: ${path} ===`);
  }

  // 5. Fetch README.md from template repo to provide as context
  let readme: string | null = null;
  for (const [path] of templateShaMap) {
    if (path.toLowerCase() === 'readme.md') {
      try {
        readme = await getFileContent(token, templateOwner, templateRepo, path);
      } catch {
        // ignore
      }
      break;
    }
  }

  const changedFileNames = {
    added: addedFiles.filter(f => !shouldSkip(f)),
    modified: changedFiles.filter(f => !shouldSkip(f)),
    deleted: deletedFiles.filter(f => !shouldSkip(f))
  };

  if (diffParts.length === 0) {
    return { diff: '[NO CHANGES DETECTED — candidate submitted the template as-is]', readme, fullCodebase: '', changedFiles: changedFileNames };
  }

  // 6. Fetch full candidate codebase for context
  const codebaseParts: string[] = [];
  const candidateFiles = Array.from(candidateShaMap.keys()).filter(f => !shouldSkip(f));
  
  for (let i = 0; i < candidateFiles.length; i += 5) {
    const batch = candidateFiles.slice(i, i + 5);
    const contents = await Promise.all(batch.map(path => getFileContent(token, org, candidateRepoName, path)));
    for (let j = 0; j < batch.length; j++) {
      if (contents[j]) {
        codebaseParts.push(`\n=== FILE: ${batch[j]} ===\n${contents[j]}`);
      }
    }
  }
  const fullCodebase = codebaseParts.join('\n');

  const summary = `Files added: ${addedFiles.filter(f => !shouldSkip(f)).length}, ` +
    `modified: ${changedFiles.filter(f => !shouldSkip(f)).length}, ` +
    `deleted: ${deletedFiles.filter(f => !shouldSkip(f)).length}`;

  return { diff: `${summary}\n${'─'.repeat(60)}\n${diffParts.join('\n')}`, readme, fullCodebase, changedFiles: changedFileNames };
}

// ─── Internal helpers ───────────────────────────────────────────────────────

interface TreeItem {
  path: string;
  type: string;
  sha: string;
  size?: number;
}

async function getRepoTree(token: string, owner: string, repo: string): Promise<TreeItem[]> {
  // Try 'main' branch first
  let response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/git/trees/main?recursive=1`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
    }
  );

  // Fallback to 'master' branch if 'main' is not found
  if (response.status === 404 || response.status === 409) {
    response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/git/trees/master?recursive=1`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
        },
      }
    );
  }

  if (!response.ok) {
    throw new Error(`Failed to get tree for ${owner}/${repo}: ${response.status} ${await response.text()}`);
  }

  const data = await response.json();
  return data.tree || [];
}

async function getFileContent(
  token: string,
  owner: string,
  repo: string,
  path: string
): Promise<string | null> {
  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
    }
  );

  if (!response.ok) return null;

  const data = await response.json();

  // Skip files larger than 100KB to avoid token bloat
  if (data.size && data.size > 100_000) return null;

  if (data.content) {
    try {
      return Buffer.from(data.content, 'base64').toString('utf-8');
    } catch {
      return null; // binary file
    }
  }

  return null;
}
