import React from 'react';
import { Link } from 'wouter';

interface LegalCardProps {
  title: string;
  description: string;
  route: string;
  icon: string;
}

const LegalCard: React.FC<LegalCardProps> = ({ title, description, route, icon }) => (
  <Link href={route}>
    <div className="bg-gray-800 hover:bg-gray-700 transition-colors duration-200 p-6 rounded-lg border border-gray-700 cursor-pointer group">
      <div className="flex items-center mb-4">
        <span className="text-2xl mr-3">{icon}</span>
        <h3 className="text-xl font-semibold text-white group-hover:text-blue-400 transition-colors duration-200">
          {title}
        </h3>
      </div>
      <p className="text-gray-300 text-sm leading-relaxed">
        {description}
      </p>
    </div>
  </Link>
);

const LegalPage: React.FC = () => {
  const legalPolicies = [
    {
      title: "Community Guidelines",
      description: "Guidelines for maintaining a respectful and safe community environment for all users.",
      route: "/legal/community-guidelines",
      icon: "👥"
    },
    {
      title: "Privacy Policy",
      description: "How we collect, use, and protect your personal information and data privacy.",
      route: "/legal/privacy-policy",
      icon: "🔒"
    },
    {
      title: "Terms of Service",
      description: "The legal terms and conditions governing your use of MEDUSAVR services.",
      route: "/legal/terms-of-service",
      icon: "📋"
    },
    {
      title: "Content Policy",
      description: "Guidelines and restrictions regarding user-generated content on our platform.",
      route: "/legal/content-policy",
      icon: "📝"
    },
    {
      title: "Blocked Content Policy",
      description: "Policies regarding prohibited content and enforcement actions.",
      route: "/legal/blocked-content-policy",
      icon: "🚫"
    },
    {
      title: "Cookie Policy",
      description: "Information about how we use cookies and similar tracking technologies.",
      route: "/legal/cookie-policy",
      icon: "🍪"
    },
    {
      title: "DMCA Notice",
      description: "Digital Millennium Copyright Act compliance and takedown procedures.",
      route: "/legal/dmca-notice",
      icon: "⚖️"
    },
    {
      title: "2257 Exemption Statement",
      description: "Legal compliance statement regarding content regulations and exemptions.",
      route: "/legal/2257-exemption-statement",
      icon: "📄"
    },
    {
      title: "Content Provider Compliance",
      description: "Comprehensive compliance requirements for content providers and merchant standards.",
      route: "/legal/content-provider-compliance",
      icon: "📋"
    },
    {
      title: "Content Safety & Legal Compliance",
      description: "Technical safeguards and prevention systems for illegal content and legal risks.",
      route: "/legal/content-safety-compliance",
      icon: "🛡️"
    },
    {
      title: "Liability Disclaimer & User Responsibility",
      description: "Complete user responsibility and liability protection for MedusaVR.",
      route: "/legal/liability-disclaimer",
      icon: "⚖️"
    }
  ];

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
            Legal & Policy Center
          </h1>
          <p className="text-gray-300 text-lg max-w-3xl mx-auto">
            Welcome to MEDUSAVR's comprehensive legal and policy documentation. 
            Here you'll find all the important information about our terms, policies, and guidelines.
          </p>
        </div>

        {/* Legal Policies Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {legalPolicies.map((policy, index) => (
            <LegalCard
              key={index}
              title={policy.title}
              description={policy.description}
              route={policy.route}
              icon={policy.icon}
            />
          ))}
        </div>

        {/* Footer */}
        <div className="mt-16 pt-8 border-t border-gray-800 text-center">
          <p className="text-gray-400 text-sm">
            These policies are effective as of the date of publication. 
            For questions about our legal policies, please contact us at{' '}
            <a href="mailto:vrfans11@gmail.com" className="text-blue-400 hover:text-blue-300">
              vrfans11@gmail.com
            </a>
          </p>
          <p className="text-gray-500 text-xs mt-2">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </div>
      </div>
    </div>
  );
};

export default LegalPage;
