import nodemailer from 'nodemailer';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// TODO: Load from environment variables or config
const SMTP_USER = process.env.SMTP_USER || 'thewirrecompany@gmail.com';
const SMTP_PASS = process.env.SMTP_PASS || 'xisn fkml ltiq evlc';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS,
  },
});

const generateHtml = (name: string) => `
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
    
    <p>Hi ${name}, your recent round has been graded!</p>

    <a href="https://wirre.in/candidate/rounds">
      <img src="cid:photo3" class="poster" alt="WIRRE Runtime Zero Grading Complete" />
    </a>
    
    <a href="https://wirre.in/candidate/rounds" class="btn">Go Check</a>
    
    <div class="footer">
      Made with <3 by the makers at IIIT Hyderabad.<br>
      © 2026 WIRRE. ALL RIGHTS RESERVED.
    </div>
  </div>
</body>
</html>
`;

export interface CandidateToNotify {
  email: string;
  name: string;
  registrationId: string;
}

export async function sendCompletionEmails(candidates: CandidateToNotify[]) {
  if (candidates.length === 0) return;
  
  console.log(`✉️  Sending grading completion emails to ${candidates.length} candidates...`);
  
  for (const candidate of candidates) {
    try {
      await transporter.sendMail({
        from: '"WIRRE" <' + SMTP_USER + '>',
        to: candidate.email,
        subject: "WIRRE - Your Round Has Been Graded!",
        html: generateHtml(candidate.name),
        attachments: [
          {
            filename: 'photo3.png',
            path: path.resolve(__dirname, '../../scripts/photo3.png'),
            cid: 'photo3'
          }
        ]
      });
      console.log(`✅ Sent grading notification to ${candidate.email}`);
      
      await new Promise(resolve => setTimeout(resolve, 1500));
    } catch (error) {
      console.error(`❌ Failed to send email to ${candidate.email}:`, error);
    }
  }
  
  console.log('✅ Email notification sweep complete.');
}
