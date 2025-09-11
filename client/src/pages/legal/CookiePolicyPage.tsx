import React from 'react';
import LegalPolicyPage from '../../components/LegalPolicyPage';

const CookiePolicyPage: React.FC = () => {
  return (
    <LegalPolicyPage title="Cookie Policy" lastUpdated="August 5, 2025">
      <div>
        <p className="text-lg mb-6">
          This Cookie Policy explains how MEDUSAVR uses cookies and similar technologies to provide and improve our services.
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">What Are Cookies?</h2>
          <p className="text-gray-300 mb-4">
            Cookies are small text files stored on your device when you visit websites. They help websites remember your preferences and provide personalized experiences.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">Types of Cookies We Use</h2>
          <div className="space-y-4">
            <div className="bg-gray-800 border border-gray-700 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-green-400 mb-2">Essential Cookies</h3>
              <p className="text-gray-300 text-sm">Required for basic website functionality, login sessions, and security features.</p>
            </div>
            
            <div className="bg-gray-800 border border-gray-700 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-blue-400 mb-2">Performance Cookies</h3>
              <p className="text-gray-300 text-sm">Help us understand how users interact with our website to improve performance.</p>
            </div>

            <div className="bg-gray-800 border border-gray-700 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-purple-400 mb-2">Functional Cookies</h3>
              <p className="text-gray-300 text-sm">Remember your preferences and settings to enhance your experience.</p>
            </div>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">Managing Cookies</h2>
          <p className="text-gray-300 mb-4">
            You can control cookies through your browser settings. However, disabling certain cookies may affect website functionality.
          </p>
          
          <div className="bg-blue-900/20 border border-blue-700 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-blue-400 mb-3">Browser Controls</h3>
            <ul className="list-disc list-inside space-y-1 text-gray-300 text-sm">
              <li>Chrome: Settings → Privacy and Security → Cookies</li>
              <li>Firefox: Settings → Privacy & Security → Cookies and Site Data</li>
              <li>Safari: Preferences → Privacy → Cookies and Website Data</li>
              <li>Edge: Settings → Cookies and Site Permissions</li>
            </ul>
          </div>
        </section>
      </div>
    </LegalPolicyPage>
  );
};

export default CookiePolicyPage;
