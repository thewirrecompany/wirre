import * as fs from 'fs';

// 1. Manually parse .env to avoid needing the 'dotenv' package
const envContent = fs.readFileSync('.env', 'utf-8');
const envVars = {};
envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
        envVars[match[1].trim()] = match[2].trim().replace(/^"(.*)"$/, '$1').replace(/^'(.*)'$/, '$1');
    }
});

const supabaseUrl = envVars.VITE_SUPABASE_URL;
const supabaseKey = envVars.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase URL or Key in .env');
    process.exit(1);
}

// 2. Use native fetch to hit the Supabase REST API directly, avoiding the need for @supabase/supabase-js
async function extractEmails() {
    console.log('🔄 Fetching emails from profiles table...');

    try {
        const response = await fetch(`${supabaseUrl}/rest/v1/profiles?select=email`, {
            method: 'GET',
            headers: {
                'apikey': supabaseKey,
                'Authorization': `Bearer ${supabaseKey}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Error fetching from profiles table:', response.status, response.statusText);
            console.error('Details:', errorText);
            if (response.status === 401 || response.status === 403) {
                console.log('\n💡 TIP: Your Anon Key is being blocked by Row Level Security (RLS).');
                console.log('Please add your SUPABASE_SERVICE_ROLE_KEY to your .env file so the script can bypass RLS and read all emails.');
            }
            return;
        }

        const data = await response.json();

        // Filter out any null/undefined emails just in case
        const emails = data.map(record => record.email).filter(Boolean);

        if (emails.length === 0) {
            console.log('⚠️ No emails found in the profiles table.');
            return;
        }

        // Outlook uses semicolons (;) to separate multiple email recipients
        const formattedForOutlook = emails.join('; ');

        // Write directly to a text file
        fs.writeFileSync('emails_for_outlook.txt', formattedForOutlook);

        console.log(`✅ Successfully extracted ${emails.length} emails!`);
        console.log(`✅ Saved to 'emails_for_outlook.txt' in the current directory.`);
        console.log(`\n➡️  Next step: Open emails_for_outlook.txt, copy all the text, and paste it directly into the "Bcc" field in Outlook.`);
    } catch (err) {
        console.error('❌ Failed to extract emails:', err);
    }
}

extractEmails();
