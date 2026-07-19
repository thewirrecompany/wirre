import nodemailer from 'nodemailer';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const supabaseUrl = 'https://YOUR_SUPABASE_PROJECT_ID.supabase.co';
const supabaseKey = 'YOUR_SUPABASE_SERVICE_ROLE_KEY';
const supabase = createClient(supabaseUrl, supabaseKey);

const SENDER_ACCOUNTS = [
  {
    user: 'YOUR_EMAIL@gmail.com',
    pass: 'YOUR_APP_PASSWORD'
  }
];

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: SENDER_ACCOUNTS[0].user,
    pass: SENDER_ACCOUNTS[0].pass,
  },
});

const profiles = [
  { email: 'nihargupta8078@gmail.com' }
];

async function main() {

  console.log(`Found ${profiles.length} profiles to email.`);

  const imagePath = path.resolve(process.cwd(), 'scripts/roundcancelled.png');

  for (const profile of profiles) {
    if (!profile.email) continue;
    
    const mailOptions = {
      from: 'WIRRE <thewirrecompanybackup@gmail.com>',
      to: profile.email,
      subject: 'Update regarding your round on WIRRE',
      html: `
<!DOCTYPE html>
<html>
<head>
<style>
  body { background-color: #000000; margin: 0; padding: 40px 20px; font-family: 'Courier New', Courier, monospace; text-align: center; color: #ffffff; }
  .container { max-width: 600px; margin: 0 auto; background-color: #000000; border: 1px solid #333333; padding: 20px; }
  .logo { font-size: 24px; font-weight: bold; letter-spacing: 6px; margin-bottom: 20px; color: #ffffff; text-transform: uppercase; }
  .poster { width: 100%; height: auto; border: 1px solid #333333; border-radius: 8px; margin-bottom: 30px; }
  .footer { font-size: 10px; color: #555555; margin-top: 40px; text-transform: uppercase; letter-spacing: 0.1em; }
</style>
</head>
<body>
  <div class="container">
    <div class="logo">WIRRE</div>
    <img src="cid:roundcancelled" alt="Round Cancelled" class="poster" />
    <div class="footer">Made with &lt;3 for developers<br>WIRRE Team</div>
  </div>
</body>
</html>`,
      attachments: [
        {
          filename: 'roundcancelled.png',
          path: imagePath,
          cid: 'roundcancelled'
        }
      ]
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log(`Email sent successfully to ${profile.email}`);
    } catch (err) {
      console.error(`Failed to send email to ${profile.email}:`, err);
    }
    
    // Add small delay to prevent rate limit
    await new Promise(r => setTimeout(r, 1000));
  }
}

main();
