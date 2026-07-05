import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';

// ==========================================
// 1. CREDENTIALS (LOAD BALANCING)
// ==========================================
const SENDER_ACCOUNTS = [
  {
    user: 'thewirrecompanybackup@gmail.com',
    pass: '***REMOVED***'
  }
];

// ==========================================
// 2. READ EMAILS FROM CSV
// ==========================================
const csvPath = path.resolve(process.cwd(), 'scripts/github_leads.csv');
const sentTrackerPath = path.resolve(process.cwd(), 'scripts/sent_emails.txt');

// Load already sent emails to avoid double-sending
let sentEmails = new Set();
if (fs.existsSync(sentTrackerPath)) {
  const sentData = fs.readFileSync(sentTrackerPath, 'utf-8');
  sentData.split('\n').forEach(e => {
    if (e.trim()) sentEmails.add(e.trim().toLowerCase());
  });
}

let emails = [];

try {
  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi;
  const matches = csvContent.match(emailRegex);
  if (matches) {
    for (const match of matches) {
      const email = match.toLowerCase();
      if (!sentEmails.has(email)) {
        emails.push(email);
      }
    }
    emails = [...new Set(emails)];
  }
} catch (err) {
  console.error('Could not read scripts/github_leads.csv. Please ensure it exists.');
  process.exit(1);
}

// Ensure we leave the main account completely alone for OTPs. 
// Backup account has a limit of 500, so we cap at 450 to be safe.
const MAX_SENDS = 450;
if (emails.length > MAX_SENDS) {
  console.log(`⚠️ Limiting blast to ${MAX_SENDS} emails to respect the single account limit.`);
  emails = emails.slice(0, MAX_SENDS);
}

if (emails.length === 0) {
  console.log('✅ All emails in the CSV have already been sent! Waiting for new emails...');
  process.exit(0);
}

// ==========================================
// 3. SETUP MAILERS & HTML
// ==========================================
const transporters = SENDER_ACCOUNTS.map(acc => ({
  user: acc.user,
  transporter: nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: acc.user,
      pass: acc.pass,
    },
  })
}));

const generateHtml = () => `
<!DOCTYPE html>
<html>
<head>
<style>
  body {
    background-color: #000000;
    margin: 0;
    padding: 0;
    font-family: 'Courier New', Courier, monospace;
    text-align: center;
    color: #ffffff;
  }
  .container {
    max-width: 600px;
    margin: 0 auto;
    background-color: #000000;
    padding: 20px;
  }
  .logo {
    font-size: 24px;
    font-weight: bold;
    letter-spacing: 6px;
    margin-bottom: 20px;
    color: #ffffff;
    text-transform: uppercase;
  }
  .poster {
    width: 100%;
    height: auto;
    border: 1px solid #333333;
    border-radius: 8px;
    margin-bottom: 30px;
  }
  .btn {
    display: inline-block;
    background-color: #ff3333;
    color: #ffffff;
    text-decoration: none;
    font-size: 16px;
    font-weight: bold;
    padding: 15px 30px;
    border-radius: 4px;
    letter-spacing: 2px;
    text-transform: uppercase;
    margin-bottom: 40px;
  }
  .footer {
    font-size: 10px;
    color: #666666;
    line-height: 1.5;
  }
</style>
</head>
<body>
  <div class="container">
    <div class="logo">W I R R E</div>
    
    <a href="https://wirre.in/">
      <img src="cid:promo-photo" class="poster" alt="WIRRE Runtime Zero - Build. Solve. Win." />
    </a>
    
    <a href="https://wirre.in/" class="btn">Register Now</a>
    
    <div class="footer">
      Made with <3 by the makers at IIIT Hyderabad.<br>
      This is a promotional email. If you'd prefer not to receive future updates, just reply with "UNSUBSCRIBE".<br>
      © 2026 WIRRE. ALL RIGHTS RESERVED.
    </div>
  </div>
</body>
</html>
`;

async function sendEmails() {
  console.log(`Starting email blast to ${emails.length} recipients using ${transporters.length} accounts...`);
  
  let currentAccountIndex = 0;
  
  const subjects = [
    "WIRRE'S First Round !! Register and Win Prizes !!",
    "WIRRE First Round - Register & Win Prizes!",
    "Register for WIRRE'S First Round & Win Prizes",
    "WIRRE Runtime Zero: First Round Registrations Open!"
  ];

  for (const email of emails) {
    try {
      const currentSender = transporters[currentAccountIndex];
      const randomSubject = subjects[Math.floor(Math.random() * subjects.length)];
      
      await currentSender.transporter.sendMail({
        from: `"WIRRE" <${currentSender.user}>`,
        to: email,
        subject: randomSubject,
        headers: {
          'List-Unsubscribe': `<mailto:${currentSender.user}?subject=unsubscribe>`
        },
        html: generateHtml(),
        attachments: [
          {
            filename: 'photo2.png',
            path: path.resolve('./scripts/photo2.png'),
            cid: 'promo-photo'
          }
        ]
      });
      console.log(`✅ Sent to ${email} (via ${currentSender.user})`);
      
      currentAccountIndex = (currentAccountIndex + 1) % transporters.length;
      fs.appendFileSync(sentTrackerPath, `${email}\n`);
      
      // Random delay between 3 to 7 seconds to simulate human sending and avoid spam filters
      const randomDelay = Math.floor(Math.random() * (7000 - 3000 + 1) + 3000);
      await new Promise(r => setTimeout(r, randomDelay));
    } catch (err) {
      console.error(`❌ Failed to send to ${email}:`, err.message);
    }
  }
  console.log("All emails processed!");
}

sendEmails();
