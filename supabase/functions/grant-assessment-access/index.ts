import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GITHUB_APP_ID = Deno.env.get('GITHUB_APP_ID')!;
const GITHUB_PRIVATE_KEY = Deno.env.get('GITHUB_PRIVATE_KEY')!;

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { assessmentId, candidateUserId, candidateGithubUsername } = await req.json();

    if (!assessmentId) {
      return new Response(JSON.stringify({ error: 'Missing assessmentId' }), {
        status: 400,
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
      .select('id')
      .eq('id', assessmentId)
      .single();

    if (assessmentError || !assessment) {
      console.error('Assessment error:', assessmentError);
      return new Response(JSON.stringify({ error: 'Assessment not found', details: assessmentError?.message }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Use WIRRE's GitHub App installation (all repos are in WIRRE's org)
    const WIRRE_INSTALLATION_ID = Deno.env.get('WIRRE_GITHUB_INSTALLATION_ID');

    if (!WIRRE_INSTALLATION_ID) {
      return new Response(JSON.stringify({ error: 'WIRRE GitHub installation not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let query = supabase
      .from('assessment_registrations')
      .select('id, user_id, github_username, private_repo_url, access_granted, finished_at, access_revoked_at, total_paused_ms')
      .eq('assessment_id', assessmentId)
      .eq('repo_provisioned', true)
      .is('finished_at', null); // Only grant access if NOT finished

    // If targeting a specific user, we check them regardless of current access status (to support manual resumes)
    if (candidateUserId) {
        query = query.eq('user_id', candidateUserId);
    } else {
        // Bulk mode: only target those who need it
        query = query.eq('access_granted', false);
    }

    const { data: registrations, error: regError } = await query;

    if (regError) {
      throw new Error(`Failed to fetch registrations: ${regError.message}`);
    }

    if (!registrations || registrations.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No pending access grants found', count: 0 }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Generate installation access token for WIRRE's installation
    const { token: installationToken } = await getInstallationToken(parseInt(WIRRE_INSTALLATION_ID));

    const results = [];
    
    // Grant access to each candidate
    for (const registration of registrations) {
      try {
        // Extract owner and repo name from the full URL
        const urlParts = registration.private_repo_url.split('/');
        const repoOwner = urlParts[urlParts.length - 2];
        const repoName = urlParts[urlParts.length - 1];
        const targetUsername = registration.github_username;

        console.log(`Enforcing access for ${repoOwner}/${repoName} to ${targetUsername}`);

        // 1A. Fetch and cancel pending invitations for wrong users
        const invitationsResponse = await fetch(
          `https://api.github.com/repos/${repoOwner}/${repoName}/invitations`,
          {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${installationToken}`,
              'Accept': 'application/vnd.github+json',
              'X-GitHub-Api-Version': '2022-11-28',
            },
          }
        );

        if (invitationsResponse.ok) {
            const invitations = await invitationsResponse.json();
             console.log(`Found ${invitations.length} pending invitations.`);
             for (const inv of invitations) {
                const invitee = inv.invitee?.login;
                if (invitee && invitee.toLowerCase() !== targetUsername.toLowerCase()) {
                    console.log(`Cancelling dirty invitation for: ${invitee}`);
                    await fetch(
                        `https://api.github.com/repos/${repoOwner}/${repoName}/invitations/${inv.id}`,
                        {
                            method: 'DELETE',
                            headers: {
                                'Authorization': `Bearer ${installationToken}`,
                                'Accept': 'application/vnd.github+json',
                                'X-GitHub-Api-Version': '2022-11-28',
                            },
                        }
                    );
                }
             }
        } else {
             console.log('Failed to fetch invitations:', await invitationsResponse.text());
        }

        // 1B. Fetch current outside collaborators to clean up old/wrong ones
        // NOTE: 'affiliation=direct' finds users added to repo directly.
        // 'affiliation=outside' finds users who are not org members but have access.
        // We use 'outside' to be safer about not removing org owners, though direct adds usually show up in direct.
        // Let's stick to direct but also check outside if direect fails? No, simpler is better.
        // The issue might be that the user accepted the invite, so they are a collaborator.
        const collaboratorsResponse = await fetch(
            `https://api.github.com/repos/${repoOwner}/${repoName}/collaborators?affiliation=direct`,
            {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${installationToken}`,
                    'Accept': 'application/vnd.github+json',
                    'X-GitHub-Api-Version': '2022-11-28',
                },
            }
        );

        if (collaboratorsResponse.ok) {
            const collaborators = await collaboratorsResponse.json();
            console.log(`Found ${collaborators.length} direct collaborators: ${collaborators.map((c:any) => c.login).join(', ')}`);
            
            for (const collab of collaborators) {
                // If collaborator is NOT the target username, remove them
                if (collab.login.toLowerCase() !== targetUsername.toLowerCase()) {
                    console.log(`Removing dirty collaborator: ${collab.login}`);
                    const removeRes = await fetch(
                        `https://api.github.com/repos/${repoOwner}/${repoName}/collaborators/${collab.login}`,
                        {
                            method: 'DELETE',
                            headers: {
                                'Authorization': `Bearer ${installationToken}`,
                                'Accept': 'application/vnd.github+json',
                                'X-GitHub-Api-Version': '2022-11-28',
                            },
                        }
                    );
                    if (!removeRes.ok) {
                        console.error(`Failed to remove ${collab.login}: ${await removeRes.text()}`);
                    }
                }
            }
        } else {
             console.error('Failed to fetch collaborators:', await collaboratorsResponse.text());
        }

        // 2. Add (or re-verify) the correct candidate as collaborator
        const addCollaboratorResponse = await fetch(
          `https://api.github.com/repos/${repoOwner}/${repoName}/collaborators/${targetUsername}`,
          {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${installationToken}`,
              'Accept': 'application/vnd.github+json',
              'X-GitHub-Api-Version': '2022-11-28',
            },
            body: JSON.stringify({
              permission: 'push', // Write access
            }),
          }
        );

        if (!addCollaboratorResponse.ok) {
          const error = await addCollaboratorResponse.text();
          console.error(`Failed to add collaborator ${targetUsername}:`, error);
          results.push({ userId: registration.user_id, success: false, error });
          continue;
        }

        // Update registration to mark access as granted and calculate pause duration
        const updates: any = { access_granted: true, access_revoked_at: null };
        
        if (registration.access_revoked_at) {
          const pausedMs = Date.now() - new Date(registration.access_revoked_at).getTime();
          updates.total_paused_ms = (registration.total_paused_ms || 0) + Math.max(0, pausedMs);
          console.log(`Calculated pause duration for ${registration.github_username}: ${pausedMs}ms. New total: ${updates.total_paused_ms}ms`);
        }

        const { error: updateError } = await supabase
          .from('assessment_registrations')
          .update(updates)
          .eq('id', registration.id);

        if (updateError) {
          console.error(`Failed to update registration ${registration.id}:`, updateError);
        }

        results.push({ userId: registration.user_id, success: true });
      } catch (err: any) {
        console.error(`Error granting access to ${registration.github_username}:`, err);
        results.push({ userId: registration.user_id, success: false, error: err.message });
      }
    }

    const successCount = results.filter(r => r.success).length;

    return new Response(
      JSON.stringify({
        message: `Granted access to ${successCount} out of ${registrations.length} candidates`,
        results,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in grant-assessment-access:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

async function getInstallationToken(installationId: number): Promise<{ token: string, accountLogin: string }> {
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iat: now - 60,
    exp: now + (10 * 60),
    iss: GITHUB_APP_ID,
  };

  const jwt = await generateJWT(payload);

  // Get installation details to find the account login
  const installationResponse = await fetch(
    `https://api.github.com/app/installations/${installationId}`,
    {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${jwt}`,
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
    }
  );

  if (!installationResponse.ok) {
    throw new Error(`Failed to get installation details: ${await installationResponse.text()}`);
  }

  const installationData = await installationResponse.json();
  const accountLogin = installationData.account.login;

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
  return { token: data.token, accountLogin };
}

async function generateJWT(payload: any): Promise<string> {
  const formattedKey = GITHUB_PRIVATE_KEY.replace(/\\n/g, '\n');
  
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
