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
    console.log('Fetched order from Razorpay:', order)
    const notes = order.notes || {}
    const assessment_id = notes.assessment_id
    const company_id = notes.company_id
    const action = notes.action || null

    // only act on payment captured
    if (eventType === 'payment.captured' || (payload.payment && payload.payment.entity && payload.payment.entity.status === 'captured')) {
      const amount = (payload.payment.entity.amount || 0) / 100
      const confirmedAt = new Date().toISOString()

      // If this order was for deleting a company, ensure we have a company_id.
      // If missing, try to resolve it from the assessment referenced on the order.
      if (action === 'delete_company') {
        let targetCompanyId = company_id;
        if (!targetCompanyId && assessment_id) {
          try {
            console.log('No company_id in notes; fetching assessment to resolve company_user_id', assessment_id)
            const aResp = await fetch(`${SUPABASE_URL}/rest/v1/assessments?id=eq.${assessment_id}&select=company_user_id`, {
              method: 'GET',
              headers: {
                'apikey': SERVICE_KEY,
                'Authorization': `Bearer ${SERVICE_KEY}`
              }
            })
            const aText = await aResp.text().catch(() => '')
            console.log('Assessment fetch status:', aResp.status, 'body:', aText)
            try {
              const aJson = JSON.parse(aText)
              if (Array.isArray(aJson) && aJson[0] && aJson[0].company_user_id) targetCompanyId = aJson[0].company_user_id
            } catch (e) {
              console.warn('Failed to parse assessment fetch response', e)
            }
          } catch (err) {
            console.error('Failed to fetch assessment to resolve company id', String(err))
          }
        }

        if (targetCompanyId && targetCompanyId === '') targetCompanyId = null
        if (targetCompanyId) {
          // proceed with deletion using resolved company id
          company_id = targetCompanyId
        } else {
          console.warn('Unable to determine company_id for delete_company action; aborting deletion', { notes, assessment_id })
          return new Response(JSON.stringify({ ok: false, error: 'Unable to determine company_id for delete_company action', notes, assessment_id }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }
      }

      if (action === 'delete_company' && company_id) {
        // Perform deletion using REST endpoints with service role key to ensure proper privilege
        try {
          console.log('delete_company action detected for company_id=', company_id)
          // 1) Delete assessments belonging to this company (will cascade related rows)
          const delAssess = await fetch(`${SUPABASE_URL}/rest/v1/assessments?company_user_id=eq.${company_id}`, {
            method: 'DELETE',
            headers: {
              'apikey': SERVICE_KEY,
              'Authorization': `Bearer ${SERVICE_KEY}`,
              'Prefer': 'return=representation'
            }
          })
          const delAssessText = await delAssess.text().catch(() => '')
          console.log('Deleted assessments response status:', delAssess.status, 'body:', delAssessText)
          let deletedAssess = null
          try { deletedAssess = JSON.parse(delAssessText) } catch(e) { deletedAssess = delAssessText }

          // 2) Delete companies record
          const delCompany = await fetch(`${SUPABASE_URL}/rest/v1/companies?user_id=eq.${company_id}`, {
            method: 'DELETE',
            headers: {
              'apikey': SERVICE_KEY,
              'Authorization': `Bearer ${SERVICE_KEY}`,
              'Prefer': 'return=representation'
            }
          })
          const delCompanyText = await delCompany.text().catch(() => '')
          console.log('Deleted company response status:', delCompany.status, 'body:', delCompanyText)
          let deletedCompany = null
          try { deletedCompany = JSON.parse(delCompanyText) } catch(e) { deletedCompany = delCompanyText }

          // 3) Delete profile (remove company from profiles table)
          const delProfile = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${company_id}`, {
            method: 'DELETE',
            headers: {
              'apikey': SERVICE_KEY,
              'Authorization': `Bearer ${SERVICE_KEY}`,
              'Prefer': 'return=representation'
            }
          })
          const delProfileText = await delProfile.text().catch(() => '')
          console.log('Deleted profile response status:', delProfile.status, 'body:', delProfileText)
          let deletedProfile = null
          try { deletedProfile = JSON.parse(delProfileText) } catch(e) { deletedProfile = delProfileText }

          return new Response(JSON.stringify({ ok: true, action: 'company_deleted', deletedAssess, deletedCompany, deletedProfile, notes }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        } catch (err) {
          console.error('Company delete via REST failed', String(err))
          return new Response(JSON.stringify({ ok: false, error: 'Company delete via REST failed', detail: String(err), notes }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }
      }

      // Otherwise, handle assessment payment
      if (assessment_id) {
        const url = `${SUPABASE_URL}/rest/v1/assessments?id=eq.${assessment_id}`
        const patch = { payment_confirmed: true, payment_amount: amount, payment_confirmed_at: confirmedAt }
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

      return new Response(JSON.stringify({ ok: false, error: 'No target found in order notes' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    return new Response(JSON.stringify({ ok: true, note: 'event ignored' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: String(err) }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
