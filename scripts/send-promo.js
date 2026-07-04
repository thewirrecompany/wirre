import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';

// ==========================================
// 1. CREDENTIALS
// ==========================================
const SMTP_USER = 'thewirrecompany@gmail.com';
const SMTP_PASS = 'xisn fkml ltiq evlc'; 

// ==========================================
// 2. READ EMAILS FROM CSV
// ==========================================
// This expects profiles_rows.csv to be in the scripts folder
const csvPath = path.resolve(process.cwd(), 'scripts/profiles_rows.csv');
let emails = [];

try {
  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  // Extract all valid emails using a simple regex
  const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi;
  const matches = csvContent.match(emailRegex);
  if (matches) {
    // Remove duplicates
    emails = [...new Set(matches)];
  }
} catch (err) {
  console.error('Could not read profile_rows.csv. Please ensure it is in the wirre folder.');
  process.exit(1);
}

if (emails.length === 0) {
  console.error('No emails found in profile_rows.csv!');
  process.exit(1);
}

// ==========================================
// 3. SETUP MAILER & HTML
// ==========================================
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS,
  },
});

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
      You are receiving this because you registered on the WIRRE platform.<br>
      © 2026 WIRRE. ALL RIGHTS RESERVED.
    </div>
  </div>
</body>
</html>
`;

async function sendEmails() {
  console.log(`Starting email blast to ${emails.length} recipients...`);
  
  for (const email of emails) {
    try {
      await transporter.sendMail({
        from: '"WIRRE" <thewirrecompany@gmail.com>',
        to: email,
        subject: "WIRRE'S First Round !! Register and Win Prizes !!",
        html: generateHtml(),
        attachments: [
          {
            filename: 'photo.png',
            path: path.resolve('./scripts/photo.png'),
            cid: 'promo-photo' // same cid value as in the html img src
          }
        ]
      });
      console.log(`✅ Sent to ${email}`);
      
      // Sleep for 1.5 seconds between emails to prevent Gmail rate limits
      await new Promise(r => setTimeout(r, 1500));
    } catch (err) {
      console.error(`❌ Failed to send to ${email}:`, err.message);
    }
  }
  console.log("All emails processed!");
}

sendEmails();
