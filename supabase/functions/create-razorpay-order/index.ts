import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const body = await req.json();
    console.log('create-razorpay-order body:', body);
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
    const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE') || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const RAZOR_KEY = Deno.env.get('RAZORPAY_KEY_ID')
    const RAZOR_SECRET = Deno.env.get('RAZORPAY_KEY_SECRET')

    if (!RAZOR_KEY || !RAZOR_SECRET) {
      return new Response(JSON.stringify({ ok: false, error: 'Razorpay keys not configured' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }
    if (!SUPABASE_URL || !SERVICE_KEY) {
      return new Response(JSON.stringify({ ok: false, error: 'Supabase service key or url not configured' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const amount = Math.round((body.amount || 0) * 100); // rupees to paise
    if (!amount || amount <= 0) {
      return new Response(JSON.stringify({ ok: false, error: 'Invalid or zero amount', received: body.amount }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // If no assessment_id provided, create a draft assessment first so we can store notes
    let assessment_id = body.assessment_id || null
    if (!assessment_id) {
      if (!body.payload) return new Response(JSON.stringify({ ok: false, error: 'Missing payload to create assessment' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      const resp = await fetch(`${SUPABASE_URL}/rest/v1/assessments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SERVICE_KEY,
          'Authorization': `Bearer ${SERVICE_KEY}`,
          'Prefer': 'return=representation'
        },
        body: JSON.stringify([body.payload])
      })
      const inserted = await resp.json()
      if (!inserted || !inserted[0] || !inserted[0].id) return new Response(JSON.stringify({ ok: false, error: 'Failed to create assessment' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      assessment_id = inserted[0].id
    }

    // Create a short receipt (Razorpay requires <= 40 chars)
    const receipt = `wirre_${String(assessment_id).replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 32)}`;
    console.log('Using receipt:', receipt);

    // Create Razorpay order
    let orderResp
    try {
      orderResp = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Basic ' + btoa(`${RAZOR_KEY}:${RAZOR_SECRET}`)
      },
      body: JSON.stringify({
        amount,
          currency: 'INR',
          receipt,
          notes: { assessment_id }
      })
      })
    } catch (err) {
      console.error('Razorpay fetch error', String(err))
      return new Response(JSON.stringify({ ok: false, error: 'Razorpay request failed', details: String(err) }), { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    let order: any = null
    try {
      order = await orderResp.json()
    } catch (err) {
      const txt = await orderResp.text().catch(() => '<non-text response>')
      console.error('Razorpay returned non-json:', txt)
      return new Response(JSON.stringify({ ok: false, error: 'Razorpay returned non-json response', status: orderResp.status, body: txt }), { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    if (!order || !order.id) {
      console.error('Razorpay order creation failed', order)
      return new Response(JSON.stringify({ ok: false, error: 'Failed to create razorpay order', status: orderResp.status, details: order }), { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    return new Response(JSON.stringify({ ok: true, order_id: order.id, key: RAZOR_KEY, assessment_id }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: String(err) }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
