import React from 'react';
import LegalPolicyPage from '../../components/LegalPolicyPage';

const ContentProviderCompliancePage: React.FC = () => {
  return (
    <LegalPolicyPage title="Content Provider Compliance" lastUpdated="August 15, 2025">
      <div>
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">1. Content Provider Agreements</h2>
          <div className="bg-blue-900/20 border border-blue-700 p-6 rounded-lg mb-4">
            <h3 className="text-lg font-semibold text-blue-400 mb-3">Written Agreements Required</h3>
            <p className="text-gray-300 mb-3">
              MEDUSAVR maintains written agreements with all content providers, including users who upload media for AI generation purposes. These agreements expressly prohibit:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-300 pl-4">
              <li>Any illegal activity or content that violates Visa and Mastercard Standards</li>
              <li>Content involving minors in any context</li>
              <li>Non-consensual activities or exploitation</li>
              <li>Content that promotes human trafficking, sex trafficking, or physical abuse</li>
            </ul>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">2. Consent and Documentation Requirements</h2>
          <div className="space-y-6">
            <div className="bg-gray-800 border border-gray-700 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-blue-400 mb-3">Consent to be Depicted</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-300">
                <li>All persons depicted in content must provide explicit written consent</li>
                <li>Consent includes permission for public distribution and uploading to MEDUSAVR</li>
                <li>If content is made available for download, specific consent for downloading is required</li>
              </ul>
            </div>

            <div className="bg-gray-800 border border-gray-700 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-blue-400 mb-3">Age Verification Requirements</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-300">
                <li>Content providers must confirm that all persons depicted are adults (18 years or older)</li>
                <li>Age verification is confirmed during platform registration</li>
                <li>Users certify their age compliance when creating accounts</li>
                <li>Ongoing monitoring ensures compliance with age requirements</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">3. Content Provider Verification</h2>
          <div className="bg-green-900/20 border border-green-700 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-green-400 mb-3">Verification Process</h3>
            <p className="text-gray-300 mb-3">
              MEDUSAVR ensures content compliance through our verification process:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-300 pl-4">
              <li>Age confirmation during initial account registration</li>
              <li>User certification of compliance with platform terms</li>
              <li>Ongoing content monitoring and compliance verification</li>
              <li>Regular re-verification of user compliance as needed</li>
            </ul>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">4. Content Review and Monitoring</h2>
          <div className="space-y-4">
            <div className="bg-orange-900/20 border border-orange-700 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-orange-400 mb-3">Pre-Publication Review</h3>
              <p className="text-gray-300">
                All uploaded content and AI-generated content is reviewed before publication to ensure compliance with our standards and legal requirements. This includes both automated filtering and human review processes.
              </p>
            </div>

            <div className="bg-orange-900/20 border border-orange-700 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-orange-400 mb-3">Real-Time Monitoring</h3>
              <p className="text-gray-300">
                For any real-time or live content streaming services, we maintain full control and real-time monitoring capabilities with immediate content removal authority when violations are detected.
              </p>
            </div>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">5. AI-Generated Content Compliance</h2>
          <div className="bg-purple-900/20 border border-purple-700 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-purple-400 mb-3">AI Content Standards</h3>
            <p className="text-gray-300 mb-3">
              MEDUSAVR features AI content generation capabilities. To ensure compliance with all content standards:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-300 pl-4">
              <li>All AI-generated content is clearly disclosed to consumers</li>
              <li>Proper consent is obtained from those depicted in training data or reference images</li>
              <li>AI systems are designed to prevent generation of prohibited content</li>
              <li>Regular auditing of AI outputs for compliance</li>
              <li>User prompts are filtered to prevent creation of illegal content</li>
            </ul>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">6. Marketing and Advertising Standards</h2>
          <div className="bg-red-900/20 border border-red-700 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-red-400 mb-3">Advertising Compliance</h3>
            <p className="text-gray-300 mb-3">
              MEDUSAVR maintains effective policies to ensure we do not attract users through illegal content:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-300 pl-4">
              <li>Website content and search terms are carefully curated</li>
              <li>No marketing suggesting child exploitation or non-consensual activities</li>
              <li>Clear age verification requirements prominently displayed</li>
              <li>Compliance with advertising standards for adult content platforms</li>
            </ul>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">7. Complaint and Appeal Process</h2>
          <div className="space-y-4">
            <div className="bg-gray-800 border border-gray-700 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-blue-400 mb-3">Reporting Mechanism</h3>
              <p className="text-gray-300 mb-3">
                MEDUSAVR supports a comprehensive complaint process for reporting content that may be illegal or violate our standards:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-300 pl-4">
                <li>All reported complaints are reviewed and resolved within seven (7) business days</li>
                <li>Immediate removal of content when evidence of illegal activity is found</li>
                <li>Appeals process for persons depicted in content who wish removal</li>
                <li>Neutral third-party dispute resolution for consent disagreements</li>
              </ul>
            </div>

            <div className="bg-gray-800 border border-gray-700 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-blue-400 mb-3">Content Removal Policy</h3>
              <p className="text-gray-300">
                When consent cannot be established or is void under applicable law, content is removed with immediate effect. If there is disagreement about consent validity, the matter is resolved by a neutral third party at MEDUSAVR's expense.
              </p>
            </div>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">8. Anti-Human Trafficking Commitment</h2>
          <div className="bg-red-900/20 border border-red-700 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-red-400 mb-3">Zero Tolerance Policy</h3>
            <p className="text-gray-300 mb-3">
              MEDUSAVR maintains strict policies prohibiting any use of our platform that promotes or facilitates:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-300 pl-4">
              <li>Human trafficking</li>
              <li>Sex trafficking</li>
              <li>Physical abuse or exploitation</li>
              <li>Any form of coercion or non-consensual activity</li>
            </ul>
            <p className="text-gray-300 mt-4">
              We actively participate in anti-human trafficking and anti-child exploitation organizations and maintain memberships that support these critical causes.
            </p>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">9. Payment Processing Compliance</h2>
          <div className="bg-blue-900/20 border border-blue-700 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-blue-400 mb-3">Epoch Payment Solutions</h3>
            <p className="text-gray-300 mb-3">
              Upon request, MEDUSAVR can provide Payment Schemes that work with Epoch, including:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-300 pl-4">
              <li>Temporary account credentials allowing access for up to seven (7) days</li>
              <li>Full access to all content behind paywalls or member restrictions</li>
              <li>Complete transparency for compliance verification purposes</li>
            </ul>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">10. Contact and Compliance</h2>
          <div className="bg-gray-800 border border-gray-700 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-blue-400 mb-3">Legal Contact Information</h3>
            <p className="text-gray-300 mb-4">
              For questions about content provider compliance or to report violations:
            </p>
            <div className="space-y-2 text-gray-300">
              <p><strong>Company:</strong> RINTERIOR</p>
              <p><strong>Website:</strong> medusa-vrfriendly.vercel.app</p>
              <p><strong>Email:</strong> <a href="mailto:vrfans11@gmail.com" className="text-blue-400 hover:text-blue-300">vrfans11@gmail.com</a></p>
              <p><strong>Compliance Contact:</strong> <a href="mailto:vrfans11@gmail.com" className="text-blue-400 hover:text-blue-300">vrfans11@gmail.com</a></p>
            </div>
          </div>
        </section>
      </div>
    </LegalPolicyPage>
  );
};

export default ContentProviderCompliancePage;
