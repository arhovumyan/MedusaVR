import React from 'react';
import LegalPolicyPage from '../../components/LegalPolicyPage';

const ContentPolicyPage: React.FC = () => {
  return (
    <LegalPolicyPage title="Content Policy" lastUpdated="August 5, 2025">
      <div>
        <p className="text-lg mb-6">
          This Content Policy outlines what content is acceptable on MEDUSAVR and our enforcement procedures.
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">Acceptable Content</h2>
          <div className="bg-green-900/20 border border-green-700 p-6 rounded-lg">
            <p className="text-gray-300 mb-3">
              MEDUSAVR supports diverse content creation including mature themes for adult users. We welcome:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-300">
              <li>NSFW AI character interactions and adult content (18+ verified users only)</li>
              <li>Adult AI chat conversations with mature themes</li>
              <li>NSFW image generation with AI characters</li>
              <li>Fictional adult character interactions and relationships</li>
              <li>Consensual romantic and sexual scenarios in AI interactions</li>
              <li>Creative storytelling and mature interactive content</li>
              <li>Artistic character designs including adult-oriented customizations</li>
              <li>Educational content about adult relationships and intimacy</li>
              <li>Custom AI companion creation for mature audiences</li>
            </ul>
            <div className="mt-4 p-3 bg-orange-900/20 border border-orange-700 rounded">
              <p className="text-orange-200 text-sm">
                <strong>Age Verification Required:</strong> All NSFW content and adult features require verified 18+ age status. Users must complete age verification to access mature content areas.
              </p>
            </div>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">Prohibited Content</h2>
          <div className="bg-red-900/20 border border-red-700 p-6 rounded-lg">
            <ul className="list-disc list-inside space-y-2 text-gray-300">
              <li>Any content involving minors or underage characters</li>
              <li>Non-consensual sexual activities or violence</li>
              <li>Real person impersonation without consent</li>
              <li>Illegal activities or harmful content</li>
              <li>Hate speech, harassment, or discrimination</li>
              <li>Content promoting self-harm or dangerous activities</li>
              <li>Spam, malware, or malicious content</li>
            </ul>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">Content Moderation</h2>
          <div className="space-y-4">
            <div className="bg-gray-800 border border-gray-700 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-blue-400 mb-2">Automated Systems</h3>
              <p className="text-gray-300 text-sm">
                We use advanced AI and machine learning systems to detect and remove prohibited content automatically.
              </p>
            </div>
            
            <div className="bg-gray-800 border border-gray-700 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-blue-400 mb-2">Human Review</h3>
              <p className="text-gray-300 text-sm">
                Our trained moderation team reviews reported content and edge cases to ensure accuracy.
              </p>
            </div>

            <div className="bg-gray-800 border border-gray-700 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-blue-400 mb-2">User Reporting</h3>
              <p className="text-gray-300 text-sm">
                Community members can report content that violates our policies through built-in reporting tools.
              </p>
            </div>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">Enforcement Actions</h2>
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <span className="text-yellow-400 text-lg">⚠️</span>
              <span className="text-gray-300"><strong>Warning:</strong> First-time minor violations</span>
            </div>
            <div className="flex items-center space-x-3">
              <span className="text-orange-400 text-lg">🔒</span>
              <span className="text-gray-300"><strong>Content Removal:</strong> Violating content deleted</span>
            </div>
            <div className="flex items-center space-x-3">
              <span className="text-red-400 text-lg">⏸️</span>
              <span className="text-gray-300"><strong>Temporary Suspension:</strong> Account restricted temporarily</span>
            </div>
            <div className="flex items-center space-x-3">
              <span className="text-red-600 text-lg">🚫</span>
              <span className="text-gray-300"><strong>Permanent Ban:</strong> Severe or repeated violations</span>
            </div>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">Appeal Process</h2>
          <p className="text-gray-300 mb-4">
            If you believe content was removed or action was taken in error:
          </p>
          <ol className="list-decimal list-inside space-y-2 text-gray-300">
            <li>Submit an appeal through our support system</li>
            <li>Provide detailed explanation of why the action was incorrect</li>
            <li>Include any relevant evidence or context</li>
            <li>Wait for review by our appeals team (typically 3-5 business days)</li>
          </ol>
        </section>
      </div>
    </LegalPolicyPage>
  );
};

export default ContentPolicyPage;
