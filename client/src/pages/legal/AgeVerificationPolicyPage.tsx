import React from 'react';
import LegalPolicyPage from '../../components/LegalPolicyPage';

const AgeVerificationPolicyPage: React.FC = () => {
  return (
    <LegalPolicyPage title="Age Verification Policy" lastUpdated="August 5, 2025">
      <div>
        <p className="text-lg mb-6">
          MEDUSAVR is an adult-only platform. This policy outlines our age verification procedures and child protection measures.
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">Age Requirements</h2>
          <div className="bg-red-900/20 border border-red-700 p-6 rounded-lg">
            <h3 className="text-xl font-semibold text-red-400 mb-3">18+ Only</h3>
            <p className="text-gray-300 mb-3">
              You must be at least 18 years old to access or use MEDUSAVR services. Users under 18 are strictly prohibited.
            </p>
            <ul className="list-disc list-inside space-y-1 text-gray-300 text-sm">
              <li>No exceptions for mature minors</li>
              <li>Parental consent cannot override age requirements</li>
              <li>Educational or research purposes do not exempt minors</li>
            </ul>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">Verification Methods</h2>
          <div className="space-y-6">
            <div className="bg-blue-900/20 border border-blue-700 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-blue-400 mb-3">Age Confirmation Process</h3>
              <p className="text-gray-300 mb-3">
                MEDUSAVR ensures age compliance through our registration process:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-300 pl-4">
                <li>Age confirmation is required during initial account registration</li>
                <li>Users must confirm they are 18 years of age or older during signup</li>
                <li>Account creation includes acceptance of age compliance terms</li>
                <li>Age confirmation is maintained for the duration of account access</li>
              </ul>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-gray-800 border border-gray-700 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-blue-400 mb-3">Registration Confirmation</h3>
                <ul className="list-disc list-inside space-y-1 text-gray-300 text-sm">
                  <li>User self-certification of age during registration</li>
                  <li>Acceptance of terms confirming 18+ age requirement</li>
                  <li>Account creation with age compliance agreement</li>
                  <li>Ongoing monitoring for compliance violations</li>
                </ul>
              </div>

              <div className="bg-gray-800 border border-gray-700 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-blue-400 mb-3">Supporting Verification</h3>
                <ul className="list-disc list-inside space-y-1 text-gray-300 text-sm">
                  <li>Email verification and account monitoring</li>
                  <li>Terms of service acknowledgment</li>
                  <li>Ongoing behavioral analysis</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">Detection & Prevention</h2>
          <div className="space-y-4">
            <div className="bg-gray-800 border border-gray-700 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-yellow-400 mb-2">Automated Detection</h3>
              <p className="text-gray-300 text-sm">
                Advanced algorithms monitor user behavior patterns that may indicate underage access attempts.
              </p>
            </div>
            
            <div className="bg-gray-800 border border-gray-700 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-yellow-400 mb-2">Community Reporting</h3>
              <p className="text-gray-300 text-sm">
                Users can report suspected underage accounts through our reporting system.
              </p>
            </div>

            <div className="bg-gray-800 border border-gray-700 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-yellow-400 mb-2">Regular Audits</h3>
              <p className="text-gray-300 text-sm">
                Periodic reviews of user accounts and verification processes ensure ongoing compliance.
              </p>
            </div>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">Enforcement Actions</h2>
          <div className="bg-yellow-900/20 border border-yellow-700 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-yellow-400 mb-3">Zero Tolerance Policy</h3>
            <p className="text-gray-300 mb-3">
              Suspected underage users face immediate enforcement:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-300">
              <li><strong>Immediate Account Suspension:</strong> Access blocked pending verification</li>
              <li><strong>Enhanced Verification Required:</strong> Additional documentation may be requested</li>
              <li><strong>Permanent Ban:</strong> Confirmed underage users are permanently banned</li>
              <li><strong>Legal Reporting:</strong> Violations may be reported to authorities</li>
            </ul>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">Reporting Underage Users</h2>
          <div className="bg-red-900/20 border border-red-700 p-6 rounded-lg">
            <p className="text-gray-300 mb-4">
              <strong>Immediate Action Required:</strong> If you suspect a user is underage, report them immediately:
            </p>
            <div className="space-y-2">
              <p className="text-red-400"><strong>Emergency:</strong> <a href="mailto:vrfans11@gmail.com" className="hover:text-red-300">vrfans11@gmail.com</a></p>
              <p className="text-gray-300"><strong>General Reporting:</strong> Use in-app reporting tools</p>
              <p className="text-gray-300"><strong>Include:</strong> Username, evidence, and detailed description</p>
            </div>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">Legal Compliance</h2>
          <p className="text-gray-300">
            Our age verification policies comply with applicable laws including COPPA (Children's Online Privacy Protection Act), 
            GDPR-K (regarding children's data), and other international regulations protecting minors online.
          </p>
        </section>
      </div>
    </LegalPolicyPage>
  );
};

export default AgeVerificationPolicyPage;
