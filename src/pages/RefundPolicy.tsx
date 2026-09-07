import { Card, CardContent } from '@/components/ui/card';
import { Layout } from '@/components/layout/Layout';

export default function RefundPolicy() {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <h1 className="text-4xl font-bold mb-6 font-mono">Refund &amp; Cancellation Policy</h1>

        <Card className="border-border">
          <CardContent className="p-4 md:p-8 prose prose-slate dark:prose-invert max-w-none">
            <p><strong>Effective Date: September 7, 2026</strong></p>
            <p>
              This policy applies to Platform Fees paid by Organizers on Wirre for publishing paid Assessments.
              It should be read together with our <a href="/tnc">Terms &amp; Conditions</a>. Candidates never pay
              any fee to use Wirre, so nothing in this policy applies to Candidates.
            </p>
            <hr />

            <h2>1. WHAT YOU PAY FOR</h2>
            <p>
              The Platform Fee is calculated as <strong>20% of the maximum salary offered × number of positions</strong>,
              charged when you publish a paid Assessment. Payments are processed securely through Razorpay and are
              confirmed only after the payment gateway verifies the transaction.
            </p>
            <hr />

            <h2>2. GENERAL POLICY: NON-REFUNDABLE ONCE PUBLISHED</h2>
            <ul>
              <li>Platform Fees are <strong>non-refundable</strong> once an Assessment has been successfully published</li>
              <li>No refunds are issued if you cancel an Assessment after its start date</li>
              <li>No refunds are issued for low or no Candidate participation</li>
              <li>No refunds are issued if you are dissatisfied with the quality or outcome of Submissions &mdash; the Platform facilitates the workflow but does not guarantee hiring outcomes</li>
            </ul>
            <p>This reflects the cost of infrastructure, repository provisioning, and platform operations that occur immediately upon publication.</p>
            <hr />

            <h2>3. CANCELLING BEFORE PUBLICATION</h2>
            <ul>
              <li>If your payment succeeds but you cancel <strong>before</strong> the Assessment is published, contact us within 24 hours of payment and we will process a full refund</li>
              <li>Once an Assessment is published, the "before publication" cancellation window no longer applies</li>
            </ul>
            <hr />

            <h2>4. SALARY CHANGES AFTER PAYMENT</h2>
            <ul>
              <li>If you increase the maximum salary after payment, you must pay the difference: <em>(New Max Salary − Original Max Salary) × Number of Positions × 20%</em></li>
              <li>If you decrease the maximum salary, <strong>no refund</strong> is issued for the difference</li>
            </ul>
            <hr />

            <h2>5. FAILED, DUPLICATE, OR ERRONEOUS PAYMENTS</h2>
            <p>The following are eligible for a full refund, processed back to your original payment method within 7&ndash;10 business days:</p>
            <ul>
              <li>Payment was deducted but the Assessment was not published due to a technical error on our end</li>
              <li>You were charged more than once for the same Assessment (duplicate charge)</li>
              <li>An amount was charged that does not match the Platform Fee calculation shown to you before payment</li>
            </ul>
            <p>To report one of these issues, email <strong>thewirrecompany@gmail.com</strong> with your payment reference (visible in your Razorpay receipt) within 30 days of the charge.</p>
            <hr />

            <h2>6. ACCOUNT DELETION FEES</h2>
            <ul>
              <li>If you delete your Organizer account with no Upcoming Assessments, no fee applies</li>
              <li>If you delete your account with Upcoming Assessments, a Deletion Fee of 20% of the sum of those Assessments' Platform Fees applies and is <strong>non-refundable</strong> once paid, as it covers cancellation and Candidate notification costs</li>
            </ul>
            <hr />

            <h2>7. HOW REFUNDS ARE ISSUED</h2>
            <ul>
              <li>Approved refunds are issued to the original payment method via Razorpay</li>
              <li>Processing typically takes 7&ndash;10 business days, depending on your bank or card issuer</li>
              <li>We do not issue refunds in cash or to a different account</li>
            </ul>
            <hr />

            <h2>8. HOW TO REQUEST A REFUND</h2>
            <p>Email <strong>thewirrecompany@gmail.com</strong> with:</p>
            <ul>
              <li>Your registered Organizer account email</li>
              <li>The Assessment name or ID</li>
              <li>Your Razorpay payment reference ID</li>
              <li>The reason for your request</li>
            </ul>
            <p>We aim to respond within 48 business hours and resolve eligible requests within 7 business days.</p>
            <hr />

            <h2>9. DISPUTES</h2>
            <p>
              If you believe a charge was made in error and it is not resolved through the process above, you may
              raise a dispute with Razorpay or your card issuer. This does not limit your rights under the
              Dispute Resolution provisions of our <a href="/tnc">Terms &amp; Conditions</a>.
            </p>
            <hr />

            <h2>10. CONTACT US</h2>
            <p>For refund or billing questions:</p>
            <p><strong>Email:</strong> thewirrecompany@gmail.com</p>
            <hr />

            <p className="text-center text-sm text-gray-500 mt-8"><em>© 2026 Wirre. All rights reserved.</em></p>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
