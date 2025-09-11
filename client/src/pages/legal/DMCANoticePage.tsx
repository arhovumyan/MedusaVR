import React from 'react';
import LegalPolicyPage from '../../components/LegalPolicyPage';

const DMCANoticePage: React.FC = () => {
  return (
    <LegalPolicyPage title="DMCA Notice & Takedown Policy" lastUpdated="August 5, 2025">
      <div>
        <p className="text-lg mb-6">
          MEDUSAVR respects intellectual property rights and complies with the Digital Millennium Copyright Act (DMCA).
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">Filing a DMCA Notice</h2>
          <p className="text-gray-300 mb-4">
            If you believe your copyrighted work has been infringed, please provide:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-300">
            <li>Your contact information</li>
            <li>Description of the copyrighted work</li>
            <li>Location of the infringing material</li>
            <li>Statement of good faith belief</li>
            <li>Statement of accuracy under penalty of perjury</li>
            <li>Your physical or electronic signature</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">Counter-Notification</h2>
          <p className="text-gray-300 mb-4">
            If you believe content was removed in error, you may file a counter-notification.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">Contact Information</h2>
          <div className="bg-gray-800 border border-gray-700 p-6 rounded-lg">
            <p className="text-gray-300 mb-2"><strong>DMCA Agent:</strong></p>
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

export default DMCANoticePage;
