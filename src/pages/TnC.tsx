import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Layout } from '@/components/layout/Layout';

export default function TnC() {
  const [activeTab, setActiveTab] = useState<'company' | 'candidate' | 'contributor'>('candidate');

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <h1 className="text-4xl font-bold mb-6 font-mono">Terms & Conditions</h1>

        {/* Tab Buttons - Scrollable on mobile */}
        <div className="overflow-x-auto mb-6 -mx-4 px-4">
          <div className="flex gap-3 min-w-max md:min-w-0">
            <Button
              variant={activeTab === 'candidate' ? 'default' : 'outline'}
              onClick={() => setActiveTab('candidate')}
              className="flex-shrink-0 md:flex-1 font-mono uppercase text-xs"
            >
              For Candidates
            </Button>
            <Button
              variant={activeTab === 'company' ? 'default' : 'outline'}
              onClick={() => setActiveTab('company')}
              className="flex-shrink-0 md:flex-1 font-mono uppercase text-xs"
            >
              For Organizers
            </Button>
            <Button
              variant={activeTab === 'contributor' ? 'default' : 'outline'}
              onClick={() => setActiveTab('contributor')}
              className="flex-shrink-0 md:flex-1 font-mono uppercase text-xs"
            >
              For Contributors
            </Button>
          </div>
        </div>

        {/* Content */}
        <Card className="border-border">
          <CardContent className="p-4 md:p-8 prose prose-slate dark:prose-invert max-w-none">
            {activeTab === 'candidate' ? <CandidateTerms /> : activeTab === 'company' ? <CompanyTerms /> : <ContributorTerms />}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}

