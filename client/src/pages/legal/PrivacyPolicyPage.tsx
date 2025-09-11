import React from 'react';
import LegalPolicyPage from '../../components/LegalPolicyPage';

const PrivacyPolicyPage: React.FC = () => {
  return (
    <LegalPolicyPage title="Privacy Policy" lastUpdated="August 5, 2025">
      <div>
        <p className="text-lg mb-6">
          This Privacy Policy provides detailed information on how we collect, use, and safeguard your personal information when you use MEDUSAVR services.
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">GDPR Compliance</h2>
          <p className="text-gray-300 mb-4">
            If you are a resident of the European Union, you are entitled to enhanced rights and protections under the General Data Protection Regulation 2016/679 (GDPR). These rights include:
          </p>
          <ul className="list-disc list-inside space-y-1 text-gray-300">
            <li>Transparency regarding the processing of your personal data</li>
            <li>The right to access and rectify your information</li>
            <li>The right to erasure</li>
            <li>The right to restrict processing</li>
            <li>The right to data portability</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">Key Definitions</h2>
          <div className="space-y-4">
            <div className="bg-gray-800 border border-gray-700 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-blue-400 mb-2">Personal Data</h3>
              <p className="text-gray-300 text-sm">
                Any information relating to you as an identified person, directly or indirectly, such as your name, email address, username, date of birth, gender, location data, or factors specific to your identity.
              </p>
            </div>
            
            <div className="bg-gray-800 border border-gray-700 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-blue-400 mb-2">Processing</h3>
              <p className="text-gray-300 text-sm">
                Any operation performed on Personal Data, whether automated or not, such as collection, recording, organization, structuring, storage, adaptation, alteration, retrieval, consultation, use, disclosure, dissemination, alignment, combination, restriction, erasure or destruction.
              </p>
            </div>

            <div className="bg-gray-800 border border-gray-700 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-blue-400 mb-2">Consent</h3>
              <p className="text-gray-300 text-sm">
                Any freely given, specific, informed and unambiguous indication of your wishes by which you, through a statement or clear affirmative action, signify agreement to the Processing of Personal Data relating to you.
              </p>
            </div>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">Purpose of Personal Data Processing</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-gray-800 border border-gray-700 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-blue-400 mb-3">When Visiting the Website</h3>
              <ul className="list-disc list-inside space-y-1 text-gray-300 text-sm">
                <li>Analyzing and understanding your behavior on the Website</li>
                <li>Performing our Services</li>
                <li>Making improvements to the Website and Services</li>
                <li>Enhancing, customizing, or modifying our communications</li>
                <li>Improving data security</li>
                <li>Determining whether marketing campaigns are effective</li>
              </ul>
            </div>

            <div className="bg-gray-800 border border-gray-700 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-blue-400 mb-3">When Using Our Services</h3>
              <ul className="list-disc list-inside space-y-1 text-gray-300 text-sm">
                <li>Setting up a User account and profile</li>
                <li>Enabling AI character interactions</li>
                <li>Adapting Services to your needs</li>
                <li>Developing new tools and features</li>
                <li>Providing customer support</li>
                <li>Conducting market research</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">Personal Data Collection</h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold text-blue-400 mb-3">For Visitors</h3>
              <p className="text-gray-300 mb-3">
                The Website can be visited anonymously. We may process anonymous metadata through cookies such as:
              </p>
              <ul className="list-disc list-inside space-y-1 text-gray-300 text-sm">
                <li>Browser and operating system information</li>
                <li>IP address of the device used</li>
                <li>Date and time of website visits</li>
                <li>Navigation behavior and preferences</li>
                <li>Previous website visited</li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-blue-400 mb-3">For Registered Users</h3>
              <p className="text-gray-300 mb-3">
                We collect Personal Data through various methods:
              </p>
              <ul className="list-disc list-inside space-y-1 text-gray-300 text-sm">
                <li>Information you provide when registering for a Subscription</li>
                <li>Content you provide via your personal account</li>
                <li>Communications with our support team</li>
                <li>Automated technologies and interactions with AI characters</li>
                <li>Technical data about your equipment and browsing patterns</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">Your Rights</h2>
          <div className="bg-blue-900/20 border border-blue-700 p-6 rounded-lg">
            <p className="text-gray-300 mb-4">
              Under applicable data protection laws, you have the following rights:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-300">
              <li><strong>Right to Access:</strong> Request copies of your personal data</li>
              <li><strong>Right to Rectification:</strong> Request correction of inaccurate personal data</li>
              <li><strong>Right to Erasure:</strong> Request deletion of your personal data</li>
              <li><strong>Right to Restrict Processing:</strong> Request limitation of processing your personal data</li>
              <li><strong>Right to Data Portability:</strong> Request transfer of your data to another organization</li>
              <li><strong>Right to Object:</strong> Object to processing of your personal data</li>
            </ul>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">Data Security</h2>
          <p className="text-gray-300 mb-4">
            We implement appropriate technical and organizational measures to protect your personal data against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the Internet or electronic storage is 100% secure.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">Controller Information</h2>
          <div className="bg-gray-800 border border-gray-700 p-6 rounded-lg">
            <p className="text-gray-300 mb-4">
              This Privacy Policy is issued on behalf of RINTERIOR, the parent company of MEDUSAVR. We have appointed a Controller who is responsible for overseeing questions in relation to this Privacy Policy.
            </p>
            <div className="text-sm">
              <p><strong>Email:</strong> <a href="mailto:vrfans11@gmail.com" className="text-blue-400 hover:text-blue-300">vrfans11@gmail.com</a></p>
              <p><strong>Address:</strong> RINTERIOR</p>
            </div>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">Changes to This Policy</h2>
          <p className="text-gray-300">
            We may update this Privacy Policy periodically to reflect changes in our data practices or for operational, legal, or regulatory reasons. We encourage you to review this Privacy Policy regularly to stay informed about how we protect your information.
          </p>
        </section>
      </div>
    </LegalPolicyPage>
  );
};

export default PrivacyPolicyPage;
