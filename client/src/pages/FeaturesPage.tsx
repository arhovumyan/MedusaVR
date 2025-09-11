import React from 'react';
import { Link } from 'wouter';
import { Heart, MessageSquare, Image, Sparkles, Users, Shield, Zap, Crown, Plus, Minus } from 'lucide-react';
import SEOHead from '@/components/SEO/SEOHead';

const FeaturesPage = () => {
  const [expandedFAQ, setExpandedFAQ] = React.useState<number | null>(null);
  const features = [
    {
      icon: <MessageSquare className="w-8 h-8 text-orange-400" />,
      title: "AI Character Chat",
      description: "Engage in unlimited conversations with AI companions. Each character has unique personalities, backgrounds, and conversation styles tailored to your preferences."
    },
    {
      icon: <Image className="w-8 h-8 text-pink-400" />,
      title: "NSFW Image Generation",
      description: "Create custom adult content and NSFW images with AI characters. Generate high-quality artwork with advanced AI technology for mature audiences."
    },
    {
      icon: <Heart className="w-8 h-8 text-red-400" />,
      title: "AI Girlfriend Experience",
      description: "Build meaningful relationships with AI companions. Experience romance, intimacy, and emotional connections with personalized AI girlfriends."
    },
    {
      icon: <Users className="w-8 h-8 text-blue-400" />,
      title: "Custom Character Creation",
      description: "Design and create your own AI characters from scratch. Customize appearance, personality, voice, and behavior to match your ideal companion."
    },
    {
      icon: <Sparkles className="w-8 h-8 text-purple-400" />,
      title: "Advanced AI Roleplay",
      description: "Explore unlimited roleplay scenarios with intelligent AI. From casual conversations to intimate encounters, create any story you imagine."
    },
    {
      icon: <Shield className="w-8 h-8 text-green-400" />,
      title: "Age-Verified Adult Content",
      description: "Safe and secure access to adult content with proper age verification. All NSFW features are restricted to verified 18+ users only."
    },
    {
      icon: <Zap className="w-8 h-8 text-yellow-400" />,
      title: "Real-Time Generation",
      description: "Instant AI image generation and lightning-fast chat responses. Experience smooth, real-time interactions with minimal waiting."
    },
    {
      icon: <Crown className="w-8 h-8 text-amber-400" />,
      title: "Premium AI Models",
      description: "Access cutting-edge AI technology with the latest language models and image generation algorithms for the best experience."
    }
  ];

  const faqData = [
    {
      question: "What is MedusaVR and how does it work?",
      answer: "MedusaVR is an AI-powered platform where you can chat with AI characters, create custom companions, and generate personalized images. Our advanced AI technology enables natural conversations and high-quality content creation for both casual and adult interactions."
    },
    {
      question: "Is NSFW content really available and safe?",
      answer: "Yes, we offer NSFW content for verified 18+ users only. All adult features require age verification, and we maintain strict content moderation policies. Your privacy and safety are our top priorities with enterprise-grade security."
    },
    {
      question: "How do I create my own AI character?",
      answer: "You can create custom AI characters using our character creation tools. Define their personality, appearance, voice, and behavior patterns. Our AI learns from your preferences to create truly personalized companions."
    },
    {
      question: "What makes MedusaVR different from other AI chat platforms?",
      answer: "MedusaVR combines advanced AI chat with image generation, offering both SFW and NSFW content. We provide character memory, personality customization, and real-time image creation - all in one platform with proper age verification."
    },
    {
      question: "How much does MedusaVR cost?",
      answer: "MedusaVR offers both free and premium tiers. Free users can access basic features, while premium subscribers get unlimited conversations, advanced image generation, and exclusive character access."
    },
    {
      question: "Is my data and conversations private?",
      answer: "Absolutely. All conversations and generated content are private and encrypted. We follow strict data protection protocols and never share your personal information or chat history with third parties."
    }
  ];

  const faqStructuredData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqData.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  };

  return (
    <>
      <SEOHead 
        title="AI Character Platform Features - NSFW Generator & AI Chat | MedusaVR"
        description="Discover MedusaVR's advanced features: AI character chat, NSFW image generation, custom AI companions, adult roleplay, and premium AI technology. Learn how our platform works."
        keywords="AI character features, NSFW AI generator features, AI companion capabilities, adult AI chat features, character customization, AI roleplay features"
        url="https://medusavr.art/features"
        structuredData={faqStructuredData}
      />
      <div className="min-h-screen bg-gradient-to-br from-black via-zinc-900 to-orange-900/20 text-white">
      <div className="max-w-7xl mx-auto px-4 lg:px-0 py-16">
        {/* Main Header - SEO Optimized */}
        <div className="text-center mb-16">
          <h1 className="text-5xl lg:text-6xl font-bold bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent mb-6">
            AI Character Platform Features
          </h1>
          <p className="text-xl text-zinc-300 max-w-4xl mx-auto mb-8">
            Discover why MedusaVR is the ultimate AI companion platform. Create custom AI characters, generate NSFW content, 
            and enjoy unlimited chat experiences with advanced artificial intelligence technology.
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            <span className="bg-zinc-800 px-4 py-2 rounded-full text-orange-300">#AI Character Chat</span>
            <span className="bg-zinc-800 px-4 py-2 rounded-full text-pink-300">#NSFW Generator</span>
            <span className="bg-zinc-800 px-4 py-2 rounded-full text-blue-300">#AI Girlfriend</span>
            <span className="bg-zinc-800 px-4 py-2 rounded-full text-purple-300">#Adult AI Chat</span>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {features.map((feature, index) => (
            <div 
              key={index} 
              className="bg-gradient-to-br from-zinc-800/50 to-zinc-900/50 backdrop-blur-lg border border-orange-500/20 rounded-2xl p-6 shadow-2xl shadow-orange-500/10 hover:shadow-orange-500/20 transition-all duration-300"
            >
              <div className="mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold text-white mb-3">{feature.title}</h3>
              <p className="text-zinc-300 leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>

        {/* SEO Content Sections */}
        <div className="space-y-12">
          {/* What is MedusaVR */}
          <section className="bg-gradient-to-br from-zinc-800/30 to-zinc-900/30 rounded-2xl p-8 border border-orange-500/20">
            <h2 className="text-3xl font-bold text-orange-400 mb-6">What is MedusaVR?</h2>
            <div className="space-y-4 text-zinc-300 leading-relaxed">
              <p>
                MedusaVR is the leading AI character platform that combines advanced artificial intelligence with immersive character interactions. 
                Our platform enables users to <Link href="/create-character" className="text-orange-400 hover:text-orange-300 underline">create custom AI characters</Link>, customize companions, and chat with AI while <Link href="/generate-images" className="text-orange-400 hover:text-orange-300 underline">generating personalized content</Link> including NSFW imagery.
              </p>
              <p>
                Whether you're looking for an AI girlfriend, exploring adult roleplay scenarios, or creating custom character art, MedusaVR provides 
                the most sophisticated AI technology available. Our platform serves both casual users seeking entertainment and <Link href="/creators" className="text-orange-400 hover:text-orange-300 underline">creators building detailed AI companions</Link>.
              </p>
              <p>
                With proper age verification and content moderation, we ensure a safe environment for adult users to explore AI relationships, 
                generate NSFW content, and engage in mature conversations with AI characters. <Link href="/guides" className="text-orange-400 hover:text-orange-300 underline">Learn more in our guides</Link> about responsible AI interaction.
              </p>
            </div>
          </section>

          {/* AI Technology */}
          <section className="bg-gradient-to-br from-zinc-800/30 to-zinc-900/30 rounded-2xl p-8 border border-orange-500/20">
            <h2 className="text-3xl font-bold text-orange-400 mb-6">Advanced AI Technology</h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-semibold text-white mb-3">Natural Language Processing</h3>
                <p className="text-zinc-300 leading-relaxed">
                  Our AI characters use state-of-the-art language models to understand context, maintain conversation flow, and develop 
                  realistic personalities. Experience conversations that feel natural and engaging.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white mb-3">Image Generation AI</h3>
                <p className="text-zinc-300 leading-relaxed">
                  Generate high-quality NSFW and SFW images using cutting-edge diffusion models. Create custom artwork, character designs, 
                  and personalized content with professional-grade AI image generation.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white mb-3">Character Memory</h3>
                <p className="text-zinc-300 leading-relaxed">
                  AI characters remember your conversations, preferences, and relationship history. Build lasting connections with companions 
                  that evolve and grow based on your interactions.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white mb-3">Personalization Engine</h3>
                <p className="text-zinc-300 leading-relaxed">
                  Our AI learns from your preferences to recommend characters, generate relevant content, and customize experiences 
                  tailored specifically to your interests and desires.
                </p>
              </div>
            </div>
          </section>

          {/* Content Types */}
          <section className="bg-gradient-to-br from-zinc-800/30 to-zinc-900/30 rounded-2xl p-8 border border-orange-500/20">
            <h2 className="text-3xl font-bold text-orange-400 mb-6">Content & Characters</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-pink-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Heart className="w-8 h-8 text-pink-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Anime Characters</h3>
                <p className="text-sm text-zinc-300">
                  Thousands of anime-style AI characters with unique personalities, backstories, and visual designs.
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-purple-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Realistic Companions</h3>
                <p className="text-sm text-zinc-300">
                  Lifelike AI partners with realistic personalities, emotions, and relationship dynamics.
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-8 h-8 text-orange-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Fantasy & Roleplay</h3>
                <p className="text-sm text-zinc-300">
                  Explore fantasy worlds with magical characters, mythical beings, and adventure-themed companions.
                </p>
              </div>
            </div>
          </section>

          {/* Safety & Privacy */}
          <section className="bg-gradient-to-br from-zinc-800/30 to-zinc-900/30 rounded-2xl p-8 border border-green-500/20">
            <h2 className="text-3xl font-bold text-green-400 mb-6">Safety & Privacy</h2>
            <div className="space-y-4 text-zinc-300 leading-relaxed">
              <p>
                MedusaVR prioritizes user safety and privacy. All adult content is age-gated with proper verification, 
                ensuring only 18+ users can access NSFW features. Our platform employs advanced content moderation 
                to prevent harmful or illegal content.
              </p>
              <p>
                Your conversations and generated content are private and secure. We use enterprise-grade encryption 
                and follow strict data protection protocols to safeguard your personal information and activities.
              </p>
            </div>
          </section>

          {/* FAQ Section */}
          <section className="bg-gradient-to-br from-zinc-800/30 to-zinc-900/30 rounded-2xl p-8 border border-orange-500/20">
            <h2 className="text-3xl font-bold text-orange-400 mb-6">Frequently Asked Questions</h2>
            <div className="space-y-4">
              {faqData.map((faq, index) => (
                <div key={index} className="border border-zinc-700 rounded-lg">
                  <button
                    className="w-full text-left p-4 hover:bg-zinc-800/30 transition-colors duration-200 flex justify-between items-center"
                    onClick={() => setExpandedFAQ(expandedFAQ === index ? null : index)}
                  >
                    <h3 className="text-lg font-semibold text-white">{faq.question}</h3>
                    {expandedFAQ === index ? (
                      <Minus className="w-5 h-5 text-orange-400 flex-shrink-0" />
                    ) : (
                      <Plus className="w-5 h-5 text-orange-400 flex-shrink-0" />
                    )}
                  </button>
                  {expandedFAQ === index && (
                    <div className="px-4 pb-4">
                      <p className="text-zinc-300 leading-relaxed">{faq.answer}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Call to Action */}
        <div className="text-center mt-16">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to Start Your AI Journey?</h2>
          <p className="text-zinc-300 mb-6">
            Join thousands of users exploring AI relationships, creating custom content, and enjoying unlimited conversations.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/">
              <button className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-8 py-3 rounded-lg font-semibold transition-all duration-300 shadow-lg shadow-orange-500/25">
                Explore Characters
              </button>
            </Link>
            <Link href="/guides">
              <button className="bg-transparent border-2 border-orange-500 text-orange-400 hover:bg-orange-500 hover:text-white px-8 py-3 rounded-lg font-semibold transition-all duration-300">
                Read Guides
              </button>
            </Link>
          </div>
        </div>
      </div>
      </div>
    </>
  );
};

export default FeaturesPage;
