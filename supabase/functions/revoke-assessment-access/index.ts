import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GITHUB_APP_ID = Deno.env.get('GITHUB_APP_ID')!;
const GITHUB_PRIVATE_KEY = Deno.env.get('GITHUB_PRIVATE_KEY')!;
const WIRRE_INSTALLATION_ID = Deno.env.get('WIRRE_GITHUB_INSTALLATION_ID')!;

// ============================================================================
// HELPER FUNCTIONS - Defined before serve()
// ============================================================================

function parseGithubUrl(url: string): { repoOwner: string; repoName: string } {
  try {
    const urlParts = url.replace(/\.git$/, '').split('/');
    const repoName = urlParts[urlParts.length - 1];
    const repoOwner = urlParts[urlParts.length - 2];
    return { repoOwner, repoName };
  } catch (err) {
    console.error('Error parsing GitHub URL:', url, err);
    return { repoOwner: '', repoName: '' };
  }
}

async function cancelPendingInvitations(
  repoOwner: string,
  repoName: string,
  username: string,
  token: string
): Promise<void> {
  try {
    // Check for pending invitations
    const invitationsResponse = await fetch(
      `https://api.github.com/repos/${repoOwner}/${repoName}/invitations`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
        },
      }
    );

    if (!invitationsResponse.ok) {
      console.log(`Could not fetch invitations: ${invitationsResponse.status}`);
    } else {
      const invitations = await invitationsResponse.json();
      console.log(`Found ${invitations.length} pending invitations`);

      const userInvitation = invitations.find((inv: any) => 
        inv.invitee?.login?.toLowerCase() === username.toLowerCase()
      );

      if (userInvitation) {
        console.log(`Cancelling invitation ${userInvitation.id} for ${username}`);
        
        const cancelResponse = await fetch(
          `https://api.github.com/repos/${repoOwner}/${repoName}/invitations/${userInvitation.id}`,
          {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Accept': 'application/vnd.github+json',
              'X-GitHub-Api-Version': '2022-11-28',
            },
          }
        );

        if (cancelResponse.ok || cancelResponse.status === 204) {
          console.log(`✓ Cancelled invitation for ${username}`);
        }
      } else {
        console.log(`No pending invitation found for ${username}`);
      }
    }

    // Also check if user has access via team
    const teamsResponse = await fetch(
      `https://api.github.com/repos/${repoOwner}/${repoName}/teams`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
        },
      }
    );

    if (teamsResponse.ok) {
      const teams = await teamsResponse.json();
      console.log(`Found ${teams.length} teams with access to repo`);
      
      for (const team of teams) {
        // Check if user is in this team
        const teamMemberResponse = await fetch(
          `https://api.github.com/orgs/${repoOwner}/teams/${team.slug}/memberships/${username}`,
          {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Accept': 'application/vnd.github+json',
              'X-GitHub-Api-Version': '2022-11-28',
            },
          }
        );
        
        if (teamMemberResponse.status === 200) {
          console.log(`⚠️  User ${username} is in team ${team.name} which has access to this repo`);
          console.log(`   Consider removing team access or removing user from team`);
        }
      }
    }

  } catch (err) {
    console.error('Error checking invitations/teams:', err);
  }
}

async function verifyCollaboratorRemovedWithRetry(
  repoOwner: string,
  repoName: string,
  username: string,
  token: string,
  maxRetries: number = 3,
  delayMs: number = 3000
): Promise<boolean> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      console.log(`Verification attempt ${attempt + 1}/${maxRetries} for ${username}`);
      
      const verifyResponse = await fetch(
        `https://api.github.com/repos/${repoOwner}/${repoName}/collaborators/${username}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/vnd.github+json',
            'X-GitHub-Api-Version': '2022-11-28',
          },
        }
      );

      console.log(`Verification status for ${username}: ${verifyResponse.status}`);

      if (verifyResponse.status === 404) {
        console.log(`✓ Confirmed: ${username} is not a collaborator`);
        return false;
      }

      if (verifyResponse.status === 204) {
        if (attempt < maxRetries - 1) {
          console.log(`Still a collaborator, waiting ${delayMs}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, delayMs));
          continue;
        }
        console.error(`✗ Still a collaborator after ${maxRetries} attempts`);
        return true;
      }

      console.warn(`Unexpected status ${verifyResponse.status}, treating as still collaborator`);
      return true;

    } catch (err) {
      console.error(`Error verifying collaborator removal (attempt ${attempt + 1}):`, err);
      if (attempt < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
        continue;
      }
      return true;
    }
  }
  
  return true;
}

