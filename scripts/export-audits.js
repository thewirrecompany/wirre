import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function exportAudits() {
  const { data, error } = await supabase.from('assessment_audits').select('*').order('created_at', { ascending: true });
  if (error) {
    console.error('Failed to fetch audits:', error);
    process.exit(1);
  }

  const outPath = './logs/actions.log';
  const lines = (data || []).map((r) => JSON.stringify(r));
  fs.mkdirSync('./logs', { recursive: true });
  fs.writeFileSync(outPath, lines.join('\n') + '\n');
  console.log(`Wrote ${lines.length} audit lines to ${outPath}`);
}

exportAudits().catch((err) => {
  console.error(err);
});
