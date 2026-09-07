import { Card, CardContent } from '@/components/ui/card';
import { Layout } from '@/components/layout/Layout';

export default function Privacy() {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <h1 className="text-4xl font-bold mb-6 font-mono">Privacy Policy</h1>

        <Card className="border-border">
          <CardContent className="p-4 md:p-8 prose prose-slate dark:prose-invert max-w-none">
            <p><strong>Effective Date: September 7, 2026</strong></p>
            <p>
              This Privacy Policy explains how Wirre ("we," "us," or "our") collects, uses, shares, and protects
              information when you use the Wirre platform ("Platform"), whether as a Candidate, Organizer, or
              Contributor. It should be read together with our{' '}
              <a href="/tnc">Terms &amp; Conditions</a>.
            </p>
            <hr />

            <h2>1. INFORMATION WE COLLECT</h2>
            <h3>1.1 Information You Provide</h3>
            <ul>
              <li>Account details: name, email address, password (stored securely, never in plain text)</li>
              <li>GitHub account information (username, public profile, repository activity you authorize)</li>
              <li>Profile information: skills, experience, resume, portfolio links</li>
              <li>Assessment submissions: code, documentation, and related materials</li>
              <li>Organizer details: company name, billing information, assessment requirements</li>
              <li>Payment details for Organizers, processed by Razorpay (we do not store full card numbers)</li>
              <li>Communications you send us, such as support requests or feedback</li>
            </ul>
            <h3>1.2 Information Collected Automatically</h3>
            <ul>
              <li>Usage data: pages visited, features used, timestamps, general device/browser information</li>
              <li>Approximate location derived from IP address (for security and fraud prevention)</li>
              <li>A single functional cookie (<code>sidebar_state</code>) that remembers whether your navigation sidebar is expanded or collapsed &mdash; this is not used for tracking or advertising</li>
            </ul>
            <p>See <strong>Section 6 (Cookies &amp; Analytics)</strong> below for full detail on automated data collection.</p>
            <h3>1.3 Information We Do Not Collect</h3>
            <ul>
              <li>We do not collect more personal data than is necessary to operate the Platform</li>
              <li>We do not request sensitive personal data (health, biometric, religious, political, etc.) and you should not submit any such data through the Platform</li>
              <li>We do not buy personal data about you from third parties</li>
            </ul>
            <hr />

            <h2>2. HOW WE USE YOUR INFORMATION</h2>
            <ul>
              <li>To create and maintain your account</li>
              <li>To operate Assessments: forking repositories, receiving submissions, and displaying results to Organizers</li>
              <li>To process Organizer payments and platform fees via Razorpay</li>
              <li>To communicate essential service, security, and legal notices</li>
              <li>To send optional marketing communications (only where you have not opted out)</li>
              <li>To detect, investigate, and prevent fraud, abuse, or Terms violations</li>
              <li>To comply with legal obligations and respond to lawful requests</li>
              <li>To improve Platform performance and reliability</li>
            </ul>
            <p>We do not use your personal information for automated decision-making that produces legal or similarly significant effects without human involvement. Hiring decisions are made solely by Organizers.</p>
            <hr />

            <h2>3. LEGAL BASIS FOR PROCESSING</h2>
            <p>We process your information on the following bases:</p>
            <ul>
              <li><strong>Consent</strong> &mdash; where you have agreed, e.g. at signup or to receive marketing communications</li>
              <li><strong>Contract performance</strong> &mdash; to provide the Platform services you request</li>
              <li><strong>Legal obligation</strong> &mdash; to comply with tax, financial, or regulatory requirements</li>
              <li><strong>Legitimate interest</strong> &mdash; for fraud prevention, security, and improving the Platform, balanced against your rights</li>
            </ul>
            <hr />

            <h2>4. HOW WE SHARE YOUR INFORMATION</h2>
            <h3>4.1 With Organizers and Candidates</h3>
            <ul>
              <li>For <strong>paid rounds</strong>, your Candidate Profile is hidden from Organizers until after final hiring decisions are made; only anonymized Submissions are visible during evaluation</li>
              <li>For <strong>unpaid rounds</strong>, your Profile remains hidden to prevent bias</li>
              <li>Organizers only see the information necessary to evaluate your Submission and, after selection, to contact you</li>
            </ul>
            <h3>4.2 With Service Providers</h3>
            <p>We share limited data with vetted service providers who help us run the Platform, including:</p>
            <ul>
              <li><strong>Supabase</strong> &mdash; database, authentication, and backend infrastructure</li>
              <li><strong>Razorpay</strong> &mdash; payment processing for Organizer platform fees</li>
              <li><strong>GitHub</strong> &mdash; repository forking and submission workflow (via our GitHub App)</li>
              <li><strong>Vercel</strong> &mdash; hosting, privacy-friendly analytics, and performance monitoring</li>
            </ul>
            <p>These providers are contractually restricted to using your data only to provide services to us.</p>
            <h3>4.3 What We Never Do</h3>
            <ul>
              <li>We do <strong>not sell</strong> your personal information to third parties</li>
              <li>We do <strong>not</strong> share your data with advertisers or data brokers</li>
              <li>We do <strong>not</strong> use your Assessment submissions or Profile for purposes unrelated to the Platform without your consent</li>
            </ul>
            <h3>4.4 Legal Disclosures</h3>
            <p>We may disclose information where required by law, to enforce our Terms, to protect the rights and safety of Wirre or others, or in connection with a merger, acquisition, or sale of assets (with notice to you).</p>
            <hr />

            <h2>5. DATA MINIMIZATION</h2>
            <p>We follow a "necessary data only" principle:</p>
            <ul>
              <li>We only ask for the fields required to operate the specific feature you are using</li>
              <li>Optional fields are clearly marked as optional</li>
              <li>We periodically review what data we collect and remove fields that are no longer needed</li>
              <li>Assessment data is retained only as long as needed for hiring records or legal compliance (see Section 8)</li>
            </ul>
            <hr />

            <h2>6. COOKIES &amp; ANALYTICS</h2>
            <h3>6.1 Cookies We Use</h3>
            <table>
              <thead>
                <tr><th>Cookie</th><th>Type</th><th>Purpose</th></tr>
              </thead>
              <tbody>
                <tr><td><code>sidebar_state</code></td><td>Strictly necessary / functional</td><td>Remembers your sidebar layout preference. No tracking.</td></tr>
                <tr><td>Supabase auth session</td><td>Strictly necessary</td><td>Keeps you signed in.</td></tr>
              </tbody>
            </table>
            <p>We do not use advertising cookies, cross-site tracking cookies, or third-party marketing pixels.</p>
            <h3>6.2 Analytics</h3>
            <ul>
              <li>We use <strong>Vercel Web Analytics</strong> and <strong>Vercel Speed Insights</strong> to understand aggregate traffic and performance. These tools are cookieless by default and do not build individual visitor profiles or track you across other websites.</li>
              <li>Analytics data is used only to improve Platform reliability and user experience.</li>
            </ul>
            <h3>6.3 Your Choices</h3>
            <ul>
              <li>Because we do not use tracking or advertising cookies, there is nothing to opt out of beyond standard browser cookie controls</li>
              <li>You can clear the <code>sidebar_state</code> cookie at any time through your browser settings without affecting your account</li>
              <li>You can block cookies entirely in your browser; strictly necessary cookies (like your login session) are required for the Platform to function</li>
            </ul>
            <hr />

            <h2>7. DATA SECURITY</h2>
            <ul>
              <li>Data is encrypted in transit (HTTPS/TLS) and at rest</li>
              <li>Access to production data is restricted to authorized personnel on a need-to-know basis</li>
              <li>Passwords are hashed and never stored in plain text</li>
              <li>We cannot guarantee absolute security; no system is completely immune to risk</li>
              <li>If we become aware of a data breach affecting your personal information, we will notify affected users and relevant authorities as required by law</li>
            </ul>
            <hr />

            <h2>8. DATA RETENTION</h2>
            <ul>
              <li>Account data is retained while your account is active</li>
              <li>Assessment and Submission data is retained for hiring record-keeping purposes</li>
              <li>Financial records related to Organizer payments are retained as required by Indian tax and financial regulations</li>
              <li>When you delete your account, your Profile becomes inaccessible immediately; backups containing your data are purged within 90 days</li>
              <li>Some anonymized or aggregated data may be retained indefinitely, as it no longer identifies you</li>
            </ul>
            <hr />

            <h2>9. YOUR RIGHTS</h2>
            <p>Subject to applicable law (including India's Digital Personal Data Protection Act, 2023), you have the right to:</p>
            <ul>
              <li><strong>Access</strong> the personal data we hold about you</li>
              <li><strong>Correct</strong> inaccurate or incomplete data</li>
              <li><strong>Delete</strong> your account and associated personal data, subject to legal retention requirements</li>
              <li><strong>Export</strong> your data in a standard machine-readable format</li>
              <li><strong>Withdraw consent</strong> for optional processing (e.g. marketing emails) at any time</li>
              <li><strong>Object</strong> to certain processing based on legitimate interest</li>
            </ul>
            <p>To exercise any of these rights, email <strong>thewirrecompany@gmail.com</strong>. We will respond within 30 days.</p>
            <hr />

            <h2>10. CHILDREN'S PRIVACY</h2>
            <ul>
              <li>Candidates of any age may register to participate in free practice rounds</li>
              <li>Candidates under 18 are not eligible for paid rounds and their data is used solely to facilitate practice participation</li>
              <li>We do not knowingly collect more data from minors than is necessary for this purpose</li>
              <li>A parent or guardian may contact us to review or request deletion of a minor's data</li>
            </ul>
            <hr />

            <h2>11. INTERNATIONAL USERS</h2>
            <p>
              The Platform is operated from and governed by the laws of India. If you access the Platform from
              outside India, your information will be processed in India and other jurisdictions where our
              service providers operate, which may have different data protection laws than your home country.
            </p>
            <hr />

            <h2>12. THIRD-PARTY LINKS</h2>
            <p>
              The Platform may link to third-party sites (e.g. GitHub, LinkedIn, Razorpay). We are not responsible
              for the privacy practices of those sites. Review their policies before providing information to them.
            </p>
            <hr />

            <h2>13. CHANGES TO THIS POLICY</h2>
            <ul>
              <li>We may update this Privacy Policy from time to time by posting a revised version on the Platform</li>
              <li>Material changes will be notified via email or Platform notification</li>
              <li>Continued use of the Platform after changes take effect constitutes acceptance</li>
            </ul>
            <hr />

            <h2>14. CONTACT US</h2>
            <p>For any privacy questions, requests, or concerns:</p>
            <p><strong>Email:</strong> thewirrecompany@gmail.com</p>
            <hr />

            <p className="text-center text-sm text-gray-500 mt-8"><em>© 2026 Wirre. All rights reserved.</em></p>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