function CandidateTerms() {
  return (
    <div>
      <h1>TERMS AND CONDITIONS FOR CANDIDATES</h1>
      <h2>Wirre Platform User Agreement</h2>
      <p>
        <strong>Effective Date: March 1, 2026</strong></p>
      <hr />

      <h2>1. ACCEPTANCE OF TERMS</h2>
      <p>By registering as a Candidate on the Wirre platform ("Platform"), you ("Candidate," "you," or "your") agree to be bound by these Terms and Conditions ("Terms"). If you do not agree to these Terms, you may not use the Platform.</p>
      <p>These Terms constitute a legally binding agreement between you and Wirre ("we," "us," or "our") governing your use of our assessment-based hiring platform and related services.</p>
      <hr />

      <h2>2. DEFINITIONS</h2>
      <p><strong>2.1</strong> "Assessment" means a technical evaluation created by an Organizer to test your skills, typically involving GitHub repository-based coding challenges.</p>
      <p><strong>2.2</strong> "Organizer" means a business entity using the Platform to conduct Assessments and hire Candidates.</p>
      <p><strong>2.3</strong> "Submission" means your code, documentation, or other materials submitted as part of an Assessment via the Platform.</p>
      <p><strong>2.4</strong> "Profile" means your account information including GitHub username, skills, experience, and Assessment history.</p>
      <hr />

      <h2>3. CANDIDATE REGISTRATION AND ACCOUNT</h2>
      <h3>3.1 Eligibility</h3>
      <ul>
        <li>Candidates of any age may register and participate in practice rounds.</li>
        <li>If you are under 18 years old, you may participate in practice rounds but are <strong>not eligible for paid rounds</strong> (rounds with job opportunities or monetary compensation).</li>
        <li>Only Candidates who are at least 18 years old and legally eligible to work in relevant jurisdictions may participate in paid rounds.</li>
        <li>You must provide accurate and truthful information</li>
        <li>You must have a valid GitHub account</li>
      </ul>
      <h3>3.2 Account Creation</h3>
      <ul>
        <li>You must provide a valid email address</li>
        <li>You must create a secure password</li>
        <li>You are responsible for maintaining account security</li>
        <li>One person may have only one Candidate account</li>
      </ul>
      <h3>3.3 Profile Information</h3>
      <ul>
        <li>You must keep your Profile information current and accurate</li>
        <li>You must not impersonate others or provide false credentials</li>
        <li>You may update your Profile at any time</li>
      </ul>
      <h3>3.4 Account Security</h3>
      <ul>
        <li>You are responsible for all activities under your account</li>
        <li>You must notify us immediately of unauthorized access</li>
        <li>You must not share account credentials</li>
        <li>We are not liable for losses from unauthorized access due to your negligence</li>
      </ul>
      <hr />

      <h2>4. PLATFORM SERVICES FOR CANDIDATES</h2>
      <h3>4.1 Free Service</h3>
      <ul>
        <li>All Platform services for Candidates are completely free</li>
        <li>You will never be charged to participate in Assessments</li>
        <li>You will never be charged for creating or maintaining your account</li>
      </ul>
      <h3>4.2 Assessment Opportunities</h3>
      <ul>
        <li>You may browse and apply to available Assessments</li>
        <li>Organizers set Assessment requirements and deadlines</li>
        <li>We do not guarantee Assessment availability or outcomes</li>
      </ul>
      <h3>4.3 GitHub Integration</h3>
      <ul>
        <li>Assessments use GitHub for code submission</li>
        <li>You must authorize our GitHub App to create forks</li>
        <li>We will create private forks of Organizer repositories for you</li>
      </ul>
      <h3>4.4 Assessment Participation</h3>
      <ul>
        <li>You may participate in multiple Assessments simultaneously</li>
        <li>You must meet Organizer-specified requirements</li>
        <li>You must submit work before deadlines</li>
        <li>Late submissions may not be accepted</li>
      </ul>
      <hr />

      <h2>5. SUBMISSION WORKFLOW</h2>
      <h3>5.1 Repository Access</h3>
      <ul>
        <li>Upon Assessment registration, we create a private fork for you</li>
        <li>You have full access to your fork for the Assessment duration</li>
        <li>You must not access or share Organizer repository content unauthorized</li>
      </ul>
      <h3>5.2 Submission Process</h3>
      <ul>
        <li>You develop your solution in your private fork</li>
        <li>You submit your work directly through the Platform</li>
        <li>Organizers make all evaluation and hiring decisions</li>
      </ul>
      <h3>5.3 Code Ownership</h3>
      <ul>
        <li>You retain all intellectual property rights to your code</li>
        <li>By submitting, you grant Organizers a limited license to review your work</li>
        <li>Organizers may not use your code commercially without separate agreement</li>
        <li>You may showcase your work in your portfolio (unless restricted by Organizer)</li>
      </ul>
      <h3>5.4 Collaboration Restrictions</h3>
      <ul>
        <li>Assessments must be completed independently unless stated otherwise</li>
        <li>You must not share solutions with other Candidates</li>
        <li>You must not use unauthorized assistance or plagiarized code</li>
        <li>Violations may result in disqualification and account termination</li>
      </ul>
      <hr />

      <h2>6. ASSESSMENT CONDUCT AND INTEGRITY</h2>
      <h3>6.1 Honest Participation</h3>
      <ul>
        <li>You must complete Assessments honestly and independently</li>
        <li>You must not use prohibited tools or resources</li>
        <li>You must follow all Organizer-specified rules and guidelines</li>
        <li>You must not attempt to cheat or circumvent Assessment requirements</li>
      </ul>
      <h3>6.2 Original Work</h3>
      <ul>
        <li>All Submissions must be your original work</li>
        <li>You may use open-source libraries as permitted</li>
        <li>You must properly attribute any third-party code or resources</li>
        <li>Plagiarism results in immediate disqualification</li>
      </ul>
      <h3>6.3 Prohibited Conduct</h3>
      <p>You must NOT:</p>
      <ul>
        <li>Share Assessment questions or solutions publicly</li>
        <li>Collaborate with others unless explicitly permitted</li>
        <li>Use multiple accounts to attempt the same Assessment</li>
        <li>Reverse-engineer or exploit Platform security</li>
        <li>Harass or abuse Organizers or other Candidates</li>
        <li>Submit malicious code or security vulnerabilities</li>
      </ul>
      <h3>6.4 Consequences of Violations</h3>
      <ul>
        <li>Immediate disqualification from current Assessment</li>
        <li>Account suspension or permanent ban</li>
        <li>Organizers will be notified of violations</li>
        <li>Legal action for severe violations (fraud, hacking, etc.)</li>
      </ul>
      <hr />

      <h2>7. DATA PRIVACY AND PROTECTION</h2>
      <h3>7.1 Information We Collect</h3>
      <ul>
        <li>Account information (email, name, GitHub username)</li>
        <li>Profile information (skills, experience, resume)</li>
        <li>Assessment participation and Submission data</li>
        <li>Usage data and analytics</li>
      </ul>
      <h3>7.2 How We Use Your Data</h3>
      <ul>
        <li>To facilitate Assessment participation</li>
        <li>To match you with relevant opportunities</li>
        <li>To communicate Assessment updates</li>
        <li>To improve Platform services</li>
        <li>To comply with legal obligations</li>
      </ul>
      <h3>7.3 Data Sharing</h3>
      <ul>
        <li>All submissions are anonymous regardless of round type (paid or unpaid)</li>
        <li>For paid rounds, Organizers cannot see your Profile until after final hiring decisions are made</li>
        <li>For unpaid rounds, your Profile remains hidden to maintain fairness and prevent bias</li>
        <li>Organizers access your Submissions and GitHub activity as permitted by the round type</li>
        <li>We do not sell your personal information to third parties</li>
        <li>We may share anonymized data for analytics</li>
      </ul>
      <h3>7.4 Data Security</h3>
      <ul>
        <li>We implement industry-standard security measures</li>
        <li>We encrypt sensitive data in transit and at rest</li>
        <li>We cannot guarantee absolute security</li>
        <li>You must report suspected security breaches</li>
      </ul>
      <h3>7.5 Data Retention</h3>
      <ul>
        <li>We retain account data while your account is active</li>
        <li>Assessment data is retained for record-keeping</li>
        <li>You may request data deletion (subject to legal requirements)</li>
        <li>Deleted data may persist in backups for up to 90 days</li>
      </ul>
      <h3>7.6 Your Data Rights</h3>
      <ul>
        <li>You may access your personal data</li>
        <li>You may correct inaccurate information</li>
        <li>You may request data deletion (with limitations)</li>
        <li>You may export your data in standard formats</li>
      </ul>
      <hr />

      <h2>8. INTELLECTUAL PROPERTY</h2>
      <h3>8.1 Platform Ownership</h3>
      <ul>
        <li>All Platform features, content, and functionality are owned by Wirre</li>
        <li>Our trademarks, logos, and branding are our exclusive property</li>
        <li>You may not use our intellectual property without permission</li>
      </ul>
      <h3>8.2 Your Content</h3>
      <ul>
        <li>You retain ownership of your Submissions and Profile content</li>
        <li>You grant us a license to display and process your content for Platform operation</li>
        <li>You grant Organizers a license to review your Submissions for hiring purposes</li>
      </ul>
      <h3>8.3 License Grant</h3>
      <p>By submitting content, you grant us a:</p>
      <ul>
        <li>Worldwide, non-exclusive, royalty-free license</li>
        <li>To use, display, and process your content for Platform services</li>
        <li>This license survives account termination for archived content</li>
      </ul>
      <h3>8.4 Third-Party Content</h3>
      <ul>
        <li>Organizers own their Assessment materials</li>
        <li>You receive a limited license to access Assessment materials for participation</li>
        <li>You must not copy, distribute, or misuse Organizer materials</li>
      </ul>
      <hr />

      <h2>9. EMPLOYMENT AND HIRING</h2>
      <h3>9.1 No Employment Relationship</h3>
      <ul>
        <li>Using the Platform does not create employment with Wirre</li>
        <li>We are not your employer or agent</li>
        <li>We do not make hiring decisions</li>
      </ul>
      <h3>9.2 Organizer Relationships</h3>
      <ul>
        <li>All hiring decisions are made by Organizers</li>
        <li>Organizers set job terms, compensation, and benefits</li>
        <li>We are not involved in employment negotiations or contracts</li>
      </ul>
      <h3>9.3 No Guarantees</h3>
      <ul>
        <li>We do not guarantee Assessment opportunities</li>
        <li>We do not guarantee job offers or interviews</li>
        <li>We do not guarantee Assessment outcomes</li>
        <li>Organizer decisions are final and at their discretion</li>
      </ul>
      <h3>9.4 Background Checks</h3>
      <ul>
        <li>Organizers may conduct background checks independently</li>
        <li>We do not verify Candidate credentials or qualifications</li>
        <li>You are responsible for truthful representation</li>
      </ul>
      <h3>9.5 Disputes with Organizers</h3>
      <ul>
        <li>You must resolve disputes directly with Organizers</li>
        <li>We may facilitate communication but are not obligated to mediate</li>
        <li>We are not liable for Organizer conduct or decisions</li>
      </ul>
      <hr />

      <h2>10. COMMUNICATIONS</h2>
      <h3>10.1 Platform Communications</h3>
      <ul>
        <li>We may send you Assessment notifications</li>
        <li>We may send Platform updates and announcements</li>
        <li>We may send important security or legal notices</li>
      </ul>
      <h3>10.2 Marketing Communications</h3>
      <ul>
        <li>We may send newsletters and opportunities (you may opt out)</li>
        <li>You may manage communication preferences in settings</li>
        <li>You cannot opt out of essential service communications</li>
      </ul>
      <h3>10.3 Organizer Communications</h3>
      <ul>
        <li>Organizers may contact you regarding Assessments you applied to</li>
        <li>You may communicate with Organizers through Platform messaging</li>
        <li>You must maintain professional communication</li>
      </ul>
      <hr />

      <h2>11. DISCLAIMERS AND LIMITATION OF LIABILITY</h2>
      <h3>11.1 Platform "As-Is"</h3>
      <ul>
        <li>The Platform is provided "as is" without warranties</li>
        <li>We do not guarantee uninterrupted or error-free service</li>
        <li>We do not warrant Assessment availability or accuracy</li>
      </ul>
      <h3>11.2 No Warranty of Outcomes</h3>
      <ul>
        <li>We do not guarantee job placement or offers</li>
        <li>We do not endorse or verify Organizers</li>
        <li>We are not responsible for Organizer conduct</li>
      </ul>
      <h3>11.3 Limitation of Liability</h3>
      <ul>
        <li>Our total liability to you is limited to ₹1,000 (or equivalent)</li>
        <li>We are not liable for indirect, incidental, or consequential damages</li>
        <li>We are not liable for lost opportunities, wages, or profits</li>
      </ul>
      <h3>11.4 Third-Party Services</h3>
      <ul>
        <li>We integrate with GitHub and payment processors</li>
        <li>We are not responsible for third-party service failures</li>
        <li>Third-party services have their own terms and policies</li>
      </ul>
      <h3>11.5 Indemnification</h3>
      <ul>
        <li>You indemnify us against claims arising from your use of the Platform</li>
        <li>You indemnify us for your violations of these Terms</li>
        <li>You indemnify us for your violations of third-party rights</li>
      </ul>
      <hr />

      <h2>12. ACCOUNT TERMINATION AND SUSPENSION</h2>
      <h3>12.1 Termination by You</h3>
      <ul>
        <li>You may delete your account at any time</li>
        <li>Account deletion is permanent and cannot be undone</li>
        <li>Submitted Assessment data may persist for Organizer records</li>
      </ul>
      <h3>12.2 Suspension by Us</h3>
      <ul>
        <li>We may suspend accounts for Terms violations</li>
        <li>We may suspend accounts pending investigation</li>
        <li>We may suspend accounts for fraudulent activity</li>
      </ul>
      <h3>12.3 Termination by Us</h3>
      <ul>
        <li>We may terminate accounts for repeated violations</li>
        <li>We may terminate for illegal activity</li>
        <li>We may terminate with notice for any reason</li>
      </ul>
      <h3>12.4 Effect of Termination</h3>
      <ul>
        <li>You lose access to Platform services</li>
        <li>Your Profile becomes inaccessible</li>
        <li>Organizers may retain access to your Submissions for completed Assessments</li>
        <li>Certain provisions survive termination (liability, intellectual property, etc.)</li>
      </ul>
      <hr />

      <h2>13. MODIFICATIONS TO TERMS</h2>
      <p><strong>13.1</strong> We may modify these Terms at any time by posting updated Terms.</p>
      <p><strong>13.2</strong> We will notify you of material changes via email or Platform notification.</p>
      <p><strong>13.3</strong> Continued use after changes constitutes acceptance.</p>
      <p><strong>13.4</strong> If you do not accept changes, you must stop using the Platform.</p>
      <hr />

      <h2>14. DISPUTE RESOLUTION</h2>
      <h3>14.1 Governing Law</h3>
      <ul>
        <li>These Terms are governed by the laws of India</li>
      </ul>
      <h3>14.2 Informal Resolution</h3>
      <ul>
        <li>You agree to contact us first to resolve disputes informally</li>
        <li>We will attempt good-faith resolution within 30 days</li>
      </ul>
      <h3>14.3 Arbitration</h3>
      <ul>
        <li>Unresolved disputes shall be settled through binding arbitration</li>
        <li>Arbitration conducted under Indian Arbitration and Conciliation Act, 1996</li>
        <li>Each party bears its own costs</li>
      </ul>
      <h3>14.4 Class Action Waiver</h3>
      <ul>
        <li>You waive the right to participate in class actions</li>
        <li>Claims must be brought individually</li>
      </ul>
      <hr />

      <h2>15. GENERAL PROVISIONS</h2>
      <h3>15.1 Entire Agreement</h3>
      <ul>
        <li>These Terms constitute the entire agreement</li>
        <li>They supersede all prior agreements</li>
      </ul>
      <h3>15.2 Severability</h3>
      <ul>
        <li>If any provision is unenforceable, others remain in effect</li>
        <li>Unenforceable provisions will be modified minimally to be enforceable</li>
      </ul>
      <h3>15.3 No Waiver</h3>
      <ul>
        <li>Our failure to enforce provisions does not waive our rights</li>
        <li>Waivers must be in writing</li>
      </ul>
      <h3>15.4 Assignment</h3>
      <ul>
        <li>You may not assign these Terms without our consent</li>
        <li>We may assign these Terms freely</li>
      </ul>
      <h3>15.5 Force Majeure</h3>
      <ul>
        <li>We are not liable for delays due to circumstances beyond our control</li>
        <li>This includes natural disasters, government actions, or technical failures</li>
      </ul>
      <h3>15.6 Language</h3>
      <ul>
        <li>These Terms are in English</li>
        <li>Translations are for convenience only</li>
        <li>English version controls in disputes</li>
      </ul>
      <hr />

      <h2>16. ACCESSIBILITY AND SUPPORT</h2>
      <h3>16.1 Platform Accessibility</h3>
      <ul>
        <li>We strive to make the Platform accessible to all users</li>
        <li>Contact us for accessibility accommodations</li>
        <li>We cannot guarantee compatibility with all assistive technologies</li>
      </ul>
      <h3>16.2 Customer Support</h3>
      <ul>
        <li>Support is available via email at thewirrecompany@gmail.com</li>
        <li>We aim to respond within 48 business hours</li>
        <li>Support is provided in English</li>
      </ul>
      <hr />

      <h2>17. MISCELLANEOUS</h2>
      <h3>17.1 Contributor Program</h3>
      <ul>
        <li>You may join as a contributor to improve the Platform</li>
        <li>Contributor terms may be specified separately</li>
        <li>Contributions are voluntary.</li>
      </ul>
      <h3>17.2 Feedback</h3>
      <ul>
        <li>You may provide feedback and suggestions</li>
        <li>We may use feedback without obligation or compensation</li>
        <li>Feedback does not create confidential relationship</li>
      </ul>
      <h3>17.3 Beta Features</h3>
      <ul>
        <li>We may offer beta or experimental features</li>
        <li>Beta features are provided "as is" with no warranties</li>
        <li>Beta features may be modified or discontinued</li>
      </ul>
      <hr />

      <h2>18. CONTACT INFORMATION</h2>
      <p>For questions about these Terms:</p>
      <p><strong>Email:</strong> thewirrecompany@gmail.com</p>
      <hr />

      <h2>19. ACKNOWLEDGMENT</h2>
      <p>By creating an account or using the Platform, you acknowledge that you have read, understood, and agree to be bound by these Terms and Conditions.</p>
      <hr />

      <div className="not-prose bg-green-50 border-l-4 border-green-500 p-4 my-6">
        <p className="font-bold text-lg mb-2 text-green-900">IMPORTANT NOTICE TO CANDIDATES:</p>
        <ul className="space-y-1 text-green-900">
          <li>✓ <strong>You will NEVER be charged</strong> for using Wirre as a Candidate</li>
          <li>✓ All Assessment participation is <strong>completely free</strong></li>
          <li>✓ You <strong>own your code</strong> submissions</li>
          <li>✓ We <strong>protect your privacy</strong> and do not sell your data</li>
          <li>✓ You can <strong>delete your account</strong> at any time</li>
        </ul>
        <p className="mt-2 text-green-900">If anyone asks you to pay for Platform access, report it immediately to thewirrecompany@gmail.com.</p>
      </div>

      <p className="text-center text-sm text-gray-500 mt-8"><em>© 2026 Wirre. All rights reserved.</em></p>
    </div>
  );
}

