import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function hmacSignVariants(secret: string, payload: string) {
  const enc = new TextEncoder()
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(payload))
  const bytes = new Uint8Array(sig)
  const hex = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')
  // base64
  const base64 = btoa(String.fromCharCode(...bytes))
  return { hex, base64 }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const secret = Deno.env.get('RAZORPAY_KEY_SECRET')
  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
  const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE') || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

  if (!secret || !SUPABASE_URL || !SERVICE_KEY) {
    return new Response(JSON.stringify({ ok: false, error: 'Missing configuration' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }

  // Read raw body for signature verification
  const raw = await req.text()
  const signature = req.headers.get('x-razorpay-signature') || ''
  try {
    const expected = await hmacSignVariants(secret, raw)
    if (signature !== expected.hex && signature !== expected.base64) {
      // signature mismatch
      return new Response(JSON.stringify({ ok: false, error: 'Invalid signature', expected }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: 'Signature check error', detail: String(err) }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }

  // parse body
  let event
  try { event = JSON.parse(raw) } catch (e) { return new Response(JSON.stringify({ ok: false, error: 'Invalid JSON' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }) }

  // We care about payment captured events
  const eventType = event.event || ''
  const payload = event.payload || {}

  try {
    let order_id = ''
    if (payload.payment && payload.payment.entity && payload.payment.entity.order_id) order_id = payload.payment.entity.order_id

    if (!order_id) {
      return new Response(JSON.stringify({ ok: false, error: 'No order_id in payload' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // fetch the order to read notes
    const RAZOR_KEY = Deno.env.get('RAZORPAY_KEY_ID')
    const RAZOR_SECRET = secret
    const orderResp = await fetch(`https://api.razorpay.com/v1/orders/${order_id}`, {
      method: 'GET',
      headers: { 'Authorization': 'Basic ' + btoa(`${RAZOR_KEY}:${RAZOR_SECRET}`) }
    })
    const order = await orderResp.json()
    const assessment_id = order.notes && order.notes.assessment_id

    if (!assessment_id) {
      return new Response(JSON.stringify({ ok: false, error: 'No assessment_id on order notes' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // only act on payment captured
    if (eventType === 'payment.captured' || (payload.payment && payload.payment.entity && payload.payment.entity.status === 'captured')) {
      // Mark assessment as paid in Supabase
      const amount = (payload.payment.entity.amount || 0) / 100
      const url = `${SUPABASE_URL}/rest/v1/assessments?id=eq.${assessment_id}`
      const patch = { payment_confirmed: true, payment_amount: amount, payment_confirmed_at: new Date().toISOString() }
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
      const updated = await resp.json()
      return new Response(JSON.stringify({ ok: true, updated }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    return new Response(JSON.stringify({ ok: true, note: 'event ignored' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: String(err) }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
