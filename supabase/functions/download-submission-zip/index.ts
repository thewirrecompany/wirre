import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';
import { unzipSync, zipSync, strToU8 } from 'https://esm.sh/fflate@0.8.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GITHUB_APP_ID = Deno.env.get('GITHUB_APP_ID');
const GITHUB_PRIVATE_KEY = Deno.env.get('GITHUB_PRIVATE_KEY');
const WIRRE_INSTALLATION_ID = Deno.env.get('WIRRE_GITHUB_INSTALLATION_ID');
const WIRRE_ORG = Deno.env.get('WIRRE_GITHUB_ORG') || 'wirrecompany';

interface RequestBody {
  assessmentId: string;
  anonymousId: string;
}

// Helper functions for JWT generation
function base64urlEncode(data: string | ArrayBuffer): string {
  let str: string;
  if (typeof data === 'string') {
    str = btoa(unescape(encodeURIComponent(data)));
  } else {
    str = btoa(String.fromCharCode(...new Uint8Array(data)));
  }
  return str.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
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

async function generateJWT(payload: any, appId: string, privateKey: string): Promise<string> {
  const formattedKey = privateKey.replace(/\\n/g, '\n');
  
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

// Get installation access token
async function getInstallationToken(installationId: string, appId: string, privateKey: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iat: now - 60,
    exp: now + (10 * 60),
    iss: appId,
  };

  const jwt = await generateJWT(payload, appId, privateKey);

  const response = await fetch(
    `https://api.github.com/app/installations/${installationId}/access_tokens`,
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
    throw new Error(`Failed to get installation token: ${await response.text()}`);
  }

  const data = await response.json();
  return data.token;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { assessmentId, anonymousId }: RequestBody = await req.json();

    if (!assessmentId || !anonymousId) {
      return new Response(
        JSON.stringify({ error: 'assessmentId and anonymousId are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create client with service key to bypass RLS
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get the user from the auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(authHeader.replace('Bearer ', ''));
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify registration exists and repo is provisioned
    const { data: registration, error: regError } = await supabaseClient
      .from('assessment_registrations')
      .select('id, anonymous_id, repo_provisioned, private_repo_url, assessment_id, user_id, ai_score, ai_report, ai_peer_review_score, ai_peer_review_report, score')
      .eq('assessment_id', assessmentId)
      .eq('anonymous_id', anonymousId)
      .single();

    if (regError || !registration || !registration.repo_provisioned) {
      return new Response(JSON.stringify({ error: 'Submission not found or repo not provisioned' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check permissions: User must be the candidate OR the company owner OR the assigned PEER REVIEWER
    let isAuthorized = false;

    // 1. Is it the candidate?
    if (registration.user_id === user.id) {
       isAuthorized = true;
    }

    if (!isAuthorized) {
        // 2. Is it the assigned peer reviewer?
        const { data: reviewerReg } = await supabaseClient
            .from('assessment_registrations')
            .select('assigned_peer_registration_id, peer_review_repo_url')
            .eq('assessment_id', assessmentId)
            .eq('user_id', user.id)
            .maybeSingle();

        if (reviewerReg && (
          reviewerReg.assigned_peer_registration_id === registration.id ||
          (reviewerReg.peer_review_repo_url && reviewerReg.peer_review_repo_url === registration.private_repo_url)
        )) {
            isAuthorized = true;
        }
    }

    if (!isAuthorized) {
       // 3. Is it the company owner?
       const { data: assessment } = await supabaseClient
         .from('assessments')
         .select('company_user_id')
         .eq('id', assessmentId)
         .single();
       
       if (assessment?.company_user_id === user.id) {
          isAuthorized = true;
       }
    }

    if (!isAuthorized) {
          return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
    }

    // Extract repo name from URL: https://github.com/wirrecompany/assessment-123-CAND-ABC
    const repoName = registration.private_repo_url.split('/').pop();

    // Get GitHub access token
    const token = await getInstallationToken(WIRRE_INSTALLATION_ID!, GITHUB_APP_ID!, GITHUB_PRIVATE_KEY!);

    // Download repository as zipball
    const zipResponse = await fetch(
      `https://api.github.com/repos/${WIRRE_ORG}/${repoName}/zipball/main`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
        },
      }
    );

    if (!zipResponse.ok) {
      const errorText = await zipResponse.text();
      console.error('GitHub zipball download failed:', errorText);
      throw new Error(`Failed to download repository: ${zipResponse.status} ${zipResponse.statusText} - ${errorText}`);
    }

    // Get the zip data as array buffer
    const zipArrayBuffer = await zipResponse.arrayBuffer();
    
    // Convert ArrayBuffer to Uint8Array
    const uint8Array = new Uint8Array(zipArrayBuffer);

    // Unzip the downloaded zipball
    const unzipped = unzipSync(uint8Array);

    // Determine the root directory name of the github zipball
    const rootDir = Object.keys(unzipped).length > 0 ? Object.keys(unzipped)[0].split('/')[0] + '/' : '';

    // Create the text files
    const aiCodeReport = registration.ai_report || 'No AI Code Report available.';
    const aiPeerReport = registration.ai_peer_review_report || 'No AI Peer Report available.';
    const scoreText = `AI Code Score: ${registration.ai_score ?? 'N/A'}/10
AI Peer Score: ${registration.ai_peer_review_score ?? 'N/A'}/10
Manual Score: ${registration.score ?? 'N/A'}/10
Total Score (AI + Peer): ${(registration.ai_score ?? 0) + (registration.ai_peer_review_score ?? 0)}/20`;

    // Add them to the unzipped structure
    unzipped[`${rootDir}ai code report.txt`] = strToU8(aiCodeReport);
    unzipped[`${rootDir}ai peer report.txt`] = strToU8(aiPeerReport);
    unzipped[`${rootDir}score.txt`] = strToU8(scoreText);

    // Rezip the modified files
    const newZip = zipSync(unzipped);

    // Convert newZip (Uint8Array) to base64 efficiently
    let binaryString = '';
    const chunkSize = 8192; // Process in chunks to avoid stack overflow
    for (let i = 0; i < newZip.length; i += chunkSize) {
      const chunk = newZip.subarray(i, Math.min(i + chunkSize, newZip.length));
      binaryString += String.fromCharCode(...chunk);
    }
    const zipBase64 = btoa(binaryString);

    return new Response(
      JSON.stringify({
        success: true,
        zipData: zipBase64,
        fileName: `${anonymousId}-submission.zip`,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error downloading submission:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
