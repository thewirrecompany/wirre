import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Parse request body to check for specific target (Test Mode)
    let emails: string[] = []
    let targetEmail: string | undefined

    try {
      const body = await req.json()
      targetEmail = body.target_email
    } catch {
      // Body might be empty, ignore
    }

    if (targetEmail) {
      console.log(`Test Mode: Sending only to ${targetEmail}`)
      emails = [targetEmail]
    } else {
      // 1. Fetch all emails from the waitlist
      const { data: waitlistData, error: waitlistError } = await supabaseClient
        .from('waitlist')
        .select('email')

      if (waitlistError) throw waitlistError
      emails = waitlistData.map(w => w.email)
      console.log(`Found ${emails.length} emails in waitlist.`)
    }

    const results = []

    // 2. Loop and Send "Recovery" Email (for existing users)
    for (const email of emails) {
      try {
        // Since users are already registered (migrated), we trigger a "Reset Password" flow
        // effectively inviting them to set their password.
        const { data, error } = await supabaseClient.auth.resetPasswordForEmail(email, {
          redirectTo: 'https://wirre.vercel.app/set-password'
        })

        if (error) {
          console.error(`Failed to send reset link to ${email}:`, error)
          results.push({ email, status: 'failed', error })
        } else {
          console.log(`Sent reset link to ${email}`)
          results.push({ email, status: 'sent' })
        }
        
        // Rate limit protection
        await new Promise(resolve => setTimeout(resolve, 500))

      } catch (err: any) {
        console.error(`Error processing ${email}:`, err)
        results.push({ 
          email, 
          status: 'error', 
          error: err instanceof Error ? err.message : String(err) 
        })
      }
    }

    return new Response(
      JSON.stringify({ 
        message: "Beta announcement sequence completed.",
        total_found: emails.length,
        results
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
