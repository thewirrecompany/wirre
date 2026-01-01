import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createAppAuth } from "https://esm.sh/@octokit/auth-app@5.0.0"
import { Octokit } from "https://esm.sh/octokit@3.1.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { owner, repo } = await req.json()
    console.log(`Checking repo: ${owner}/${repo}`);

    const octokit = new Octokit({
      authStrategy: createAppAuth,
      auth: {
        appId: Deno.env.get("GITHUB_APP_ID"),
        privateKey: Deno.env.get("GITHUB_PRIVATE_KEY")?.replace(/\\n/g, '\n'),
      },
    })

    try {
      // Step 2 below explains why we use this specific check
      const { data: installation } = await octokit.rest.apps.getRepoInstallation({
        owner,
        repo,
      })

      console.log(`Success! Installation ID: ${installation.id}`);
      return new Response(JSON.stringify({ ok: true, installation_id: installation.id }), 
        { headers: { ...corsHeaders, "Content-Type": "application/json" } })

    } catch (githubError: any) {
      console.error(`GitHub API Error: ${githubError.status} - ${githubError.message}`);
      
      const appSlug = Deno.env.get("GITHUB_APP_SLUG")
      return new Response(
        JSON.stringify({ 
          ok: false, 
          error: githubError.message, // This will now show the real error
          github_status: githubError.status,
          install_url: `https://github.com/apps/${appSlug}/installations/new` 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }
  } catch (error: any) {
    console.error(`Internal Function Error: ${error.message}`);
    return new Response(JSON.stringify({ ok: false, error: error.message }), 
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } })
  }
})