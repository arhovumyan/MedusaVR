import React from 'react';
import { Link } from 'wouter';

interface LegalPolicyPageProps {
  title: string;
  lastUpdated: string;
  children: React.ReactNode;
}

const LegalPolicyPage: React.FC<LegalPolicyPageProps> = ({ title, lastUpdated, children }) => {
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Navigation */}
        <div className="mb-8">
          <Link href="/legal">
            <span className="text-blue-400 hover:text-blue-300 cursor-pointer flex items-center">
              ← Back to Legal Center
            </span>
          </Link>
        </div>

        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
            {title}
          </h1>
          <div className="text-gray-400 text-sm">
            Last updated: {lastUpdated}
          </div>
        </div>

        {/* Content */}
        <div className="prose prose-invert prose-blue max-w-none">
          <div className="text-gray-300 leading-relaxed space-y-6">
            {children}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-16 pt-8 border-t border-gray-800 text-center">
          <p className="text-gray-400 text-sm">
            For questions about this policy, please contact us at{' '}
            <a href="mailto:vrfans11@gmail.com" className="text-blue-400 hover:text-blue-300">
              vrfans11@gmail.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LegalPolicyPage;