function CompanyTerms() {
  return (
    <div>
      <h1>TERMS AND CONDITIONS FOR ORGANIZERS</h1>
      <h2>Wirre Platform Services Agreement</h2>
      <p>
        <strong>Effective Date: March 1, 2026</strong></p>
      <hr />

      <h2>1. ACCEPTANCE OF TERMS</h2>
      <p>By registering as an Organizer on the Wirre platform ("Platform"), you ("Organizer," "you," or "your") agree to be bound by these Terms and Conditions ("Terms"). If you do not agree to these Terms, you may not use the Platform.</p>
      <p>These Terms constitute a legally binding agreement between you and Wirre ("we," "us," or "our") governing your use of our assessment-based hiring platform and related services.</p>
      <hr />

      <h2>2. DEFINITIONS</h2>
      <p><strong>2.1</strong> "Assessment" means a technical evaluation created by an Organizer to test candidates' skills, typically involving GitHub repository-based coding challenges. Assessments ("rounds") may be either <strong>paid</strong> (where there is money or a job on the line) or <strong>unpaid</strong> (practice or learning only).</p>
      <p><strong>2.2</strong> "Candidate" means an individual who participates in Assessments through the Platform.</p>
      <p><strong>2.3</strong> "Platform Fee" means the service fee charged to Organizers for conducting Assessments, calculated as 20% of the maximum salary multiplied by the number of positions.</p>
      <p><strong>2.4</strong> "Upcoming Assessment" means any Assessment with a start date in the future that has not been marked as completed.</p>
      <hr />
      <div className="not-prose bg-black border-l-4 border-red-500 p-4 my-6">
        <p className="font-bold text-lg mb-2 text-red-400">⚠️ CRITICAL: PAID VS UNPAID ROUNDS</p>
        <ul className="space-y-2 text-gray-100">
          <li><strong className="text-red-400">Paid rounds:</strong> All candidate submissions are completely anonymous. Organizers cannot see any candidate identities or profiles until after they have made their final selection and hiring decision. This is to prevent bias and cheating.</li>
          <li><strong className="text-red-400">Unpaid rounds:</strong> For practice, learning, or community engagement only. Candidate submissions remain anonymous. If you conduct an unpaid round and then proceed to hire any candidate from that round, you will be subject to a penalty of up to <strong>5 times the CTC (cost to company) offered to the candidate</strong>.</li>
          <li className="text-red-300"><strong>STRICTLY PROHIBITED:</strong> You cannot conduct an unpaid round and then hire candidates from it to avoid platform fees. This is fraud and will result in immediate legal action.</li>
          <li className="text-red-300"><strong>CTC FALSIFICATION:</strong> You must provide accurate CTC (Cost to Company) information for paid rounds. Falsifying or understating the CTC to reduce platform fees is fraud and will result in penalties of up to <strong>10 times the actual CTC</strong> plus legal action.</li>
          <li className="text-red-300"><strong>SYSTEM ABUSE:</strong> Any attempt to bypass, hack, or manipulate the platform's paid/unpaid classification system will result in permanent account termination, forfeiture of all fees paid, and legal prosecution.</li>
          <li>We actively monitor for violations and reserve the right to audit your hiring practices and employment contracts.</li>
        </ul>
      </div>

      <h2>3. ORGANIZER REGISTRATION AND ACCOUNT</h2>
      <h3>3.1 Eligibility</h3>
      <ul>
        <li>You must be a legally registered business entity or authorized representative thereof</li>
        <li>You must provide accurate and complete registration information</li>
        <li>You must maintain the security of your account credentials</li>
      </ul>
      <h3>3.2 Account Verification</h3>
      <ul>
        <li>We reserve the right to verify your organizer information</li>
        <li>We may request additional documentation to confirm legitimacy</li>
        <li>Accounts may be suspended pending verification</li>
      </ul>
      <h3>3.3 Account Responsibility</h3>
      <ul>
        <li>You are responsible for all activities under your account</li>
        <li>You must notify us immediately of any unauthorized access</li>
        <li>You must not share account credentials with unauthorized parties</li>
      </ul>
      <hr />


      <h2>4. ASSESSMENT CREATION AND MANAGEMENT</h2>
      <h3>4.1 Round Types: Paid vs Unpaid</h3>
      <p><strong>You can create two types of rounds:</strong></p>
      <ul>
        <li><strong>Paid Rounds:</strong> For actual job hiring with monetary compensation. Platform fee applies (20% of max CTC × positions). Candidate identities are hidden until final selection to ensure fairness.</li>
        <li><strong>Unpaid Rounds:</strong> For practice, learning, or community engagement only. No platform fee. Candidate submissions remain anonymous. <strong className="text-red-500">You CANNOT hire from unpaid rounds.</strong></li>
      </ul>
      <p><strong>Choosing the right type:</strong></p>
      <ul>
        <li>If you intend to hire anyone → Use <strong>Paid Round</strong></li>
        <li>If it's purely for practice/learning → Use <strong>Unpaid Round</strong></li>
        <li>If you're unsure → Use <strong>Paid Round</strong> to avoid penalties</li>
      </ul>
      <p className="text-red-500"><strong>WARNING:</strong> Hiring anyone from an unpaid round will result in a penalty of 5× the CTC offered. There are no exceptions.</p>
      <hr />

      <h3>4.2 Assessment Setup</h3>
      <p>Organizers may create Assessments specifying:</p>
      <ul>
        <li>Round type (Paid or Unpaid)</li>
        <li>Number of positions</li>
        <li>Minimum and maximum salary ranges (for paid rounds)</li>
        <li>Assessment duration and start date</li>
        <li>GitHub repository for candidate submissions</li>
        <li>Skills and requirements</li>
      </ul>
      <h3>4.2 Repository Requirements</h3>
      <ul>
        <li>Organizers must provide valid GitHub repository URLs</li>
        <li>Repositories must be accessible for the duration of the Assessment</li>
        <li>Organizers must not use duplicate repositories across multiple Assessments</li>
        <li>Repository access will be verified through our GitHub App integration</li>
      </ul>
      <h3>4.3 Assessment Modifications</h3>
      <ul>
        <li>Assessments may be edited before the start date</li>
        <li>Salary increases require additional payment (difference amount)</li>
        <li>Salary decreases do not trigger refunds</li>
        <li>Repository changes are subject to duplicate validation</li>
      </ul>
      <h3>4.4 Submission Workflow</h3>
      <ul>
        <li>Candidates will fork the designated repository</li>
        <li>Candidates submit their work directly through the Platform</li>
        <li>Organizers are responsible for reviewing and evaluating submissions</li>
        <li>The Platform facilitates the workflow but does not guarantee evaluation outcomes</li>
      </ul>
      <hr />

      <h2>5. PAYMENT TERMS</h2>
      <h3>5.1 Platform Fee Structure</h3>
      <ul>
        <li>Platform Fee = Number of Positions × Maximum Salary × 20%</li>
        <li>All fees are denominated in Indian Rupees (₹)</li>
        <li>Fees are calculated and displayed before payment confirmation</li>
      </ul>
      <h3>5.2 Payment Processing</h3>
      <ul>
        <li>All payments are processed through Razorpay</li>
        <li>Payment must be completed before Assessment publication</li>
        <li>We accept credit cards, debit cards, UPI, and net banking</li>
      </ul>
      <h3>5.3 Assessment Editing Payments</h3>
      <ul>
        <li>If maximum salary is increased after initial payment, you must pay the difference</li>
        <li>Difference = (New Max Salary - Original Max Salary) × Number of Positions × 20%</li>
        <li>No refunds for salary decreases</li>
      </ul>
      <h3>5.4 Payment Confirmation</h3>
      <ul>
        <li>Assessments are published only after successful payment verification</li>
        <li>Payment confirmation may take up to 24 hours</li>
        <li>Failed payments must be retried to publish the Assessment</li>
      </ul>
      <h3>5.5 Refund Policy</h3>
      <ul>
        <li>Platform Fees are non-refundable once an Assessment is published</li>
        <li>No refunds for cancelled Assessments after start date</li>
        <li>No refunds for low candidate participation</li>
      </ul>
      <hr />

      <h2>6. ORGANIZER ACCOUNT DELETION</h2>
      <h3>6.1 Deletion Without Upcoming Assessments</h3>
      <ul>
        <li>If you have no Upcoming Assessments, deletion is free</li>
        <li>All organizer data will be permanently removed</li>
        <li>This action cannot be undone</li>
      </ul>
      <h3>6.2 Deletion With Upcoming Assessments</h3>
      <ul>
        <li>Deletion Fee = 20% of the sum of all Upcoming Assessment Platform Fees</li>
        <li>Example: If you have 3 Upcoming Assessments with Platform Fees of ₹5,000, ₹6,000, and ₹7,000, your Deletion Fee = 20% × (₹5,000 + ₹6,000 + ₹7,000) = ₹3,600</li>
        <li>Deletion Fee must be paid before account deletion</li>
        <li>All Upcoming Assessments will be cancelled</li>
        <li>Candidates will be notified of cancellation</li>
      </ul>
      <h3>6.3 Data Retention</h3>
      <ul>
        <li>Completed Assessment data may be retained for compliance purposes</li>
        <li>Candidate personal information will be anonymized after deletion</li>
        <li>Financial records will be retained as required by law</li>
      </ul>
      <hr />

      <h2>7. DATA USAGE AND PRIVACY</h2>
      <h3>7.1 Candidate Data Access</h3>
      <ul>
        <li>You may access Candidate information submitted through Assessments</li>
        <li>You must comply with all applicable data protection laws</li>
      </ul>
      <h3>7.2 Data Protection Obligations</h3>
      <ul>
        <li>You must maintain confidentiality of Candidate information</li>
        <li>You must use Candidate data solely for hiring purposes</li>
        <li>You must not sell, transfer, or misuse Candidate data</li>
      </ul>
      <h3>7.3 Data Security</h3>
      <ul>
        <li>You must implement reasonable security measures for accessed data</li>
        <li>You must report any data breaches to us within 24 hours</li>
        <li>You are liable for unauthorized disclosure of Candidate data</li>
      </ul>
      <hr />

      <h2>8. INTELLECTUAL PROPERTY</h2>
      <h3>8.1 Platform Ownership</h3>
      <ul>
        <li>All Platform content, features, and functionality are owned by Wirre</li>
        <li>Our trademarks, logos, and branding are our exclusive property</li>
        <li>You may not use our intellectual property without written permission</li>
      </ul>
      <h3>8.2 Assessment Content</h3>
      <ul>
        <li>You retain ownership of Assessment materials you create</li>
        <li>By publishing Assessments, you grant us a license to display and facilitate them</li>
        <li>You represent that you have rights to all Assessment content</li>
      </ul>
      <h3>8.3 Candidate Submissions</h3>
      <ul>
        <li>Candidate code submissions are owned by the Candidates</li>
        <li>You may evaluate submissions for hiring purposes</li>
        <li>You must negotiate separately for commercial use of Candidate work</li>
      </ul>
      <hr />

      <h2>9. PROHIBITED CONDUCT</h2>
      <p>You agree NOT to:</p>
      <ul>
        <li>Post false, misleading, or fraudulent job opportunities</li>
        <li><strong>Falsify or understate CTC (Cost to Company) information to reduce platform fees</strong></li>
        <li><strong>Conduct unpaid rounds and then hire candidates from those rounds to avoid fees</strong></li>
        <li><strong>Misclassify paid rounds as unpaid to bypass anonymity requirements or reduce costs</strong></li>
        <li>Discriminate against Candidates on prohibited grounds</li>
        <li>Use the Platform for purposes other than legitimate hiring</li>
        <li>Harvest Candidate data for spam or marketing purposes</li>
        <li>Attempt to circumvent the Platform to avoid fees</li>
        <li>Use automated tools to scrape Platform data</li>
        <li>Violate any applicable laws or regulations</li>
        <li>Infringe on intellectual property rights</li>
        <li>Post malicious code or security vulnerabilities in Assessments</li>
        <li><strong>Contact candidates from unpaid rounds outside the Platform to offer employment</strong></li>
      </ul>
      <hr />

      <h2>10. LIABILITY AND DISCLAIMERS</h2>
      <h3>10.1 Platform "As-Is"</h3>
      <ul>
        <li>The Platform is provided "as is" without warranties of any kind</li>
        <li>We do not guarantee uninterrupted or error-free service</li>
        <li>We do not guarantee specific hiring outcomes</li>
      </ul>
      <h3>10.2 Limitation of Liability</h3>
      <ul>
        <li>Our total liability is limited to fees paid by you in the preceding 12 months</li>
        <li>We are not liable for indirect, incidental, or consequential damages</li>
        <li>We are not liable for Candidate performance or conduct</li>
      </ul>
      <h3>10.3 Indemnification</h3>
      <ul>
        <li>You indemnify us against claims arising from your use of the Platform</li>
        <li>You indemnify us against claims from Candidates related to your Assessments</li>
        <li>You indemnify us for your violation of these Terms</li>
      </ul>
      <hr />

      <h2>11. CANDIDATE RELATIONSHIPS</h2>
      <h3>11.1 Independent Hiring Decisions</h3>
      <ul>
        <li>You make all hiring decisions independently</li>
        <li>We do not endorse or recommend specific Candidates</li>
        <li>We are not involved in employment relationships</li>
      </ul>
      <h3>11.2 Compliance with Employment Laws</h3>
      <ul>
        <li>You must comply with all applicable employment and labor laws</li>
        <li>You are responsible for employment contracts and terms</li>
        <li>You are responsible for compensation and benefits</li>
      </ul>
      <h3>11.3 Disputes with Candidates</h3>
      <ul>
        <li>You are solely responsible for resolving disputes with Candidates</li>
        <li>We may facilitate communication but are not obligated to mediate</li>
        <li>We may suspend services during active disputes</li>
      </ul>
      <hr />

      <h2>12. TERM AND TERMINATION</h2>
      <h3>12.1 Term</h3>
      <ul>
        <li>These Terms remain in effect while you use the Platform</li>
        <li>Specific Assessments are governed by their individual terms</li>
      </ul>
      <h3>12.2 Termination by You</h3>
      <ul>
        <li>You may terminate by deleting your account (subject to deletion fees)</li>
        <li>You must fulfill all payment obligations before termination</li>
      </ul>
      <h3>12.3 Termination by Us</h3>
      <ul>
        <li>We may suspend or terminate your account for Terms violations</li>
        <li>We may terminate for fraudulent or illegal activity</li>
        <li>We may terminate with 30 days' notice for any reason</li>
      </ul>
      <h3>12.4 Effect of Termination</h3>
      <ul>
        <li>Unpaid fees become immediately due</li>
        <li>You lose access to Platform features</li>
        <li>Certain provisions survive termination (payment, liability, etc.)</li>
      </ul>
      <hr />

      <h2>13. MODIFICATIONS TO TERMS</h2>
      <p><strong>13.1</strong> We may modify these Terms at any time by posting updated Terms on the Platform.</p>
      <p><strong>13.2</strong> Material changes will be notified via email at least 15 days before effective date.</p>
      <p><strong>13.3</strong> Continued use after modifications constitutes acceptance of new Terms.</p>
      <p><strong>13.4</strong> If you do not accept modifications, you must stop using the Platform.</p>
      <hr />

      <h2>14. DISPUTE RESOLUTION</h2>
      <h3>14.1 Governing Law</h3>
      <ul>
        <li>These Terms are governed by the laws of India</li>
      </ul>
      <h3>14.2 Arbitration</h3>
      <ul>
        <li>Disputes shall be resolved through binding arbitration</li>
        <li>Arbitration shall be conducted in accordance with Indian Arbitration and Conciliation Act, 1996</li>
        <li>Each party bears its own arbitration costs</li>
      </ul>
      <h3>14.3 Class Action Waiver</h3>
      <ul>
        <li>You waive the right to participate in class action lawsuits</li>
        <li>Claims must be brought individually</li>
      </ul>
      <hr />

      <h2>15. GENERAL PROVISIONS</h2>
      <h3>15.1 Entire Agreement</h3>
      <ul>
        <li>These Terms constitute the entire agreement between parties</li>
        <li>They supersede all prior agreements and understandings</li>
      </ul>
      <h3>15.2 Severability</h3>
      <ul>
        <li>If any provision is unenforceable, it shall be modified to be enforceable</li>
        <li>Other provisions remain in full effect</li>
      </ul>
      <h3>15.3 No Waiver</h3>
      <ul>
        <li>Our failure to enforce any provision does not waive our right to enforce it later</li>
        <li>Waivers must be in writing</li>
      </ul>
      <h3>15.4 Assignment</h3>
      <ul>
        <li>You may not assign these Terms without our written consent</li>
        <li>We may assign these Terms without restriction</li>
      </ul>
      <h3>15.5 Force Majeure</h3>
      <ul>
        <li>We are not liable for delays or failures due to circumstances beyond our control</li>
        <li>This includes natural disasters, government actions, or technical failures</li>
      </ul>
      <hr />

      <h2>16. CONTACT INFORMATION</h2>
      <p>For questions about these Terms, contact us at:</p>
      <p>
        <strong>thewirrecompany@gmail.com</strong> </p>
      <hr />

      <h2>17. ACKNOWLEDGMENT</h2>
      <p>By using the Platform, you acknowledge that you have read, understood, and agree to be bound by these Terms and Conditions.</p>
      <hr />

      <p className="text-center text-sm text-gray-500 mt-8"><em>© 2026 Wirre. All rights reserved.</em></p>
    </div>
  );
}

