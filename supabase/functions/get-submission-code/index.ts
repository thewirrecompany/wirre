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
    const { assessmentId, anonymousId, path } = await req.json();

    if (!assessmentId || !anonymousId) {
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

    // Get the user from the auth header to verify identity/role
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

    // Verify the assessment exists and get registration + company info to check ownership
    const { data: registration, error: regError } = await supabase
      .from('assessment_registrations')
      .select('id, user_id, private_repo_url, repo_provisioned, access_granted, assessments!inner(company_user_id)')
      .eq('assessment_id', assessmentId)
      .eq('anonymous_id', anonymousId)
      .single();

    if (regError || !registration || !registration.repo_provisioned) {
      console.error('Registration lookup failed:', { regError, hasReg: !!registration, repoProvisioned: registration?.repo_provisioned, assessmentId, anonymousId });
      return new Response(JSON.stringify({ error: 'Submission not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Registration found:', { id: registration.id, userId: registration.user_id, accessGranted: registration.access_granted, repoProvisioned: registration.repo_provisioned });
    console.log('Caller user.id:', user.id);

    // Access Control Logic
    const isCandidate = registration.user_id === user.id;
    console.log('isCandidate:', isCandidate);
    let isAuthorized = false;

    if (isCandidate) {
      // Candidates can only access if permission is explicitly granted (during assessment time)
      if (registration.access_granted) {
        isAuthorized = true;
      } else {
        // Check if self-review is active (peer review phase where assigned to self)
        const { data: myReg } = await supabase
            .from('assessment_registrations')
            .select('assigned_peer_registration_id, peer_review_repo_url')
            .eq('assessment_id', assessmentId)
            .eq('user_id', user.id)
            .single();
        
        if (myReg?.assigned_peer_registration_id === registration.id) {
            isAuthorized = true;
        } else {
            console.error('Candidate access denied: access_granted=false and not self-review', { myRegPeerRegId: myReg?.assigned_peer_registration_id, targetRegId: registration.id });
            return new Response(JSON.stringify({ error: 'Access revoked or not yet granted' }), {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }
      }
    } else {
      // Not the candidate? Check if Company Owner or Admin or PEER REVIEWER
      
      // 1. Check if Peer Reviewer
      const { data: reviewerReg, error: reviewerRegError } = await supabase
        .from('assessment_registrations')
        .select('id, assigned_peer_registration_id, peer_review_repo_url')
        .eq('assessment_id', assessmentId)
        .eq('user_id', user.id)
        .maybeSingle();
      
      console.log('Reviewer reg lookup:', { reviewerReg, reviewerRegError });
      console.log('Checking peer match (ID):', { assignedPeerRegId: reviewerReg?.assigned_peer_registration_id, targetRegId: registration.id });
      console.log('Checking peer match (URL):', { reviewerPeerRepoUrl: reviewerReg?.peer_review_repo_url, targetPrivateRepoUrl: registration.private_repo_url });

      if (reviewerReg && (
        reviewerReg.assigned_peer_registration_id === registration.id ||
        (reviewerReg.peer_review_repo_url && reviewerReg.peer_review_repo_url === registration.private_repo_url)
      )) {
          isAuthorized = true;
      }

      // 2. Check if user is the company owner for this assessment
      if (!isAuthorized && user.id === (registration.assessments as any).company_user_id) {
        isAuthorized = true;
      } 
      
      // 3. Fallback: Check if Admin
      if (!isAuthorized) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
        
        if (profile?.role === 'admin' || profile?.role === 'superadmin') {
          isAuthorized = true;
        }
      }

      console.log('Non-candidate isAuthorized:', isAuthorized);
    }

    if (!isAuthorized) {
        return new Response(JSON.stringify({ error: 'Unauthorized access to this repository' }), {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    // Extract repo name from URL: https://github.com/wirrecompany/assessment-123-CAND-ABC
    const repoName = registration.private_repo_url.split('/').pop();

    // Generate GitHub App installation token
    const { token } = await getInstallationToken(WIRRE_INSTALLATION_ID, GITHUB_APP_ID, GITHUB_PRIVATE_KEY);

    // Fetch repository contents
    const endpoint = path 
      ? `https://api.github.com/repos/${WIRRE_ORG}/${repoName}/contents/${path}`
      : `https://api.github.com/repos/${WIRRE_ORG}/${repoName}/contents`;

    const response = await fetch(endpoint, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('GitHub API error:', error);
      return new Response(JSON.stringify({ error: 'Failed to fetch code' }), {
        status: response.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();

    // If it's a file, decode base64 content
    if (data.type === 'file' && data.content) {
      const decodedContent = atob(data.content.replace(/\n/g, ''));
      return new Response(JSON.stringify({
        ...data,
        decoded_content: decodedContent
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // If it's a directory, return the list
    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// Helper function to generate GitHub App installation token
async function getInstallationToken(installationId: string, appId: string, privateKey: string) {
  // Generate JWT
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iat: now - 60,
    exp: now + (10 * 60),
    iss: appId,
  };

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

  // Exchange JWT for installation token
  const response = await fetch(
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

  if (!response.ok) {
    throw new Error(`Failed to get installation token: ${await response.text()}`);
  }

  const data = await response.json();
  return { token: data.token };
}

function base64url(input: string | Uint8Array): string {
  let str: string;
  if (typeof input === 'string') {
    str = btoa(input);
  } else {
    str = btoa(String.fromCharCode(...input));
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