async function getInstallationToken(installationId: number): Promise<{ token: string; accountLogin: string }> {
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iat: now - 60,
    exp: now + (10 * 60),
    iss: GITHUB_APP_ID,
  };

  const jwt = await generateJWT(payload);

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

  const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, data);

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

// ============================================================================
// MAIN HANDLER
// ============================================================================

// Main handler logic was replaced in previous step. 
// This tool call is just ensuring there are no overlapping leftovers if the previous step didn't cover lines 287-330 perfectly.
// Actually, I replaced widely in the previous step (lines 331 upwards coverage).
// Let me verify the file content first to ensure the replacement was clean.

// ... (previous imports and helpers remain checks)

async function revokeAccessForRegistrations(
  registrations: any[],
  installationToken: string,
  supabase: any
): Promise<any[]> {
  const results = [];

  for (const registration of registrations) {
    try {
      if (!registration.github_username) {
        console.error(`Registration ${registration.id} has no github_username`);
        results.push({
          userId: registration.user_id,
          success: false,
          error: 'No GitHub username'
        });
        continue;
      }

      if (!registration.private_repo_url) {
        console.error(`Registration ${registration.id} has no private_repo_url`);
        results.push({
          userId: registration.user_id,
          success: false,
          error: 'No repo URL'
        });
        continue;
      }

      const { repoOwner, repoName } = parseGithubUrl(registration.private_repo_url);
      
      if (!repoOwner || !repoName) {
        results.push({
          userId: registration.user_id,
          success: false,
          error: 'Invalid GitHub URL format'
        });
        continue;
      }

      console.log(`Revoking access from ${registration.github_username} for ${repoOwner}/${repoName}`);

      // Step 1: Cancel any pending invitations
      await cancelPendingInvitations(repoOwner, repoName, registration.github_username, installationToken);

      // Step 2: Remove from specific repository only (NOT org-wide to avoid affecting other assessments)
      let removeSuccess = false;
      for (let attempt = 0; attempt < 2; attempt++) {
        console.log(`Repo removal attempt ${attempt + 1}/2 for ${registration.github_username}`);
        
        const removeResponse = await fetch(
          `https://api.github.com/repos/${repoOwner}/${repoName}/collaborators/${registration.github_username}`,
          {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${installationToken}`,
              'Accept': 'application/vnd.github+json',
              'X-GitHub-Api-Version': '2022-11-28',
            },
          }
        );

        console.log(`Repo removal response status: ${removeResponse.status}`);

        if (removeResponse.ok || removeResponse.status === 204 || removeResponse.status === 404) {
          removeSuccess = true;
          console.log(`Repo removal attempt ${attempt + 1} succeeded`);
          break;
        } else {
          const error = await removeResponse.text();
          console.error(`Failed to remove collaborator (attempt ${attempt + 1}):`, error);
          if (attempt === 1) {
            results.push({
              userId: registration.user_id,
              success: false,
              error: `GitHub API error after 2 attempts: ${error}`
            });
            continue;
          }
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
      }

      if (!removeSuccess) {
        console.error(`Failed to remove ${registration.github_username} after all attempts`);
        results.push({
          userId: registration.user_id,
          success: false,
          error: 'Failed to remove collaborator after multiple attempts'
        });
        continue;
      }

      console.log(`Waiting 5 seconds for GitHub to process removal in background...`); // Reduced from 10s for perf

      await new Promise(resolve => setTimeout(resolve, 5000));

      // Step 4: Final verification
      const isStillCollaborator = await verifyCollaboratorRemovedWithRetry(
        repoOwner,
        repoName,
        registration.github_username,
        installationToken,
        3, // Reduced retries
        5000 
      );

      if (isStillCollaborator) {
        console.error(`⚠️  ${registration.github_username} still appears as collaborator after extended wait`);
        
        // Update database anyway since DELETE returned success
        await supabase
          .from('assessment_registrations')
          .update({ 
            access_granted: false
          })
          .eq('id', registration.id);

        results.push({
          userId: registration.user_id,
          success: true, 
          githubUsername: registration.github_username,
          repoUrl: registration.private_repo_url,
          warning: 'Removal confirmed by API but verification shows delay.'
        });
        continue;
      }

      // Step 5: Update database
      const { error: updateError } = await supabase
        .from('assessment_registrations')
        .update({ 
          access_granted: false
        })
        .eq('id', registration.id);

      if (updateError) {
        console.error(`Failed to update registration ${registration.id}:`, updateError);
        results.push({
          userId: registration.user_id,
          success: false,
          error: `Database update failed: ${updateError.message}`
        });
        continue;
      }

      console.log(`✓ Successfully revoked and verified access for registration ${registration.id}`);
      results.push({
        userId: registration.user_id,
        success: true,
        githubUsername: registration.github_username,
        repoUrl: registration.private_repo_url
      });

    } catch (err: any) {
      console.error(`Error revoking access from ${registration.github_username}:`, err);
      results.push({
        userId: registration.user_id,
        success: false,
        error: err.message
      });
    }
  }
  return results;
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { assessmentId, action, candidateUserId } = await req.json();

    if (!WIRRE_INSTALLATION_ID) {
      throw new Error('WIRRE GitHub installation not configured');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    let registrationsToProcess = [];

    // Mode 1: Cleanup Expired (Batch)
    if (action === 'cleanup_expired') {
      console.log('Running cleanup_expired job...');
      
      // Fetch all active registrations with their assessment details
      // Include started_at and total_paused_ms for true expiry calculation
      const { data: activeRegs, error: fetchError } = await supabase
        .from('assessment_registrations')
        .select('*, assessments!inner(is_sample, start_at, duration_minutes)')
        .eq('access_granted', true)
        .is('coding_finished_at', null); // Only cleanup those not already finished

      if (fetchError) throw fetchError;

      const now = Date.now();
      
      // Filter for expired ones
      registrationsToProcess = (activeRegs || []).filter((reg: any) => {
        const assessment = reg.assessments;
        if (!assessment) return false;

        let startTimeMs = 0;
        if (assessment.is_sample) {
          // For sample rounds, use the individual coding_started_at
          if (!reg.coding_started_at) return false; // Haven't even started yet
          startTimeMs = new Date(reg.coding_started_at).getTime();
        } else {
          // For scheduled rounds, use assessment start_at
          if (!assessment.start_at) return false;
          startTimeMs = new Date(assessment.start_at).getTime();
        }

        const durationMs = (assessment.duration_minutes || 0) * 60 * 1000;
        
        // True expiry = Start + Duration + 30s grace period
        const trueExpiryMs = startTimeMs + durationMs + 30000;

        return now > trueExpiryMs;
      });

      console.log(`Found ${registrationsToProcess.length} expired registrations to revoke out of ${activeRegs?.length || 0} active.`);

    } else if (assessmentId) {
      // Mode 2: Specific Assessment Revocation (Admin manual trigger OR Single User finish)
      console.log(`Revoking access for assessmentId: ${assessmentId}${candidateUserId ? ` and userId: ${candidateUserId}` : ''}`);
      
      let query = supabase
        .from('assessment_registrations')
        .select('id, user_id, github_username, private_repo_url');
        
      if (candidateUserId) {
          query = query.eq('assessment_id', assessmentId).eq('user_id', candidateUserId);
      } else {
          query = query.eq('assessment_id', assessmentId).eq('access_granted', true);
      }

      const { data, error } = await query;

      if (error) throw error;
      registrationsToProcess = data || [];

    } else {
        return new Response(JSON.stringify({ error: 'Missing assessmentId or valid action' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    if (registrationsToProcess.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No access to revoke', count: 0 }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get Token Once
    const { token: installationToken } = await getInstallationToken(parseInt(WIRRE_INSTALLATION_ID));

    // Execute Batch
    const results = await revokeAccessForRegistrations(registrationsToProcess, installationToken, supabase);

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    return new Response(
      JSON.stringify({
        message: `Processed revocation for ${registrationsToProcess.length} candidates`,
        successCount,
        failureCount,
        results,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error: any) {
    console.error('Error in revoke-assessment-access:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});