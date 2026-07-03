import nodemailer from 'nodemailer';

// ==========================================
// 1. CONFIGURE YOUR CREDENTIALS
// ==========================================
// Since you are using a Gmail address (thewirrecompany@gmail.com), 
// you need to generate an "App Password" in your Google Account.
// Go to: Google Account -> Security -> 2-Step Verification -> App Passwords
// Create one and paste it below (it's a 16-character code).
const SMTP_USER = 'thewirrecompany@gmail.com';
const SMTP_PASS = 'YOUR_APP_PASSWORD_HERE'; 

// ==========================================
// 2. ADD YOUR 150 EMAILS HERE
// ==========================================
const emails = [
  'test1@example.com',
  'test2@example.com',
  // copy paste all 150 emails here
];

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS,
  },
});

// ==========================================
// 3. YOUR CUSTOM HTML TEMPLATE
// ==========================================
// I reverse-engineered the exact CSS from your screenshot to make it look premium
const generateHtml = (email) => `
<!DOCTYPE html>
<html>
<head>
<style>
  body {
    background-color: #111111;
    color: #ffffff;
    font-family: 'Courier New', Courier, monospace;
    margin: 0;
    padding: 40px 0;
  }
  .container {
    max-width: 500px;
    margin: 0 auto;
    border: 1px solid #333333;
    padding: 40px;
    text-align: center;
  }
  .logo {
    font-size: 28px;
    font-weight: bold;
    letter-spacing: 6px;
    margin-bottom: 30px;
  }
  .subtitle {
    font-size: 11px;
    letter-spacing: 2px;
    color: #888888;
    margin-bottom: 20px;
    text-transform: uppercase;
  }
  hr {
    border: 0;
    border-top: 1px solid #333333;
    margin: 20px 0;
  }
  .content {
    font-size: 24px;
    font-weight: bold;
    letter-spacing: 4px;
    margin: 30px 0;
  }
  .footer-text {
    font-size: 11px;
    color: #888888;
    line-height: 1.6;
    margin-top: 30px;
  }
  .links {
    font-size: 10px;
    color: #888888;
    margin-top: 40px;
    text-transform: uppercase;
  }
  a {
    color: #3b82f6;
    text-decoration: underline;
  }
</style>
</head>
<body>
  <div class="container">
    <div class="logo">W I R R E</div>
    
    <div class="subtitle">RUNTIME ZERO INVITATION</div>
    
    <hr>
    
    <div class="content">
      THE ASSESSMENT IS LIVE
    </div>
    
    <hr>
    
    <div class="footer-text">
      We are launching Runtime Zero. It's time to prove your worth in the ultimate full-stack systems engineering challenge.
      <br><br>
      Secure your slot before they fill up.
    </div>
    
    <div class="links">
      BY USING OUR SERVICES, YOU AGREE TO THE<br>
      <a href="https://wirre.in/terms">TERMS & CONDITIONS</a>
      <br><br>
      © 2026 WIRRE. ALL RIGHTS RESERVED.
    </div>
  </div>
</body>
</html>
`;

async function sendEmails() {
  console.log(\`Starting email blast to \${emails.length} recipients...\`);
  
  for (const email of emails) {
    try {
      await transporter.sendMail({
        from: '"WIRRE" <thewirrecompany@gmail.com>',
        to: email,
        subject: 'WIRRE: Runtime Zero is Live', // Change your subject here
        html: generateHtml(email),
      });
      console.log(\`✅ Sent to \${email}\`);
      
      // Sleep for 1.5 seconds between emails to prevent Gmail rate limits
      await new Promise(r => setTimeout(r, 1500));
    } catch (err) {
      console.error(\`❌ Failed to send to \${email}:\`, err.message);
    }
  }
  console.log("All emails processed!");
}

sendEmails();
