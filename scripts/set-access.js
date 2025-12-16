import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function setAccess(assessmentId) {
  const { data, error } = await supabase.from('assessments').update({ has_repo_access: true }).eq('id', assessmentId);
  if (error) {
    console.error('Failed to set access:', error);
    process.exit(1);
  }
  console.log('Set repo access for', assessmentId);
}

const id = process.argv[2];
if (!id) {
  console.error('Usage: node scripts/set-access.js <assessment-id>');
  process.exit(1);
}

setAccess(id).catch((e) => console.error(e));
