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

    // 1. Find the SQL Engineer assessment
    const { data: sqlAssessment, error: assessmentError } = await supabaseClient
      .from('assessments')
      .select('id, title')
      .ilike('title', '%SQL%Engineer%')
      .single()

    if (assessmentError || !sqlAssessment) {
      throw new Error('SQL Engineer assessment not found')
    }

    console.log(`Found assessment: ${sqlAssessment.title} (${sqlAssessment.id})`)

    // 2. Get all candidates who were registered for this assessment
    const { data: registrations, error: regError } = await supabaseClient
      .from('assessment_registrations')
      .select('user_id')
      .eq('assessment_id', sqlAssessment.id)

    if (regError) throw regError

    console.log(`Found ${registrations?.length || 0} registrations`)

    if (!registrations || registrations.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No registrations found for SQL Engineer round' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 3. Get email addresses for these candidates
    const userIds = registrations.map(r => r.user_id)
    const { data: profiles, error: profileError } = await supabaseClient
      .from('profiles')
      .select('email')
      .in('id', userIds)

    if (profileError) throw profileError

    const emails = profiles.map(p => p.email)
    console.log(`Sending to ${emails.length} candidates`)

    const results = []

    // 4. Send email to each candidate using Supabase Auth's email system
    // We'll use the magic link email as a notification mechanism
    for (const email of emails) {
      try {
        // Send a custom email using Supabase Auth
        // Note: This will send the configured "Magic Link" template
        // You should customize the template in Supabase Dashboard to include the message
        const { error } = await supabaseClient.auth.admin.generateLink({
          type: 'magiclink',
          email: email,
          options: {
            redirectTo: 'https://wirre.vercel.app/candidate/opportunities'
          }
        })

        if (error) {
          console.error(`Failed to send email to ${email}:`, error)
          results.push({ email, status: 'failed', error: error.message })
        } else {
          console.log(`Sent notification to ${email}`)
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

    // 5. Delete the registrations so they can re-register
    const { error: deleteError } = await supabaseClient
      .from('assessment_registrations')
      .delete()
      .eq('assessment_id', sqlAssessment.id)

    if (deleteError) {
      console.error('Failed to delete registrations:', deleteError)
    } else {
      console.log('Successfully deleted all SQL Engineer registrations')
    }

    return new Response(
      JSON.stringify({ 
        message: "SQL round re-registration notification completed.",
        assessment: sqlAssessment.title,
        total_notified: emails.length,
        registrations_deleted: !deleteError,
        results
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
