import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..', '..');
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

function requireEnv(key: string): string {
  const val = process.env[key];
  if (!val) {
    console.error(`❌ Missing required environment variable: ${key}`);
    console.error(`   Copy grader/.env.example to grader/.env and fill in your values.`);
    process.exit(1);
  }
  return val;
}

// Load the GitHub private key from the PEM file in the repo root,
// falling back to the env var if the file doesn't exist.
function loadGithubPrivateKey(): string {
  const pemPath = path.resolve(repoRoot, 'pkcs8-key.pem');
  if (fs.existsSync(pemPath)) {
    console.log(`🔑 Loaded GitHub private key from ${pemPath}`);
    return fs.readFileSync(pemPath, 'utf-8');
  }
  // Fall back to env var
  return requireEnv('GITHUB_PRIVATE_KEY');
}

export const config = {
  // DeepInfra
  deepinfraApiKey: requireEnv('DEEPINFRA_API_KEY'),
  deepinfraModel: process.env.DEEPINFRA_MODEL || 'Qwen/Qwen3-235B-A22B-Instruct-2507',

  // Groq
  groqApiKey: process.env.GROQ_API_KEY || '',
  groqModel: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',

  // Supabase
  supabaseUrl: requireEnv('SUPABASE_URL'),
  supabaseServiceRoleKey: requireEnv('SUPABASE_SERVICE_ROLE_KEY'),

  // GitHub
  githubAppId: requireEnv('GITHUB_APP_ID'),
  githubPrivateKey: loadGithubPrivateKey(),
  githubInstallationId: requireEnv('GITHUB_INSTALLATION_ID'),
  githubOrg: process.env.GITHUB_ORG || 'wirrecompany',

  // Grader settings
  pollIntervalMs: 5000,       // 5 seconds between polls
  staleLockMinutes: 10,       // Re-queue if in_progress for >10 min
};
