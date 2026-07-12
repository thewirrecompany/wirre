import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing env variables");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function check() {
  console.log("--- Checking Auth Users ---");
  const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 1000
  });
  
  if (usersError) {
    console.error("Error fetching users:", usersError);
  } else {
    console.log(`Total users fetched: ${users.length}`);
    const suspicious = users.filter(u => 
      u.email.includes('test') || 
      u.email.includes('bot') || 
      u.email.includes('proxy') ||
      u.email.includes('direct') ||
      u.email.includes('baseline') ||
      u.email.includes('statuscheck')
    );
    console.log(`Suspicious users count (basic filter): ${suspicious.length}`);
    
    const recentUsers = users.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 30);
    console.log("\nMost recent 30 users:");
    recentUsers.forEach(u => console.log(`- ID: ${u.id}, Email: ${u.email}, Created: ${u.created_at}, Confirmed: ${u.email_confirmed_at != null}`));
  }

  console.log("\n--- Checking Profiles Table ---");
  const { data: profiles, count, error: profilesError } = await supabase.from('profiles').select('*', { count: 'exact' }).order('created_at', { ascending: false }).limit(30);
  
  if (profilesError) {
    console.error("Error fetching profiles:", profilesError);
  } else {
    console.log(`Total profiles (approx/exact): ${count}`);
    console.log("\nMost recent 30 profiles:");
    profiles.forEach(p => console.log(`- ID: ${p.id}, Status: ${p.status || 'N/A'}, Created: ${p.created_at}`));
  }
}

check();
