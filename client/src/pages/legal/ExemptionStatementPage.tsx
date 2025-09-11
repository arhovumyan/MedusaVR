import React from 'react';
import LegalPolicyPage from '../../components/LegalPolicyPage';

const ExemptionStatementPage: React.FC = () => {
  return (
    <LegalPolicyPage title="2257 Exemption Statement" lastUpdated="August 5, 2025">
      <div>
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">18 U.S.C. § 2257 Exemption Statement</h2>
          <div className="bg-blue-900/20 border border-blue-700 p-6 rounded-lg">
            <p className="text-gray-300 mb-4">
              MEDUSAVR operates as an AI-generated content platform that creates entirely fictional, computer-generated characters and scenarios. 
              All content on this platform is produced through artificial intelligence and does not involve real human performers.
            </p>
            
            <p className="text-gray-300 mb-4">
              <strong>Exemption Basis:</strong> The content on MEDUSAVR qualifies for exemption under 18 U.S.C. § 2257 as it consists entirely of:
            </p>
            
            <ul className="list-disc list-inside space-y-2 text-gray-300">
              <li>Computer-generated imagery (CGI)</li>
              <li>Artificial intelligence-generated content</li>
              <li>Purely fictional characters with no basis in real persons</li>
              <li>Digitally created scenarios without human performers</li>
            </ul>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">Content Verification</h2>
          <p className="text-gray-300 mb-4">
            RINTERIOR, operating MEDUSAVR, maintains strict policies ensuring all content meets exemption criteria:
          </p>
          
          <div className="space-y-4">
            <div className="bg-gray-800 border border-gray-700 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-green-400 mb-2">✓ No Real Performers</h3>
              <p className="text-gray-300 text-sm">All characters are AI-generated and completely fictional.</p>
            </div>
            
            <div className="bg-gray-800 border border-gray-700 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-green-400 mb-2">✓ Age Verification Not Required</h3>
              <p className="text-gray-300 text-sm">As no real persons are depicted, age verification records are not applicable.</p>
            </div>

            <div className="bg-gray-800 border border-gray-700 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-green-400 mb-2">✓ Compliance Monitoring</h3>
              <p className="text-gray-300 text-sm">Regular audits ensure continued compliance with exemption requirements.</p>
            </div>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">Legal Compliance</h2>
          <p className="text-gray-300">
            This exemption statement is maintained in accordance with federal regulations. RINTERIOR remains committed to full legal compliance and regularly reviews policies to ensure continued adherence to all applicable laws.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">Contact Information</h2>
          <div className="bg-gray-800 border border-gray-700 p-6 rounded-lg">
            <p className="text-gray-300 mb-2">For questions regarding this exemption statement:</p>
            <p className="text-blue-400">Email: <a href="mailto:vrfans11@gmail.com" className="hover:text-blue-300">vrfans11@gmail.com</a></p>
            <p className="text-gray-300 mt-2">
              RINTERIOR<br />
            </p>
          </div>
        </section>
      </div>
    </LegalPolicyPage>
  );
};

export default ExemptionStatementPage;
