import fs from 'fs';
import path from 'path';

// ==========================================
// 1. CONFIGURATION
// ==========================================
// You MUST provide a GitHub Personal Access Token to avoid extreme rate limits.
// 1. Go to: https://github.com/settings/tokens
// 2. Click "Generate new token (classic)"
// 3. You don't need to check any boxes (public data only). Generate and paste it below:
const GITHUB_TOKEN = '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';

const MAX_EMAILS_TO_FIND = 1500; // Target amount of emails to extract
const OUTPUT_FILE = path.resolve(process.cwd(), 'scripts/github_leads.csv');

// We target top colleges in India (IIIT and NIT first, then IIT)
const searchQueries = [
  'location:India "IIIT" type:user',
  'location:India "NIT" type:user',
  'location:India "National Institute of Technology" type:user',
  'location:India "IIT" type:user',
  'location:India "Indian Institute of Technology" type:user'
];

// Helper to filter out club/admin emails
const emailBlacklist = ['club', 'admin', 'support', 'secy', 'dsc', 'gdsc', 'robotics', 'team', 'contact', 'info', 'cell'];
const isStudentEmail = (email) => {
  const lowerEmail = email.toLowerCase();
  for (const word of emailBlacklist) {
    if (lowerEmail.split('@')[0].includes(word)) return false;
  }
  return true;
};

// ==========================================
// 2. SCRAPING LOGIC
// ==========================================
async function fetchWithRetry(url, options = {}, retries = 3) {
  if (!GITHUB_TOKEN || GITHUB_TOKEN === 'YOUR_GITHUB_TOKEN_HERE') {
    console.error('❌ ERROR: You must add your GITHUB_TOKEN to the script first!');
    process.exit(1);
  }

  const headers = {
    'Authorization': `Bearer ${GITHUB_TOKEN}`,
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'WIRRE-Student-Scraper'
  };

  try {
    const res = await fetch(url, { ...options, headers });

    if (res.status === 403) {
      console.warn('⚠️ Rate limit hit! Waiting 10 seconds...');
      await new Promise(resolve => setTimeout(resolve, 10000));
      return fetchWithRetry(url, options, retries - 1);
    }

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    if (retries > 0) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      return fetchWithRetry(url, options, retries - 1);
    }
    return null;
  }
}

async function scrapeGitHubEmails() {
  console.log(`🚀 Starting GitHub OSINT Scraper...`);
  console.log(`Targeting: ${MAX_EMAILS_TO_FIND} valid student emails\n`);

  const extractedEmails = new Set();
  
  // 1. Read existing emails if file exists to avoid duplicates
  if (fs.existsSync(OUTPUT_FILE)) {
    try {
      const existingData = fs.readFileSync(OUTPUT_FILE, 'utf-8');
      const lines = existingData.split('\n');
      for (const line of lines) {
        if (line.includes('@')) {
          extractedEmails.add(line.trim());
        }
      }
      console.log(`Loaded ${extractedEmails.size} existing emails from ${OUTPUT_FILE}`);
    } catch (err) {
      console.warn("Could not read existing file, starting fresh.");
    }
  }

  const fileExists = fs.existsSync(OUTPUT_FILE);
  const csvStream = fs.createWriteStream(OUTPUT_FILE, { flags: 'a' });
  
  if (!fileExists || extractedEmails.size === 0) {
    csvStream.write('email\n'); // Write CSV Header only if new file
  }

  for (const query of searchQueries) {
    if (extractedEmails.size >= MAX_EMAILS_TO_FIND) break;

    console.log(`\n🔍 Searching query: [${query}]`);
    let page = 1;

    // GitHub search API returns max 1000 results per query (approx 34 pages at 30 per page)
    while (page <= 34 && extractedEmails.size < MAX_EMAILS_TO_FIND) {
      const searchUrl = `https://api.github.com/search/users?q=${encodeURIComponent(query)}&per_page=30&page=${page}`;
      const searchData = await fetchWithRetry(searchUrl);

      if (!searchData || !searchData.items || searchData.items.length === 0) {
        break; // No more results for this query
      }

      for (const user of searchData.items) {
        if (extractedEmails.size >= MAX_EMAILS_TO_FIND) break;

        // 1. Try to get public email directly from profile
        const profileData = await fetchWithRetry(user.url);
        let emailFound = profileData?.email;

        // 2. If profile email is hidden, perform deep extraction from recent public commits
        if (!emailFound) {
          const eventsData = await fetchWithRetry(`${user.url}/events/public`);
          if (eventsData && Array.isArray(eventsData)) {
            for (const event of eventsData) {
              if (event.type === 'PushEvent' && event.payload?.commits?.length > 0) {
                const commitEmail = event.payload.commits[0].author?.email;
                // Exclude noreply github emails
                if (commitEmail && !commitEmail.includes('noreply.github.com')) {
                  emailFound = commitEmail;
                  break;
                }
              }
            }
          }
        }

        if (emailFound && !extractedEmails.has(emailFound) && isStudentEmail(emailFound)) {
          extractedEmails.add(emailFound);
          csvStream.write(`${emailFound}\n`);
          console.log(`✅ Found: ${emailFound} (${user.login})`);
        }

        // Small delay to respect GitHub API guidelines
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      page++;
    }
  }

  csvStream.end();
  console.log(`\n🎉 Scraping complete! Extracted ${extractedEmails.size} emails.`);
  console.log(`📂 Saved to: ${OUTPUT_FILE}`);
  console.log(`You can now copy these into your profiles_rows.csv and run the email blast!`);
}

scrapeGitHubEmails();
