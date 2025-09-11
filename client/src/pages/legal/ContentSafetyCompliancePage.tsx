import React from 'react';
import LegalPolicyPage from '../../components/LegalPolicyPage';

const ContentSafetyCompliancePage: React.FC = () => {
  return (
    <LegalPolicyPage title="Content Safety & Legal Compliance" lastUpdated="August 15, 2025">
      <div>
        <section className="mb-8">
          <div className="bg-red-900/30 border border-red-600 p-6 rounded-lg mb-6">
            <h2 className="text-2xl font-bold text-red-400 mb-4">⚠️ Zero Tolerance Policy</h2>
            <p className="text-gray-200 text-lg">
              MEDUSAVR employs comprehensive technical and human safeguards to prevent illegal content generation and ensure full legal compliance across all jurisdictions.
            </p>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">1. Child Sexual Abuse Material (CSAM) Prevention</h2>
          <div className="bg-red-900/20 border border-red-700 p-6 rounded-lg space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-red-400 mb-3">Comprehensive Detection Systems</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-300">
                <li><strong>AI Content Filtering:</strong> Multi-layer ML models detect any depiction of persons under 18</li>
                <li><strong>Prompt Analysis:</strong> Advanced NLP prevents age-related descriptors (teen, young, school, etc.)</li>
                <li><strong>Visual Analysis:</strong> Computer vision automatically scans all generated content</li>
                <li><strong>Hash Matching:</strong> All content checked against known CSAM databases</li>
                <li><strong>Human Review:</strong> Mandatory human verification for flagged content</li>
              </ul>
            </div>
            
            <div className="bg-red-800/30 border border-red-600 p-4 rounded">
              <h4 className="text-red-300 font-semibold mb-2">Legal Compliance</h4>
              <ul className="list-disc list-inside space-y-1 text-gray-300 text-sm">
                <li>Automatic NCMEC reporting (U.S. legal requirement)</li>
                <li>Immediate account termination and law enforcement notification</li>
                <li>Complete cooperation with international child protection agencies</li>
                <li>Zero tolerance for "virtual," "cartoon," or "AI-generated" exceptions</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">2. Non-Consensual Content Prevention</h2>
          <div className="bg-orange-900/20 border border-orange-700 p-6 rounded-lg space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-orange-400 mb-3">Real Person Protection</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-300">
                <li><strong>Celebrity Detection:</strong> AI models trained to recognize public figures and celebrities</li>
                <li><strong>Facial Recognition:</strong> Advanced biometric analysis prevents deepfakes</li>
                <li><strong>Name Filtering:</strong> Comprehensive databases block real person names in prompts</li>
                <li><strong>Reference Image Analysis:</strong> Upload screening prevents use of real photos</li>
                <li><strong>Consent Verification:</strong> Required documentation for any likeness use</li>
              </ul>
            </div>

            <div className="bg-orange-800/30 border border-orange-600 p-4 rounded">
              <h4 className="text-orange-300 font-semibold mb-2">Legal Protections</h4>
              <ul className="list-disc list-inside space-y-1 text-gray-300 text-sm">
                <li>Immediate takedown procedures for reported violations</li>
                <li>Comprehensive defamation and privacy protection measures</li>
                <li>Proactive monitoring for revenge porn and harassment</li>
                <li>Full cooperation with law enforcement for criminal cases</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">3. Copyright Protection</h2>
          <div className="bg-blue-900/20 border border-blue-700 p-6 rounded-lg space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-blue-400 mb-3">Intellectual Property Safeguards</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-300">
                <li><strong>Character Recognition:</strong> AI detection of copyrighted characters (Disney, Marvel, anime, etc.)</li>
                <li><strong>Trademark Filtering:</strong> Comprehensive database of protected names and brands</li>
                <li><strong>Style Analysis:</strong> Detection of distinctive artistic styles under copyright</li>
                <li><strong>DMCA Compliance:</strong> Rapid response system for takedown notices</li>
                <li><strong>Original Content Promotion:</strong> Incentives for creating original characters</li>
              </ul>
            </div>

            <div className="bg-blue-800/30 border border-blue-600 p-4 rounded">
              <h4 className="text-blue-300 font-semibold mb-2">Rights Management</h4>
              <ul className="list-disc list-inside space-y-1 text-gray-300 text-sm">
                <li>24-hour DMCA response guarantee</li>
                <li>Proactive content scanning and removal</li>
                <li>User education on copyright compliance</li>
                <li>Licensed content partnerships where applicable</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">4. Obscenity & Extreme Content Prevention</h2>
          <div className="bg-purple-900/20 border border-purple-700 p-6 rounded-lg space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-purple-400 mb-3">Content Standards Enforcement</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-300">
                <li><strong>Prohibited Content Blocking:</strong> Bestiality, necrophilia, extreme violence, torture</li>
                <li><strong>Regional Compliance:</strong> Content restrictions based on user location</li>
                <li><strong>Incest Prevention:</strong> Family relationship detection and blocking</li>
                <li><strong>Rape Fantasy Blocking:</strong> Non-consensual scenario prevention</li>
                <li><strong>Violence Limits:</strong> Boundaries on violent and harmful content</li>
              </ul>
            </div>

            <div className="bg-purple-800/30 border border-purple-600 p-4 rounded">
              <h4 className="text-purple-300 font-semibold mb-2">Jurisdictional Compliance</h4>
              <ul className="list-disc list-inside space-y-1 text-gray-300 text-sm">
                <li>Geo-location based content filtering</li>
                <li>Compliance with local obscenity laws</li>
                <li>Cultural sensitivity considerations</li>
                <li>Regular legal review and updates</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">5. Payment Processing Compliance</h2>
          <div className="bg-green-900/20 border border-green-700 p-6 rounded-lg space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-green-400 mb-3">Visa/Mastercard Standards</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-300">
                <li><strong>Content Monitoring:</strong> 24/7 scanning for prohibited content categories</li>
                <li><strong>Chargeback Prevention:</strong> Advanced fraud detection and prevention</li>
                <li><strong>KYC/AML Compliance:</strong> Know Your Customer and Anti-Money Laundering procedures</li>
                <li><strong>Transaction Monitoring:</strong> Real-time analysis of payment patterns</li>
                <li><strong>Risk Assessment:</strong> Continuous evaluation of processing risks</li>
              </ul>
            </div>

            <div className="bg-green-800/30 border border-green-600 p-4 rounded">
              <h4 className="text-green-300 font-semibold mb-2">Financial Protection</h4>
              <ul className="list-disc list-inside space-y-1 text-gray-300 text-sm">
                <li>Maintain chargeback rates well below 1% threshold</li>
                <li>Advanced fraud prevention systems</li>
                <li>Regular processor compliance audits</li>
                <li>Backup payment processing arrangements</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">6. Data Privacy & Regulatory Compliance</h2>
          <div className="bg-gray-800 border border-gray-600 p-6 rounded-lg space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-300 mb-3">Privacy Protection</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-300">
                <li><strong>GDPR Compliance:</strong> Full European data protection compliance</li>
                <li><strong>CCPA Compliance:</strong> California Consumer Privacy Act adherence</li>
                <li><strong>Data Minimization:</strong> Collect only necessary user information</li>
                <li><strong>Encryption:</strong> End-to-end encryption for all sensitive data</li>
                <li><strong>Right to Deletion:</strong> Complete data removal upon request</li>
              </ul>
            </div>

            <div className="bg-gray-700 border border-gray-500 p-4 rounded">
              <h4 className="text-gray-200 font-semibold mb-2">Regulatory Reporting</h4>
              <ul className="list-disc list-inside space-y-1 text-gray-300 text-sm">
                <li>Mandatory NCMEC reporting for CSAM discoveries</li>
                <li>Law enforcement cooperation protocols</li>
                <li>Regular compliance audits and assessments</li>
                <li>Transparent reporting to regulatory bodies</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">7. Technical Infrastructure Protection</h2>
          <div className="bg-yellow-900/20 border border-yellow-700 p-6 rounded-lg space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-yellow-400 mb-3">Platform Security</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-300">
                <li><strong>Hosting Compliance:</strong> Adult-content friendly hosting providers</li>
                <li><strong>CDN Protection:</strong> Content delivery networks that permit legal adult content</li>
                <li><strong>Backup Systems:</strong> Multiple redundant hosting and storage solutions</li>
                <li><strong>Content Moderation API:</strong> Real-time content scanning and filtering</li>
                <li><strong>User Behavior Analysis:</strong> Advanced patterns detection for abuse prevention</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">8. Enforcement & Response Procedures</h2>
          <div className="bg-red-900/20 border border-red-700 p-6 rounded-lg space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-red-400 mb-3">Immediate Response Protocol</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-300">
                <li><strong>Instant Termination:</strong> Immediate account suspension for illegal content</li>
                <li><strong>Content Removal:</strong> Automated and manual content deletion systems</li>
                <li><strong>Law Enforcement:</strong> Immediate cooperation with legal authorities</li>
                <li><strong>User Reporting:</strong> 24/7 abuse reporting and response system</li>
                <li><strong>Appeals Process:</strong> Fair review process for legitimate disputes</li>
              </ul>
            </div>

            <div className="bg-red-800/30 border border-red-600 p-4 rounded">
              <h4 className="text-red-300 font-semibold mb-2">Legal Coordination</h4>
              <ul className="list-disc list-inside space-y-1 text-gray-300 text-sm">
                <li>Dedicated legal team for compliance oversight</li>
                <li>External legal counsel specializing in adult content law</li>
                <li>Regular policy updates based on legal developments</li>
                <li>Proactive engagement with regulatory bodies</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">9. User Education & Prevention</h2>
          <div className="bg-blue-900/20 border border-blue-700 p-6 rounded-lg">
            <ul className="list-disc list-inside space-y-2 text-gray-300">
              <li><strong>Clear Guidelines:</strong> Comprehensive user education on acceptable content</li>
              <li><strong>Prompt Suggestions:</strong> AI-guided suggestions that steer toward compliant content</li>
              <li><strong>Warning Systems:</strong> Real-time alerts when approaching prohibited content</li>
              <li><strong>Best Practices:</strong> Education on copyright, consent, and legal compliance</li>
              <li><strong>Community Reporting:</strong> Empowering users to report violations</li>
            </ul>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">10. Continuous Monitoring & Improvement</h2>
          <div className="bg-gray-800 border border-gray-600 p-6 rounded-lg">
            <div className="space-y-3">
              <p className="text-gray-300">
                <strong>Regular Audits:</strong> Monthly compliance reviews and system testing
              </p>
              <p className="text-gray-300">
                <strong>AI Model Updates:</strong> Continuous improvement of detection algorithms
              </p>
              <p className="text-gray-300">
                <strong>Legal Review:</strong> Quarterly legal compliance assessments
              </p>
              <p className="text-gray-300">
                <strong>Industry Collaboration:</strong> Partnership with safety organizations and industry groups
              </p>
            </div>
          </div>
        </section>

        <section className="mb-8">
          <div className="bg-green-900/20 border border-green-700 p-6 rounded-lg">
            <h2 className="text-2xl font-bold text-green-400 mb-4">Contact for Safety Concerns</h2>
            <div className="space-y-2 text-gray-300">
              <p><strong>Emergency Safety Issues:</strong> <a href="mailto:vrfans11@gmail.com" className="text-green-400 hover:text-green-300">vrfans11@gmail.com</a></p>
              <p><strong>Legal Compliance:</strong> <a href="mailto:vrfans11@gmail.com" className="text-blue-400 hover:text-blue-300">vrfans11@gmail.com</a></p>
              <p><strong>DMCA Takedowns:</strong> <a href="mailto:vrfans11@gmail.com" className="text-blue-400 hover:text-blue-300">vrfans11@gmail.com</a></p>
              <p><strong>24/7 Abuse Reporting:</strong> Built-in platform reporting tools</p>
            </div>
          </div>
        </section>
      </div>
    </LegalPolicyPage>
  );
};

export default ContentSafetyCompliancePage;
