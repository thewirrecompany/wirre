import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { assessmentId, candidateUserId, candidateGithubUsername } = await req.json();
    
    console.log('Provisioning request:', { assessmentId, candidateUserId, candidateGithubUsername });

    if (!assessmentId || !candidateUserId || !candidateGithubUsername) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const GITHUB_APP_ID = Deno.env.get('GITHUB_APP_ID');
    const GITHUB_PRIVATE_KEY = Deno.env.get('GITHUB_PRIVATE_KEY');
    
    if (!GITHUB_APP_ID || !GITHUB_PRIVATE_KEY) {
      console.error('Missing GitHub credentials');
      return new Response(JSON.stringify({ error: 'GitHub credentials not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Get assessment details
    const { data: assessment, error: assessmentError } = await supabase
      .from('assessments')
      .select('github_repo_owner, github_repo_name')
      .eq('id', assessmentId)
      .single();

    if (assessmentError || !assessment) {
      return new Response(JSON.stringify({ error: 'Assessment not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const templateOwner = assessment.github_repo_owner;
    const templateRepo = assessment.github_repo_name;

    // Use WIRRE's organization for creating candidate repos
    const WIRRE_ORG = Deno.env.get('WIRRE_GITHUB_ORG') || 'wirrecompany';
    const WIRRE_INSTALLATION_ID = Deno.env.get('WIRRE_GITHUB_INSTALLATION_ID');

    if (!WIRRE_INSTALLATION_ID) {
      return new Response(JSON.stringify({ error: 'WIRRE GitHub installation not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // CRITICAL: Use wirrecompany's installation token
    // This token has access to:
    // 1. Create repos in wirrecompany organization
    // 2. Read templates from ANY repo where the app is installed (including me-is-arya's private repos)
    const jwt = await generateJWT(GITHUB_APP_ID, GITHUB_PRIVATE_KEY);
    const installationToken = await getInstallationToken(WIRRE_INSTALLATION_ID, jwt);

    console.log(`Using wirrecompany installation to access template: ${templateOwner}/${templateRepo}`);

    // Get anonymous_id for this candidate
    const { data: registration } = await supabase
      .from('assessment_registrations')
      .select('anonymous_id')
      .eq('user_id', candidateUserId)
      .eq('assessment_id', assessmentId)
      .single();

    const anonymousId = registration?.anonymous_id || `CAND-${Date.now()}`;

    // Create unique repo name using anonymous ID (NOT candidate's username)
    const candidateRepoName = `assessment-${assessmentId.slice(0, 8)}-${anonymousId}`;
    
    console.log(`Creating repo from template: ${templateOwner}/${templateRepo} -> ${WIRRE_ORG}/${candidateRepoName}`);

    // Step 1: Create the candidate's private repository in WIRRE's organization
    // Using the installation token for the template owner's installation
    const createRepoResponse = await fetch(`https://api.github.com/repos/${templateOwner}/${templateRepo}/generate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${installationToken}`,
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
      body: JSON.stringify({
        owner: WIRRE_ORG,
        name: candidateRepoName,
        description: `Anonymous assessment repository for ${anonymousId}`,
        private: true,
        include_all_branches: false,
      }),
    });
    
    console.log(`GitHub response status: ${createRepoResponse.status}`);

    if (!createRepoResponse.ok) {
      const error = await createRepoResponse.text();
      console.error(`Failed to create repo. Template: ${templateOwner}/${templateRepo}, Status: ${createRepoResponse.status}, Error:`, error);
      
      // Check if it's a permission error
      if (error.includes('does not have permission') || error.includes('Not Found')) {
        return new Response(JSON.stringify({ 
          error: `GitHub App doesn't have access to template repository ${templateOwner}/${templateRepo}. The repository owner needs to install the WIRRE GitHub App and grant access to this repository. Installation URL: https://github.com/apps/${Deno.env.get('GITHUB_APP_SLUG')}/installations/new`
        }), {
          status: createRepoResponse.status,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }
      
      return new Response(JSON.stringify({ error: `Failed to create repo: ${error}` }), {
        status: createRepoResponse.status,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const newRepo = await createRepoResponse.json();
    
    console.log('Repo created successfully:', newRepo.html_url);

    // Step 2: DO NOT add candidate as collaborator yet
    // Access will be granted when the assessment starts via grant-access function

    // Step 3: Update registration record with private repo URL
    console.log('Updating registration:', { candidateUserId, assessmentId, repoUrl: newRepo.html_url, githubUsername: candidateGithubUsername });
    
    const { error: updateError } = await supabase
      .from('assessment_registrations')
      .update({
        private_repo_url: newRepo.html_url,
        github_username: candidateGithubUsername,
        repo_provisioned: true,
        access_granted: false, // Will be set to true when assessment starts
      })
      .eq('user_id', candidateUserId)
      .eq('assessment_id', assessmentId);

    if (updateError) {
      console.error('Failed to update registration:', updateError);
      console.error('Update error details:', JSON.stringify(updateError));
      return new Response(
        JSON.stringify({ error: `Database update failed: ${updateError.message}. Repo was created at ${newRepo.html_url} but could not be saved to database.` }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }
    
    console.log('Registration updated successfully');

    return new Response(
      JSON.stringify({
        success: true,
        repoUrl: newRepo.html_url,
        repoFullName: newRepo.full_name,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );

  } catch (error) {
    console.error('Error in provision-candidate-repo:', error);
    return new Response(
      JSON.stringify({ error: error.message || String(error) }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
});

/**
 * Get installation access token for a specific installation ID
 */
async function getInstallationToken(installationId: string, jwt: string): Promise<string> {
  const tokenResponse = await fetch(
    `https://api.github.com/app/installations/${installationId}/access_tokens`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${jwt}`,
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
    }
  );

  if (!tokenResponse.ok) {
    throw new Error(`Failed to get installation token: ${await tokenResponse.text()}`);
  }

  const tokenData = await tokenResponse.json();
  return tokenData.token;
}

async function generateJWT(appId: string, privateKey: string): Promise<string> {
  const formattedKey = privateKey.replace(/\\n/g, '\n');
  
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iat: now - 60,
    exp: now + (10 * 60),
    iss: appId,
  };

  const header = { alg: 'RS256', typ: 'JWT' };
  const encodedHeader = base64urlEncode(JSON.stringify(header));
  const encodedPayload = base64urlEncode(JSON.stringify(payload));
  
  const dataToSign = `${encodedHeader}.${encodedPayload}`;
  
  const encoder = new TextEncoder();
  const data = encoder.encode(dataToSign);

  const key = await crypto.subtle.importKey(
    'pkcs8',
    pemToArrayBuffer(formattedKey),
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    key,
    data
  );

  return `${dataToSign}.${base64urlEncode(signature)}`;
}

function pemToArrayBuffer(pem: string): ArrayBuffer {
  const b64 = pem
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\s/g, '');
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

function base64urlEncode(data: string | ArrayBuffer): string {
  let str: string;
  if (typeof data === 'string') {
    str = btoa(unescape(encodeURIComponent(data)));
  } else {
    str = btoa(String.fromCharCode(...new Uint8Array(data)));
  }
  return str.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}
