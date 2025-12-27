import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const body = await req.json();
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
    const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE') || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    if (!SUPABASE_URL || !SERVICE_KEY) {
      return new Response(JSON.stringify({ ok: false, error: 'Supabase service key or url not configured' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // If assessment_id provided, mark paid
    if (body.assessment_id) {
      const url = `${SUPABASE_URL}/rest/v1/assessments?id=eq.${body.assessment_id}`
      const patch = {
        payment_confirmed: true,
        payment_amount: body.amount || 0,
        payment_confirmed_at: new Date().toISOString()
      }
      const resp = await fetch(url, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SERVICE_KEY,
          'Authorization': `Bearer ${SERVICE_KEY}`,
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(patch)
      })
      const data = await resp.json()
      return new Response(JSON.stringify({ ok: true, updated: data }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // Otherwise, insert a new assessment draft and mark paid
    if (body.payload) {
      const url = `${SUPABASE_URL}/rest/v1/assessments`
      const payload = {
        ...body.payload,
        payment_confirmed: true,
        payment_amount: body.amount || 0,
        payment_confirmed_at: new Date().toISOString()
      }
      const resp = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SERVICE_KEY,
          'Authorization': `Bearer ${SERVICE_KEY}`,
          'Prefer': 'return=representation'
        },
        body: JSON.stringify([payload])
      })
      const data = await resp.json()
      return new Response(JSON.stringify({ ok: true, inserted: data }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    return new Response(JSON.stringify({ ok: false, error: 'Missing assessment_id or payload' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: String(err) }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
