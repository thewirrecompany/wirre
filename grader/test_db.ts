import { createClient } from '@supabase/supabase-js';
import { config } from './src/config.js';

const supabase = createClient(config.supabaseUrl, config.supabaseServiceRoleKey);

async function check() {
  const { data } = await supabase
    .from('assessment_registrations')
    .select('anonymous_id, ai_score, ai_report')
    .eq('assessment_id', '30f694a8-db42-4bad-8566-3b7760694f2d')
    .not('ai_report', 'is', null)
    .limit(2);
  
  console.log(JSON.stringify(data, null, 2));
}

check();
