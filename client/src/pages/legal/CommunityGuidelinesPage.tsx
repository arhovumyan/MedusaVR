import React from 'react';
import LegalPolicyPage from '../../components/LegalPolicyPage';

const CommunityGuidelinesPage: React.FC = () => {
  return (
    <LegalPolicyPage title="Community Guidelines" lastUpdated="August 5, 2025">
      <div>
        <p className="text-lg mb-6">
          Welcome to the MEDUSAVR community! These guidelines help ensure our platform remains a safe, respectful, and enjoyable environment for all adult users.
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">Core Principles</h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold text-blue-400 mb-2">1. Respect Consent & Agency</h3>
              <ul className="list-disc list-inside space-y-1 text-gray-300">
                <li>All sexual content must depict consensual interactions between fictional adult characters</li>
                <li>Content implying non-consent, coercion, or exploitation is prohibited</li>
                <li>Respect the autonomy and dignity of all community members</li>
                <li>Any content promoting human trafficking, sex trafficking, or physical abuse is strictly forbidden</li>
                <li>We actively support anti-human trafficking and anti-child exploitation organizations</li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-blue-400 mb-2">2. No Real-Life Harassment</h3>
              <ul className="list-disc list-inside space-y-1 text-gray-300">
                <li>Hate speech, threats, or targeted harassment are strictly prohibited</li>
                <li>Do not use the platform to intimidate, stalk, or harm others</li>
                <li>Respect diverse backgrounds, identities, and perspectives</li>
                <li>Disagreements should be handled respectfully and constructively</li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-blue-400 mb-2">3. Protect Privacy</h3>
              <ul className="list-disc list-inside space-y-1 text-gray-300">
                <li>Do not share personal information about yourself or others</li>
                <li>Respect others' right to anonymity and privacy</li>
                <li>Do not attempt to identify or contact other users outside the platform</li>
                <li>Report any privacy violations to our moderation team</li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-blue-400 mb-2">4. Creative Freedom Within Limits</h3>
              <ul className="list-disc list-inside space-y-1 text-gray-300">
                <li>Explore fantasy scenarios that comply with our Blocked-Content Policy</li>
                <li>Express creativity while respecting community standards</li>
                <li>All content must involve fictional adult characters only</li>
                <li>Use content warnings appropriately for sensitive material</li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-blue-400 mb-2">5. Quality & Courtesy</h3>
              <ul className="list-disc list-inside space-y-1 text-gray-300">
                <li>Use clear, specific prompts to get better AI responses</li>
                <li>Avoid spam, repetitive, or low-quality submissions</li>
                <li>Tag NSFW content properly using our labeling system</li>
                <li>Be patient with AI responses and technology limitations</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">Content Standards</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-green-900/20 border border-green-700 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-green-400 mb-3">Acceptable Content</h3>
              <ul className="list-disc list-inside space-y-1 text-gray-300 text-sm">
                <li>Fictional adult character interactions</li>
                <li>Consensual romantic and sexual scenarios</li>
                <li>Creative storytelling and interactions</li>
                <li>Artistic and aesthetic character designs</li>
              </ul>
            </div>

            <div className="bg-red-900/20 border border-red-700 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-red-400 mb-3">Unacceptable Content</h3>
              <ul className="list-disc list-inside space-y-1 text-gray-300 text-sm">
                <li>Any depiction of minors</li>
                <li>Non-consensual activities or violence</li>
                <li>Real person impersonation without consent</li>
                <li>Illegal activities or content</li>
                <li>Hate speech or discrimination</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">Enforcement Procedures</h2>
          
          <div className="bg-gray-800 border border-gray-700 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-blue-400 mb-3">Warning System</h3>
            <ol className="list-decimal list-inside space-y-2 text-gray-300">
              <li><strong>First Violation:</strong> Warning with explanation of guidelines</li>
              <li><strong>Minor Repeat Violations:</strong> Temporary content restrictions</li>
              <li><strong>Major Violations:</strong> Account suspension with review period</li>
              <li><strong>Severe Violations:</strong> Immediate permanent account termination</li>
            </ol>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">Community Reporting</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-blue-400 mb-3">How to Report</h3>
              <ul className="list-disc list-inside space-y-1 text-gray-300">
                <li>Use in-app reporting tools</li>
                <li>Email: <a href="mailto:vrfans11@gmail.com" className="text-blue-400 hover:text-blue-300">vrfans11@gmail.com</a></li>
                <li>Include specific details and evidence</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-blue-400 mb-3">What to Report</h3>
              <ul className="list-disc list-inside space-y-1 text-gray-300">
                <li>Policy violations</li>
                <li>Harassment or threats</li>
                <li>Technical issues affecting safety</li>
                <li>Suspected underage users</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">Contact Information</h2>
          
          <div className="bg-gray-800 border border-gray-700 p-6 rounded-lg">
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div>
                <p><strong>Community Team:</strong> <a href="mailto:vrfans11@gmail.com" className="text-blue-400 hover:text-blue-300">vrfans11@gmail.com</a></p>
                <p><strong>Safety Concerns:</strong> <a href="mailto:vrfans11@gmail.com" className="text-blue-400 hover:text-blue-300">vrfans11@gmail.com</a></p>
              </div>
              <div>
                <p><strong>General Support:</strong> <a href="mailto:vrfans11@gmail.com" className="text-blue-400 hover:text-blue-300">vrfans11@gmail.com</a></p>
                <p><strong>Legal Questions:</strong> <a href="mailto:vrfans11@gmail.com" className="text-blue-400 hover:text-blue-300">vrfans11@gmail.com</a></p>
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t border-gray-700">
              <p className="text-gray-400">
              </p>
            </div>
          </div>
        </section>
      </div>
    </LegalPolicyPage>
  );
};

export default CommunityGuidelinesPage;
