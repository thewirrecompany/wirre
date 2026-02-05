import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { Resend } from 'https://esm.sh/resend@2.0.0'

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

    const resend = new Resend(Deno.env.get('RESEND_API_KEY'))

    // 1. Fetch all emails from the waitlist
    const { data: waitlistData, error: waitlistError } = await supabaseClient
      .from('waitlist')
      .select('email')

    if (waitlistError) throw waitlistError

    const emails = waitlistData.map(w => w.email)
    console.log(`Found ${emails.length} emails in waitlist.`)

    const results = []

    // 2. Loop and send (COMMENTED OUT FOR SAFETY)
    /*
    for (const email of emails) {
      try {
        const { data, error } = await resend.emails.send({
          from: 'WIRRE <team@wirre.com>', // Update this to your verified sender
          to: [email],
          subject: 'Beta Testing for Wirre is LIVE!',
          html: `
            <div style="font-family: monospace; color: #000;">
              <h1>WIRRE Beta is Open</h1>
              <p>The arena is ready. As a whitelisted member, you have early access.</p>
              <p>
                <strong>Action:</strong> Set your password and enter the dashboard.
              </p>
              <p>
                <a href="https://wirre.com/login" style="background: #000; color: #fff; padding: 10px 20px; text-decoration: none; display: inline-block;">
                  Enter the Arena
                </a>
              </p>
              <p style="margin-top: 30px; font-size: 12px; color: #666;">
                Compete in Commits.
              </p>
            </div>
          `
        })

        if (error) {
          console.error(`Failed to send to ${email}:`, error)
          results.push({ email, status: 'failed', error })
        } else {
          console.log(`Sent to ${email}`)
          results.push({ email, status: 'sent', id: data?.id })
        }
        
        // Rate limit protection (approx 2 emails/sec)
        await new Promise(resolve => setTimeout(resolve, 500))

      } catch (err) {
        console.error(`Error processing ${email}:`, err)
        results.push({ email, status: 'error', error: err })
      }
    }
    */

    return new Response(
      JSON.stringify({ 
        message: "Function ready. Email sending is currently DISABLED (commented out).",
        found_emails: emails.length,
        preview_emails: emails.slice(0, 5)
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
