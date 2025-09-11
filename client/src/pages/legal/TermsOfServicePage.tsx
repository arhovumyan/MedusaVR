import React from 'react';
import LegalPolicyPage from '../../components/LegalPolicyPage';

const TermsOfServicePage: React.FC = () => {
  return (
    <LegalPolicyPage title="Terms of Service" lastUpdated="August 5, 2025">
      <div>
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">1. Acceptance & Updates</h2>
          <p className="text-gray-300">
            By using MEDUSAVR, you agree to be bound by these Terms of Service. We may update these Terms from time to time; your continued use of the service constitutes acceptance of any changes.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">2. Eligibility</h2>
          <ul className="list-disc list-inside space-y-2 text-gray-300">
            <li>You must be <strong>18 years of age or older</strong> to use MEDUSAVR</li>
            <li>You must provide accurate registration information</li>
            <li>You must comply with all applicable laws in your jurisdiction</li>
            <li>Corporate accounts must be authorized by an adult representative</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">3. Account Registration</h2>
          <ul className="list-disc list-inside space-y-2 text-gray-300">
            <li>You are responsible for maintaining the confidentiality of your account credentials</li>
            <li>You must provide accurate, current, and complete information</li>
            <li>You must promptly update your information if it changes</li>
            <li>You are responsible for all activities under your account</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">4. Licenses & Intellectual Property</h2>
          
          <div className="space-y-6">
            <div className="bg-gray-800 border border-gray-700 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-blue-400 mb-2">Your Content</h3>
              <ul className="list-disc list-inside space-y-1 text-gray-300 text-sm">
                <li>You retain ownership of prompts and inputs you provide</li>
                <li>You grant RINTERIOR a worldwide, non-exclusive license to host, display, process, and improve the Service using your inputs</li>
                <li>You represent that you have the right to grant these licenses</li>
              </ul>
            </div>

            <div className="bg-gray-800 border border-gray-700 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-blue-400 mb-2">AI-Generated Content</h3>
              <ul className="list-disc list-inside space-y-1 text-gray-300 text-sm">
                <li>AI-generated outputs are considered your content once created</li>
                <li>You may use generated content according to these Terms</li>
                <li>RINTERIOR retains no ownership claims to generated outputs</li>
              </ul>
            </div>

            <div className="bg-gray-800 border border-gray-700 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-blue-400 mb-2">Platform Rights</h3>
              <ul className="list-disc list-inside space-y-1 text-gray-300 text-sm">
                <li>MEDUSAVR platform, technology, and branding remain property of RINTERIOR</li>
                <li>No license to reverse-engineer or compete with our services is granted</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">5. User Conduct</h2>
          <div className="bg-red-900/20 border border-red-700 p-6 rounded-lg">
            <p className="text-gray-300 mb-3">You agree <strong>NOT</strong> to:</p>
            <ul className="list-disc list-inside space-y-2 text-gray-300">
              <li>Upload illegal content or content violating Visa and Mastercard Standards</li>
              <li>Create, distribute, or promote content involving minors in any context</li>
              <li>Engage in or promote human trafficking, sex trafficking, or physical abuse</li>
              <li>Upload content without proper consent from all depicted persons</li>
              <li>Harass, threaten, or harm other users</li>
              <li>Infringe upon intellectual property rights</li>
              <li>Attempt to reverse-engineer our AI technology</li>
              <li>Circumvent safety measures or content filters</li>
              <li>Use the service for commercial purposes without authorization</li>
              <li>Misrepresent your age during registration or account creation</li>
              <li>Facilitate any non-consensual activities</li>
            </ul>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">6. Paid Services</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-gray-800 border border-gray-700 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-blue-400 mb-3">Subscriptions</h3>
              <ul className="list-disc list-inside space-y-1 text-gray-300 text-sm">
                <li>Subscriptions automatically renew unless cancelled</li>
                <li>Prices are shown at checkout and may change with notice</li>
                <li>Payment is processed securely through third-party providers</li>
              </ul>
            </div>

            <div className="bg-gray-800 border border-gray-700 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-blue-400 mb-3">Refund Policy</h3>
              <ul className="list-disc list-inside space-y-1 text-gray-300 text-sm">
                <li>Payments are generally non-refundable except where required by law</li>
                <li>Refunds for technical issues may be granted at our discretion</li>
                <li>Subscription cancellations take effect at the next billing cycle</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">7. Service Availability</h2>
          <ul className="list-disc list-inside space-y-2 text-gray-300">
            <li>MEDUSAVR is provided "AS IS" and "AS AVAILABLE"</li>
            <li>We do not guarantee uninterrupted service or specific outputs</li>
            <li>Scheduled maintenance may temporarily limit access</li>
            <li>We reserve the right to modify or discontinue features</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">8. Content Moderation</h2>
          <div className="space-y-4">
            <ul className="list-disc list-inside space-y-2 text-gray-300">
              <li>We employ automated and human content moderation</li>
              <li>All content is reviewed before publication to ensure compliance</li>
              <li>Content violating our policies may be removed without notice</li>
              <li>Repeat violations may result in account suspension or termination</li>
              <li>Appeals may be submitted through our complaint procedure</li>
              <li>All reported complaints are reviewed within seven (7) business days</li>
              <li>Illegal content is removed immediately upon discovery</li>
            </ul>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">8a. AI-Generated Content Disclosure</h2>
          <div className="bg-purple-900/20 border border-purple-700 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-purple-400 mb-3">Transparency Requirements</h3>
            <ul className="list-disc list-inside space-y-2 text-gray-300">
              <li>All AI-generated content is clearly labeled and disclosed to users</li>
              <li>Proper consent is obtained from those depicted in training data or reference images</li>
              <li>AI content generation complies with all applicable content standards</li>
              <li>Users are informed when content is artificially generated</li>
              <li>AI systems are designed with safeguards to prevent prohibited content creation</li>
            </ul>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">9. Privacy & Data Protection</h2>
          <p className="text-gray-300">
            Your privacy is governed by our <a href="/legal/privacy-policy" className="text-blue-400 hover:text-blue-300">Privacy Policy</a>, which is incorporated into these Terms by reference.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">10. Disclaimers</h2>
          <div className="bg-yellow-900/20 border border-yellow-700 p-6 rounded-lg">
            <ul className="list-disc list-inside space-y-2 text-gray-300">
              <li><strong>No Warranties:</strong> Service provided without warranties of any kind</li>
              <li><strong>AI Limitations:</strong> AI outputs may be inaccurate, inappropriate, or unreliable</li>
              <li><strong>No Professional Advice:</strong> Content is for entertainment purposes only</li>
              <li><strong>Third-Party Content:</strong> We are not responsible for user-generated content</li>
              <li><strong>User Responsibility:</strong> Users are 100% responsible for all content they generate</li>
              <li><strong>Legal Compliance:</strong> Users must ensure all activities comply with applicable laws</li>
              <li><strong>No Content Control:</strong> We do not control what users choose to generate</li>
            </ul>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">10a. User Responsibility for Generated Content</h2>
          <div className="bg-red-900/20 border border-red-700 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-red-400 mb-3">Complete User Accountability</h3>
            <ul className="list-disc list-inside space-y-2 text-gray-300">
              <li><strong>Sole Responsibility:</strong> You are solely responsible for all images, characters, and conversations you generate</li>
              <li><strong>Legal Consequences:</strong> Any legal issues arising from your content are your exclusive responsibility</li>
              <li><strong>Criminal Liability:</strong> Any criminal consequences of illegal content generation fall entirely on you</li>
              <li><strong>Copyright Compliance:</strong> You are responsible for ensuring no copyright infringement in your creations</li>
              <li><strong>Consent Requirements:</strong> You must obtain all necessary consents for any likeness or reference material</li>
              <li><strong>Age Verification:</strong> You are responsible for verifying your eligibility to use adult content platforms</li>
            </ul>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">11. Complete Limitation of Liability</h2>
          <div className="bg-red-900/20 border border-red-700 p-6 rounded-lg space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-red-400 mb-3">Maximum Legal Protection</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-300">
                <li><strong>Zero Liability:</strong> MEDUSAVR, RINTERIOR, and all team members have ZERO liability for user-generated content</li>
                <li><strong>No Responsibility:</strong> We are NOT responsible for any illegal content created by users</li>
                <li><strong>User Consequences:</strong> All legal, criminal, and financial consequences of user actions are the user's sole responsibility</li>
                <li><strong>Maximum Monetary Limit:</strong> Our total liability is limited to $0 for any user actions or content</li>
                <li><strong>No Damages:</strong> We are not liable for any direct, indirect, incidental, special, consequential, or punitive damages</li>
                <li><strong>Complete Protection:</strong> This limitation applies regardless of the theory of liability</li>
              </ul>
            </div>
            <div className="bg-red-800/30 border border-red-600 p-4 rounded">
              <p className="text-red-200 font-semibold">
                ⚠️ CRITICAL: Users assume ALL risks and responsibilities. MEDUSAVR and RINTERIOR will never be held liable for user actions.
              </p>
            </div>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">12. Indemnification</h2>
          <div className="bg-orange-900/20 border border-orange-700 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-orange-400 mb-3">User Indemnification Obligation</h3>
            <p className="text-gray-300 mb-3">
              You agree to <strong>indemnify, defend, and hold harmless</strong> MEDUSAVR, RINTERIOR, and all owners, operators, team members, employees, contractors, and affiliates from any and all:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-300">
              <li>Claims, lawsuits, or legal proceedings arising from your use of the platform</li>
              <li>Damages, losses, costs, or expenses related to your content generation</li>
              <li>Attorney fees and legal costs incurred defending against claims related to your actions</li>
              <li>Regulatory fines, penalties, or sanctions resulting from your violations</li>
              <li>Criminal charges or investigations triggered by your illegal activities</li>
              <li>Reputation damage or business losses caused by your misuse of the platform</li>
            </ul>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">Contact Information</h2>
          <div className="bg-gray-800 border border-gray-700 p-6 rounded-lg">
            <p className="text-gray-300 mb-4">
              For questions about these Terms of Service:
            </p>
            <div className="text-sm">
              <p><strong>Email:</strong> <a href="mailto:vrfans11@gmail.com" className="text-blue-400 hover:text-blue-300">vrfans11@gmail.com</a></p>
              <p><strong>Address:</strong> RINTERIOR</p>
            </div>
          </div>
        </section>
      </div>
    </LegalPolicyPage>
  );
};

export default TermsOfServicePage;
