import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function confirmPayment(assessmentId, amount=0) {
  const { data, error } = await supabase.from('assessments').update({ payment_confirmed: true, payment_amount: amount, payment_confirmed_at: new Date().toISOString() }).eq('id', assessmentId);
  if (error) {
    console.error('Failed to confirm payment:', error);
    process.exit(1);
  }
  console.log('Confirmed payment for', assessmentId, 'amount', amount);
}

const id = process.argv[2];
const amount = parseFloat(process.argv[3] || '0');
if (!id) {
  console.error('Usage: node scripts/confirm-payment.js <assessment-id> [amount]');
  process.exit(1);
}

confirmPayment(id, amount).catch((e) => console.error(e));