function ContributorTerms() {
  return (
    <div>
      <h1>CONTRIBUTOR AGREEMENT AND TERMS OF SERVICE</h1>
      <h2>Wirre Platform Contributor Legal Agreement</h2>
      <p>
        <strong>Effective Date: January 11, 2026</strong></p>

      <div className="not-prose bg-black border-l-4 border-red-600 p-6 my-6">
        <p className="font-bold text-xl mb-3 text-red-400">⚠️ CRITICAL LEGAL NOTICE</p>
        <p className="text-white font-semibold mb-2">BY ACCESSING THE WIRRE SOURCE CODE, YOU AGREE TO STRICT CONFIDENTIALITY AND NON-DISCLOSURE OBLIGATIONS.</p>
        <p className="text-gray-200">This is a legally binding agreement. If you do not agree to ALL terms below, you are PROHIBITED from accessing, viewing, or contributing to the Wirre codebase.</p>
      </div>
      <hr />

      <h2>1. DEFINITIONS</h2>
      <p><strong>1.1 "Proprietary Code"</strong> means all source code, documentation, algorithms, database schemas, architectural designs, API specifications, configuration files, deployment scripts, and any other materials related to the Wirre platform, whether created before or during your contribution period.</p>
      <p><strong>1.2 "Contributor"</strong> means any individual who has been granted access to view, review, or contribute to the Wirre Proprietary Code, including but not limited to developers, code reviewers, testers, and technical advisors.</p>
      <p><strong>1.3 "Wirre"</strong> or "We" means Wirre and its affiliates, including all subsidiaries, parent companies, and related entities.</p>
      <p><strong>1.4 "Contribution"</strong> means any code, documentation, bug fix, feature, design, idea, suggestion, or other material submitted by you to the Wirre platform.</p>
      <p><strong>1.5 "Confidential Information"</strong> means all information related to the Wirre platform including but not limited to: source code, technical architecture, business logic, algorithms, data models, security implementations, third-party integrations, deployment strategies, trade secrets, business strategies, user data structures, API designs, and any other proprietary information.</p>
      <p><strong>1.6 "Competitive Activity"</strong> means any development, operation, or involvement with any platform, service, or product that provides assessment-based hiring, technical recruiting, coding challenge platforms, or substantially similar functionality to Wirre.</p>
      <hr />

      <h2>2. NATURE OF ACCESS AND RELATIONSHIP</h2>
      <h3>2.1 Proprietary Codebase</h3>
      <ul>
        <li>The Wirre platform is <strong>100% proprietary and closed-source</strong></li>
        <li>NO portion of the codebase is open-source, public domain, or available under any open-source license</li>
        <li>Access to the code is a revocable privilege, NOT a right</li>
        <li>The codebase is protected by copyright, trade secret laws, and other intellectual property rights</li>
      </ul>

      <h3>2.2 Contributor Status</h3>
      <ul>
        <li>Contributors are independent contractors, NOT employees or partners of Wirre</li>
        <li>No employment relationship is created by contributing</li>
        <li>Compensation terms, if any, will be determined separately in a written agreement with Wirre</li>
        <li>Contributors have NO equity or ownership interest in Wirre unless separately agreed in writing</li>
        <li>Contributors have NO decision-making authority over Wirre's business, technical, or strategic decisions</li>
      </ul>

      <h3>2.3 Voluntary Participation</h3>
      <ul>
        <li>All contributions are made voluntarily and at your own discretion</li>
        <li>You may cease contributing at any time</li>
        <li>We may revoke your access at any time for any reason or no reason</li>
        <li>No promises, representations, or guarantees of future employment or compensation are made</li>
      </ul>
      <hr />

      <h2>3. ABSOLUTE CONFIDENTIALITY AND NON-DISCLOSURE</h2>
      <h3>3.1 Strict Confidentiality Obligations</h3>
      <p>You acknowledge and agree that ALL Wirre Proprietary Code and Confidential Information is strictly confidential and constitutes valuable trade secrets. You MUST NOT:</p>
      <ul>
        <li><strong>COPY, REPRODUCE, OR DUPLICATE</strong> any portion of the source code, in whole or in part, for any purpose</li>
        <li><strong>DOWNLOAD, EXTRACT, OR SAVE</strong> any code files to personal devices, cloud storage, or any location outside the authorized development environment</li>
        <li><strong>SHARE, TRANSMIT, OR COMMUNICATE</strong> any code, architecture, or technical details to any third party, including family, friends, colleagues, or other developers</li>
        <li><strong>DISCUSS, DESCRIBE, OR DISCLOSE</strong> the technical implementation, algorithms, or business logic of the platform publicly or privately</li>
        <li><strong>SCREENSHOT, PHOTOGRAPH, OR RECORD</strong> any portion of the codebase or development environment</li>
        <li><strong>POST, PUBLISH, OR SHARE</strong> code snippets, examples, or implementation details on social media, blogs, forums, Stack Overflow, GitHub, or any public platform</li>
        <li><strong>CREATE DERIVATIVE WORKS</strong> based on the Wirre codebase for personal or commercial projects</li>
      </ul>

      <h3>3.2 Prohibited Disclosures</h3>
      <p>You shall NOT disclose:</p>
      <ul>
        <li>Technology stack, frameworks, or libraries used</li>
        <li>Database structure, schemas, or data models</li>
        <li>API endpoints, authentication mechanisms, or security implementations</li>
        <li>Algorithms for assessment evaluation, matching, or scoring</li>
        <li>Third-party integrations (Razorpay, Supabase, GitHub, etc.)</li>
        <li>Deployment infrastructure or cloud architecture</li>
        <li>Performance optimization techniques or caching strategies</li>
        <li>Business logic for pricing, payments, or user management</li>
        <li>Any vulnerabilities, security issues, or bugs discovered</li>
      </ul>

      <h3>3.3 Duration of Confidentiality</h3>
      <ul>
        <li>Confidentiality obligations are <strong>PERPETUAL and UNLIMITED in duration</strong></li>
        <li>These obligations survive termination of your access and this agreement</li>
        <li>These obligations remain in effect even if you cease contributing</li>
        <li>These obligations continue regardless of whether Wirre is sold, merged, or changes ownership</li>
      </ul>

      <h3>3.4 Exceptions to Confidentiality</h3>
      <p>Confidentiality obligations do NOT apply to information that:</p>
      <ul>
        <li>Was publicly available before your access to it</li>
        <li>Becomes publicly available through no breach of this agreement by you</li>
        <li>Was independently developed by you without reference to Wirre's Confidential Information (burden of proof is on you)</li>
        <li>Is required to be disclosed by law or court order (you must notify us immediately before disclosure)</li>
      </ul>
      <hr />

      <h2>4. INTELLECTUAL PROPERTY OWNERSHIP</h2>
      <h3>4.1 Wirre's Exclusive Ownership</h3>
      <ul>
        <li>Wirre owns <strong>100% of all intellectual property rights</strong> in the platform, including all code, designs, documentation, and related materials</li>
        <li>You have <strong>ZERO ownership rights, claims, or interests</strong> in the Wirre platform</li>
        <li>Access to code does NOT grant you any license, right to use, or ownership claim</li>
        <li>All existing code, future code, and derivatives are exclusively owned by Wirre</li>
      </ul>

      <h3>4.2 Assignment of Contribution Rights</h3>
      <p>By submitting any Contribution, you hereby irrevocably and unconditionally:</p>
      <ul>
        <li><strong>ASSIGN AND TRANSFER</strong> all worldwide intellectual property rights in your Contributions to Wirre</li>
        <li><strong>WAIVE ALL MORAL RIGHTS</strong> in your Contributions to the maximum extent permitted by law</li>
        <li><strong>GRANT WIRRE PERPETUAL, WORLDWIDE, EXCLUSIVE RIGHTS</strong> to use, modify, distribute, sublicense, and commercialize your Contributions</li>
        <li><strong>ACKNOWLEDGE</strong> that your Contributions become Wirre's exclusive property immediately upon submission</li>
        <li><strong>AGREE</strong> that you have no right to compensation, credit, or attribution for your Contributions</li>
      </ul>

      <h3>4.3 No License Granted to You</h3>
      <ul>
        <li>Your access to the codebase does NOT grant you any license to use, copy, or distribute the code</li>
        <li>You may access code SOLELY for the purpose of making authorized Contributions</li>
        <li>You have NO right to use Wirre's code in your own projects, portfolios, or products</li>
        <li>You may NOT include Wirre code samples in your resume, GitHub profile, or portfolio</li>
      </ul>

      <h3>4.4 Contribution Representations and Warranties</h3>
      <p>You represent and warrant that:</p>
      <ul>
        <li>All Contributions are your original work</li>
        <li>You have full legal rights to assign your Contributions to Wirre</li>
        <li>Your Contributions do not infringe any third-party intellectual property rights</li>
        <li>Your Contributions do not contain malicious code, viruses, or security vulnerabilities</li>
        <li>You have not incorporated any GPL, AGPL, or other copyleft-licensed code into your Contributions</li>
        <li>You have not copied code from other projects, tutorials, or sources without proper licensing</li>
      </ul>
      <hr />

      <h2>5. PROHIBITED USE AND COMPETITIVE RESTRICTIONS</h2>
      <h3>5.1 Absolute Prohibition on Copying</h3>
      <p>You are <strong>STRICTLY PROHIBITED</strong> from:</p>
      <ul>
        <li>Copying any code, algorithms, or implementations from Wirre for use in any other project</li>
        <li>Recreating, rebuilding, or reimplementing Wirre's functionality in any other platform or product</li>
        <li>Using Wirre's proprietary code, algorithms, or architectural patterns in external projects</li>
        <li>Extracting business logic or implementation details for use outside of Wirre</li>
        <li>Creating derivative works based on Wirre's proprietary codebase</li>
      </ul>

      <h3>5.2 Permitted Activities</h3>
      <p>You MAY:</p>
      <ul>
        <li>Work on any projects or for any companies, including competitors</li>
        <li>Use general programming skills and publicly available knowledge</li>
        <li>Contribute to open-source projects</li>
        <li>Apply general software development experience gained</li>
        <li>Work in any industry or domain of your choosing</li>
      </ul>

      <h3>5.3 Clarification</h3>
      <ul>
        <li>These restrictions prohibit copying Wirre's proprietary code, NOT competition</li>
        <li>You may work for competitors or build competing products using your own original work</li>
        <li>You must simply not use or disclose Wirre's Confidential Information</li>
      </ul>
      <hr />

      <h2>6. CODE ACCESS AND SECURITY</h2>
      <h3>6.1 Access Authorization</h3>
      <ul>
        <li>Access is granted at Wirre's sole discretion</li>
        <li>Access may be limited to specific repositories, branches, or modules</li>
        <li>Access credentials are personal and non-transferable</li>
        <li>You must not share access credentials with anyone</li>
      </ul>

      <h3>6.2 Security Requirements</h3>
      <p>You MUST:</p>
      <ul>
        <li>Use secure passwords and enable two-factor authentication on all accounts</li>
        <li>Access code only from secure, private devices (not shared or public computers)</li>
        <li>Ensure your development environment is password-protected and encrypted</li>
        <li>Use VPN or secure network connections when accessing the codebase</li>
        <li>Report any security vulnerabilities or unauthorized access immediately</li>
        <li>Comply with all security policies and procedures provided by Wirre</li>
      </ul>

      <h3>6.3 Prohibited Actions</h3>
      <p>You MUST NOT:</p>
      <ul>
        <li>Attempt to access portions of the codebase you are not authorized to view</li>
        <li>Attempt to circumvent, disable, or bypass any security measures</li>
        <li>Access production databases, user data, or live systems without explicit authorization</li>
        <li>Use debugging tools to extract or reverse-engineer compiled code</li>
        <li>Introduce backdoors, vulnerabilities, or malicious code</li>
        <li>Exfiltrate data from development or production environments</li>
      </ul>

      <h3>6.4 Monitoring and Auditing</h3>
      <ul>
        <li>Wirre reserves the right to monitor all access to the codebase</li>
        <li>All code commits, views, and downloads may be logged and audited</li>
        <li>We may use automated tools to detect unauthorized copying or data exfiltration</li>
        <li>You consent to monitoring as a condition of access</li>
      </ul>
      <hr />

      <h2>7. TERMINATION AND REVOCATION OF ACCESS</h2>
      <h3>7.1 Immediate Termination</h3>
      <p>Wirre may immediately terminate your access without notice for:</p>
      <ul>
        <li>Any violation of this agreement</li>
        <li>Suspected unauthorized disclosure or copying of code</li>
        <li>Security threats or malicious activity</li>
        <li>Inactivity or non-contribution for extended periods</li>
        <li>Any reason or no reason at Wirre's sole discretion</li>
      </ul>

      <h3>7.2 Obligations Upon Termination</h3>
      <p>Upon termination of access, you MUST immediately:</p>
      <ul>
        <li>Cease all access to Wirre repositories, servers, and systems</li>
        <li>Delete all copies of code, documentation, or materials in your possession</li>
        <li>Return or destroy any Wirre-provided equipment, credentials, or materials</li>
        <li>Certify in writing that you have complied with these obligations</li>
        <li>Continue to honor all confidentiality and non-compete obligations</li>
      </ul>

      <h3>7.3 Survival of Terms</h3>
      <p>The following provisions survive termination indefinitely:</p>
      <ul>
        <li>Confidentiality and Non-Disclosure (Section 3)</li>
        <li>Intellectual Property Ownership (Section 4)</li>
        <li>Prohibited Use (Section 5)</li>
        <li>Limitation of Liability (Section 10)</li>
        <li>Indemnification (Section 11)</li>
        <li>Dispute Resolution (Section 13)</li>
      </ul>
      <hr />

      <h2>8. CONTRIBUTOR CONDUCT AND RESPONSIBILITIES</h2>
      <h3>8.1 Professional Conduct</h3>
      <p>You agree to:</p>
      <ul>
        <li>Conduct yourself professionally and respectfully at all times</li>
        <li>Follow all contribution guidelines, coding standards, and best practices</li>
        <li>Communicate clearly and constructively in code reviews and discussions</li>
        <li>Respect the time and contributions of other contributors and team members</li>
        <li>Not harass, discriminate against, or abuse any person</li>
      </ul>

      <h3>8.2 Quality and Testing</h3>
      <ul>
        <li>Ensure all Contributions are properly tested before submission</li>
        <li>Write clear, maintainable, and well-documented code</li>
        <li>Follow established architectural patterns and design principles</li>
        <li>Not introduce breaking changes without approval</li>
        <li>Fix bugs in your Contributions when identified</li>
      </ul>

      <h3>8.3 Contribution Review Process</h3>
      <ul>
        <li>All Contributions are subject to review and approval</li>
        <li>Wirre may reject, modify, or request changes to any Contribution</li>
        <li>You have no guarantee that your Contributions will be accepted or deployed</li>
        <li>Final decisions on code acceptance rest solely with Wirre</li>
      </ul>

      <h3>8.4 Prohibited Contributions</h3>
      <p>You MUST NOT submit:</p>
      <ul>
        <li>Code containing malware, viruses, or security vulnerabilities</li>
        <li>Code that violates third-party intellectual property rights</li>
        <li>Code copied from other sources without proper licensing</li>
        <li>Code containing offensive, discriminatory, or inappropriate content</li>
        <li>Code that intentionally degrades performance or introduces bugs</li>
        <li>Code with backdoors or unauthorized access mechanisms</li>
      </ul>
      <hr />

      <h2>9. DATA PROTECTION AND PRIVACY</h2>
      <h3>9.1 Access to User Data</h3>
      <ul>
        <li>Contributors may have access to test data or anonymized user information</li>
        <li>You MUST NOT access, view, or use actual user data unless explicitly authorized</li>
        <li>All user data is confidential and subject to strict data protection laws</li>
        <li>Unauthorized access to user data is grounds for immediate termination and legal action</li>
      </ul>

      <h3>9.2 Data Protection Obligations</h3>
      <p>You MUST:</p>
      <ul>
        <li>Comply with all applicable data protection laws (GDPR, CCPA, Indian IT Act, etc.)</li>
        <li>Implement security measures to protect any data you access</li>
        <li>Report any data breaches or privacy violations immediately</li>
        <li>Not use user data for personal purposes, research, or training</li>
        <li>Not share or disclose user data to any third party</li>
      </ul>

      <h3>9.3 Personal Information</h3>
      <ul>
        <li>We may collect your name, email, GitHub username, and contribution history</li>
        <li>We will not sell your personal information to third parties</li>
        <li>We may use your information for internal records and contributor recognition</li>
        <li>You may request deletion of your personal information (subject to legal retention requirements)</li>
      </ul>
      <hr />

      <h2>10. DISCLAIMERS AND LIMITATION OF LIABILITY</h2>
      <h3>10.1 No Warranties</h3>
      <ul>
        <li>Access to the codebase is provided "AS IS" without warranties of any kind</li>
        <li>We do not guarantee uninterrupted access, accuracy of code, or fitness for any purpose</li>
        <li>We are not responsible for errors, bugs, or issues in the codebase</li>
        <li>You assume all risk associated with accessing and contributing to the codebase</li>
      </ul>

      <h3>10.2 Limitation of Liability</h3>
      <ul>
        <li>Wirre's total liability to you under this agreement is limited to ₹0 (ZERO)</li>
        <li>We are NOT liable for any direct, indirect, incidental, consequential, or punitive damages</li>
        <li>We are NOT liable for lost time, effort, opportunities, or benefits</li>
        <li>This limitation applies even if Wirre has been advised of the possibility of damages</li>
        <li>This limitation applies to the maximum extent permitted by law</li>
      </ul>

      <h3>10.3 No Guaranteed Employment</h3>
      <ul>
        <li>Contributing does NOT automatically guarantee employment or contractor opportunities</li>
        <li>Compensation and employment terms will be determined separately in writing if applicable</li>
        <li>Any statements about potential employment or compensation are non-binding unless in a signed written agreement</li>
      </ul>
      <hr />

      <h2>11. INDEMNIFICATION</h2>
      <h3>11.1 Your Indemnification Obligations</h3>
      <p>You agree to indemnify, defend, and hold harmless Wirre, its affiliates, officers, directors, employees, contractors, and agents from any and all claims, damages, losses, liabilities, costs, and expenses (including reasonable attorneys' fees) arising from or related to:</p>
      <ul>
        <li>Your violation of this agreement</li>
        <li>Your unauthorized disclosure or use of Confidential Information</li>
        <li>Your infringement of third-party intellectual property rights</li>
        <li>Your Contributions (including warranty breaches, IP infringement, etc.)</li>
        <li>Your violation of applicable laws or regulations</li>
        <li>Your negligence, willful misconduct, or fraudulent activities</li>
        <li>Any damages caused by malicious code, security vulnerabilities, or bugs you introduce</li>
      </ul>

      <h3>11.2 Defense and Settlement</h3>
      <ul>
        <li>You must cooperate fully in the defense of any claims</li>
        <li>Wirre has the exclusive right to control defense and settlement</li>
        <li>You may not settle any claim without Wirre's prior written consent</li>
      </ul>
      <hr />

      <h2>12. ENFORCEMENT AND REMEDIES</h2>
      <h3>12.1 Injunctive Relief</h3>
      <ul>
        <li>You acknowledge that breach of this agreement causes irreparable harm to Wirre</li>
        <li>Monetary damages are insufficient to remedy such harm</li>
        <li>Wirre is entitled to seek immediate injunctive relief (court orders to stop violations) without posting bond</li>
        <li>Injunctive relief is in addition to all other remedies available at law or equity</li>
      </ul>

      <h3>12.2 Liquidated Damages</h3>
      <p>For certain breaches, you agree to pay liquidated damages as follows:</p>
      <ul>
        <li><strong>Unauthorized Code Disclosure:</strong> ₹50,00,000 (Fifty Lakh Rupees) per instance</li>
        <li><strong>Use of Proprietary Code in Other Products:</strong> ₹1,00,00,000 (One Crore Rupees) plus disgorgement of all profits</li>
        <li><strong>Unauthorized Access to Production Systems:</strong> ₹10,00,000 (Ten Lakh Rupees) per incident</li>
        <li>These amounts represent reasonable pre-estimates of actual damages, NOT penalties</li>
      </ul>

      <h3>12.3 Additional Remedies</h3>
      <p>Wirre reserves the right to:</p>
      <ul>
        <li>Seek actual damages in addition to or in lieu of liquidated damages</li>
        <li>Recover all attorneys' fees, court costs, and investigation expenses</li>
        <li>Report violations to law enforcement authorities</li>
        <li>Pursue criminal prosecution for theft of trade secrets, hacking, or fraud</li>
        <li>Seek disgorgement of all profits derived from violations</li>
      </ul>

      <h3>12.4 No Limitation Period</h3>
      <ul>
        <li>Wirre may enforce this agreement at any time, without limitation period</li>
        <li>Delayed enforcement does NOT constitute waiver of rights</li>
        <li>Each violation constitutes a separate breach</li>
      </ul>
      <hr />

      <h2>13. DISPUTE RESOLUTION AND GOVERNING LAW</h2>
      <h3>13.1 Governing Law</h3>
      <ul>
        <li>This agreement is governed by the laws of <strong>India</strong></li>
        <li>Excluding conflict of law principles</li>
        <li>All disputes shall be subject to the exclusive jurisdiction of courts in <strong>[City], India</strong></li>
      </ul>

      <h3>13.2 Mandatory Arbitration</h3>
      <ul>
        <li>All disputes shall be resolved through <strong>binding arbitration</strong></li>
        <li>Arbitration conducted under the Indian Arbitration and Conciliation Act, 1996</li>
        <li>Arbitration shall be conducted in English</li>
        <li>Single arbitrator appointed by mutual agreement or by the arbitration institution</li>
        <li>Arbitration award is final and binding, with limited appeal rights</li>
      </ul>

      <h3>13.3 Exceptions to Arbitration</h3>
      <p>Wirre may seek the following in court without arbitration:</p>
      <ul>
        <li>Injunctive relief to prevent ongoing or threatened breaches</li>
        <li>Emergency orders to protect trade secrets or confidential information</li>
        <li>Enforcement of liquidated damages provisions</li>
        <li>Collection of amounts owed</li>
      </ul>

      <h3>13.4 Confidential Arbitration</h3>
      <ul>
        <li>All arbitration proceedings shall be confidential</li>
        <li>Neither party may disclose the existence, content, or outcome of arbitration</li>
        <li>Arbitration records shall be sealed and not publicly accessible</li>
      </ul>

      <h3>13.5 Class Action Waiver</h3>
      <ul>
        <li>You waive all rights to participate in class action lawsuits or class-wide arbitration</li>
        <li>All claims must be brought individually</li>
        <li>You may not consolidate your claim with others</li>
      </ul>
      <hr />

      <h2>14. GENERAL PROVISIONS</h2>
      <h3>14.1 Entire Agreement</h3>
      <ul>
        <li>This agreement constitutes the entire agreement between you and Wirre regarding contributions</li>
        <li>It supersedes all prior agreements, understandings, or representations</li>
        <li>No oral modifications or amendments are valid</li>
      </ul>

      <h3>14.2 Amendments</h3>
      <ul>
        <li>Wirre may modify this agreement at any time by providing notice</li>
        <li>Continued access after notice constitutes acceptance of modifications</li>
        <li>If you do not accept modifications, you must immediately cease access</li>
      </ul>

      <h3>14.3 Severability</h3>
      <ul>
        <li>If any provision is found unenforceable, it shall be modified to the minimum extent necessary to be enforceable</li>
        <li>All other provisions remain in full force and effect</li>
        <li>Partial unenforceability does not affect the enforceability of remaining provisions</li>
      </ul>

      <h3>14.4 No Waiver</h3>
      <ul>
        <li>Wirre's failure to enforce any provision does NOT constitute a waiver</li>
        <li>Waivers must be in writing and signed by an authorized representative</li>
        <li>Waiver of one breach does NOT waive subsequent breaches</li>
      </ul>

      <h3>14.5 Assignment</h3>
      <ul>
        <li>You may NOT assign or transfer this agreement or any rights hereunder</li>
        <li>Wirre may freely assign this agreement to any successor, affiliate, or acquirer</li>
        <li>This agreement binds your heirs, executors, and legal representatives</li>
      </ul>

      <h3>14.6 Independent Contractors</h3>
      <ul>
        <li>You are an independent contractor, not an employee, agent, or partner of Wirre</li>
        <li>You have no authority to bind Wirre or make commitments on its behalf</li>
        <li>You are responsible for your own taxes, insurance, and benefits</li>
      </ul>

      <h3>14.7 Force Majeure</h3>
      <ul>
        <li>Wirre is not liable for delays or failures due to circumstances beyond reasonable control</li>
        <li>This includes natural disasters, war, terrorism, government action, or technical failures</li>
        <li>Your obligations (especially confidentiality) are NOT excused by force majeure</li>
      </ul>

      <h3>14.8 Export Controls</h3>
      <ul>
        <li>You must comply with all applicable export control and sanctions laws</li>
        <li>You must not export, re-export, or transfer Wirre code or technology to prohibited countries or entities</li>
        <li>Violations of export controls may result in criminal prosecution</li>
      </ul>

      <h3>14.9 Third-Party Beneficiaries</h3>
      <ul>
        <li>Wirre's affiliates, officers, directors, and employees are third-party beneficiaries of this agreement</li>
        <li>They may enforce provisions that protect their interests</li>
      </ul>
      <hr />

      <h2>15. SPECIFIC ACKNOWLEDGMENTS</h2>
      <p>By accessing the Wirre codebase, you explicitly acknowledge and agree that:</p>
      <ul>
        <li>✓ You have read and understood this entire agreement</li>
        <li>✓ You understand that the Wirre codebase is 100% proprietary and closed-source</li>
        <li>✓ You have NO ownership rights or license to use the code</li>
        <li>✓ You will NOT copy, share, or use any code outside of authorized contributions</li>
        <li>✓ You are bound by perpetual confidentiality obligations</li>
        <li>✓ Violations may result in liquidated damages up to ₹1 Crore or more</li>
        <li>✓ Wirre may seek injunctive relief and criminal prosecution for violations</li>
        <li>✓ Compensation terms will be determined separately if applicable</li>
        <li>✓ You assign all rights in your contributions to Wirre</li>
        <li>✓ This is a legally binding contract enforceable in Indian courts</li>
      </ul>
      <hr />

      <h2>16. CONTACT AND LEGAL NOTICES</h2>
      <p>All legal notices, questions, or concerns regarding this agreement should be directed to:</p>
      <p><strong>Legal Department</strong><br />
        <strong>Email:</strong>thewirrecompany@gmail.com<br /></p>
      <hr />

      <h2>17. ACCEPTANCE AND CERTIFICATION</h2>

      <div className="not-prose bg-black border-2 border-yellow-600 p-6 my-6">
        <p className="font-bold text-lg mb-3 text-yellow-400">MANDATORY CERTIFICATION</p>
        <p className="mb-3 text-white">By accessing the Wirre source code, you certify under penalty of perjury that:</p>
        <ol className="list-decimal pl-6 space-y-2 text-gray-200">
          <li>I have read and understand this entire Contributor Agreement</li>
          <li>I agree to be legally bound by all terms and conditions</li>
          <li>I understand the proprietary nature of the Wirre codebase</li>
          <li>I will not copy, share, or misuse any code or confidential information</li>
          <li>I understand that violations may result in legal action and significant financial penalties</li>
          <li>I assign all rights in my contributions to Wirre</li>
          <li>If I am a Candidate, I understand that I must be at least 18 years old to be eligible for job opportunities, but may participate in rounds if under 18.</li>
        </ol>
      </div>

      <div className="not-prose bg-black border-l-4 border-red-600 p-6 my-6">
        <p className="font-bold text-xl mb-3 text-red-400">⚠️ FINAL WARNING</p>
        <p className="text-white font-semibold mb-2">UNAUTHORIZED COPYING OR DISCLOSURE OF WIRRE SOURCE CODE IS:</p>
        <ul className="space-y-1 text-gray-200">
          <li>✗ A material breach of this agreement</li>
          <li>✗ Theft of trade secrets (criminal offense)</li>
          <li>✗ Subject to liquidated damages up to ₹1 Crore or more</li>
          <li>✗ Subject to injunctive relief (court orders)</li>
          <li>✗ Subject to criminal prosecution under Indian IT Act and IPC</li>

        </ul>
        <p className="mt-3 text-white font-bold">DO NOT ACCESS THE CODE IF YOU DO NOT FULLY AGREE TO THESE TERMS.</p>
      </div>

      <hr />
      <p className="text-center text-sm text-gray-500 mt-8"><em>© 2026 Wirre. All rights reserved. This is a legally binding contract.</em></p>
    </div>
  );
}
