import React from 'react';
import LegalPolicyPage from '../../components/LegalPolicyPage';

const BlockedContentPolicyPage: React.FC = () => {
  return (
    <LegalPolicyPage title="Blocked Content Policy" lastUpdated="August 5, 2025">
      <div>
        <p className="text-lg mb-6">
          This policy outlines content that is strictly prohibited on MEDUSAVR and our enforcement measures.
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">Strictly Prohibited Content</h2>
          <div className="bg-red-900/20 border border-red-700 p-6 rounded-lg">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-red-400 mb-2">🚫 Underage Content</h3>
                <p className="text-gray-300 text-sm">Any depiction, suggestion, or reference to minors in sexual or romantic contexts is absolutely forbidden.</p>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-red-400 mb-2">🚫 Non-Consensual Content</h3>
                <p className="text-gray-300 text-sm">Content depicting rape, sexual assault, coercion, or any non-consensual activities.</p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-red-400 mb-2">🚫 Illegal Activities</h3>
                <p className="text-gray-300 text-sm">Content promoting or depicting illegal activities, including drug use, violence, or criminal behavior.</p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-red-400 mb-2">🚫 Hate Speech</h3>
                <p className="text-gray-300 text-sm">Content that promotes hatred, discrimination, or violence against individuals or groups.</p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-red-400 mb-2">🚫 Real Person Impersonation</h3>
                <p className="text-gray-300 text-sm">Creating content that impersonates real individuals without their explicit consent.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">Detection & Prevention</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-gray-800 border border-gray-700 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-blue-400 mb-3">Proactive Measures</h3>
              <ul className="list-disc list-inside space-y-1 text-gray-300 text-sm">
                <li>Advanced AI content filtering</li>
                <li>Keyword and phrase detection</li>
                <li>Image recognition technology</li>
                <li>Behavioral pattern analysis</li>
              </ul>
            </div>

            <div className="bg-gray-800 border border-gray-700 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-blue-400 mb-3">Reactive Measures</h3>
              <ul className="list-disc list-inside space-y-1 text-gray-300 text-sm">
                <li>User reporting system</li>
                <li>Community moderation</li>
                <li>Manual content review</li>
                <li>Regular policy updates</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">Immediate Enforcement</h2>
          <div className="bg-yellow-900/20 border border-yellow-700 p-6 rounded-lg">
            <p className="text-gray-300 mb-4">
              <strong>Zero Tolerance Policy:</strong> Blocked content violations result in immediate and severe consequences:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-300">
              <li><strong>Instant Content Removal:</strong> Violating content is immediately deleted</li>
              <li><strong>Account Suspension:</strong> User accounts are suspended pending investigation</li>
              <li><strong>Permanent Ban:</strong> Severe violations result in permanent account termination</li>
              <li><strong>Legal Reporting:</strong> Illegal content may be reported to authorities</li>
            </ul>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">Reporting Violations</h2>
          <div className="space-y-4">
            <p className="text-gray-300">
              If you encounter blocked content on our platform, please report it immediately:
            </p>
            
            <div className="bg-gray-800 border border-gray-700 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-blue-400 mb-2">Emergency Reporting</h3>
              <p className="text-gray-300 text-sm mb-2">For immediate safety concerns:</p>
              <p className="text-blue-400">Email: <a href="mailto:vrfans11@gmail.com" className="hover:text-blue-300">vrfans11@gmail.com</a></p>
            </div>

            <div className="bg-gray-800 border border-gray-700 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-blue-400 mb-2">Standard Reporting</h3>
              <p className="text-gray-300 text-sm">Use the in-app reporting tools or contact our moderation team.</p>
            </div>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">Legal Compliance</h2>
          <p className="text-gray-300">
            MEDUSAVR operates in full compliance with international laws regarding online content, including but not limited to regulations in the United States, European Union, and other jurisdictions where our services are available. We cooperate fully with law enforcement agencies when legally required.
          </p>
        </section>
      </div>
    </LegalPolicyPage>
  );
};

export default BlockedContentPolicyPage;
