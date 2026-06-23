import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { assessmentId, path, content, sha, message } = await req.json();

    if (!assessmentId || !path || content === undefined) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const GITHUB_APP_ID = Deno.env.get('GITHUB_APP_ID');
    const GITHUB_PRIVATE_KEY = Deno.env.get('GITHUB_PRIVATE_KEY');
    const WIRRE_INSTALLATION_ID = Deno.env.get('WIRRE_GITHUB_INSTALLATION_ID');
    const WIRRE_ORG = Deno.env.get('WIRRE_GITHUB_ORG') || 'wirrecompany';

    if (!GITHUB_APP_ID || !GITHUB_PRIVATE_KEY || !WIRRE_INSTALLATION_ID) {
      return new Response(JSON.stringify({ error: 'GitHub credentials not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // 1. Verify user identity
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 2. Verify registration and access permissions
    const { data: registration, error: regError } = await supabase
      .from('assessment_registrations')
      .select('id, user_id, private_repo_url, repo_provisioned')
      .eq('assessment_id', assessmentId)
      .eq('user_id', user.id)
      .single();

    if (regError || !registration || !registration.repo_provisioned) {
      return new Response(JSON.stringify({ error: 'Unauthorized: Access not granted or round finished' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 3. Extract repo name
    const repoName = registration.private_repo_url.split('/').pop();

    // 4. Get GitHub Installation Token
    const { token } = await getInstallationToken(WIRRE_INSTALLATION_ID, GITHUB_APP_ID, GITHUB_PRIVATE_KEY);

    // 5. Commit changes to GitHub
    // Content must be base64 encoded
    const base64Content = btoa(unescape(encodeURIComponent(content)));
    
    const response = await fetch(`https://api.github.com/repos/${WIRRE_ORG}/${repoName}/contents/${path}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
      body: JSON.stringify({
        message: message || `Update ${path} via WIRRE Sandbox`,
        content: base64Content,
        sha: sha // Required if updating an existing file
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('GitHub Sync Error:', errorData);
      return new Response(JSON.stringify({ 
        error: 'GitHub sync failed', 
        details: errorData.message,
        needs_sha: errorData.message?.includes('does not match') 
      }), {
        status: response.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();

    return new Response(JSON.stringify({
      success: true,
      sha: data.content.sha,
      commit: data.commit.html_url
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Fatal Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

/**
 * UTILS (Copied from generic GitHub App templates)
 */
async function getInstallationToken(installationId: string, appId: string, privateKey: string) {
  const now = Math.floor(Date.now() / 1000);
  const payload = { iat: now - 60, exp: now + (10 * 60), iss: appId };
  const header = { alg: 'RS256', typ: 'JWT' };
  const encodedHeader = base64url(JSON.stringify(header));
  const encodedPayload = base64url(JSON.stringify(payload));
  const signatureInput = `${encodedHeader}.${encodedPayload}`;

  const key = await crypto.subtle.importKey(
    'pkcs8',
    pemToArrayBuffer(privateKey),
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

  const response = await fetch(`https://api.github.com/app/installations/${installationId}/access_tokens`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${jwt}`,
      'Accept': 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
  });

  if (!response.ok) throw new Error(`Failed to get installation token: ${await response.text()}`);
  const data = await response.json();
  return { token: data.token };
}

function base64url(input: string | Uint8Array): string {
  let str = (typeof input === 'string') ? btoa(input) : btoa(String.fromCharCode(...input));
  return str.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function pemToArrayBuffer(pem: string): ArrayBuffer {
  const b64 = pem.replace(/-----BEGIN PRIVATE KEY-----/, '').replace(/-----END PRIVATE KEY-----/, '').replace(/\s/g, '');
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}
