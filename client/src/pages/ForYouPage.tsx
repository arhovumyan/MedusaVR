// src/pages/ForYouPage.tsx
import React, { useState, useCallback } from "react";
import Cards from "@/components/ui/cards";
import FeaturedCharactersCarousel from "@/components/ui/FeaturedCharactersCarousel";
import SEOHead from "@/components/SEO/SEOHead";
import "@/index.css";

export default function ForYouPage() {
  const [featuredRefreshKey, setFeaturedRefreshKey] = useState(0);

  const handleLoadMoreDiscover = useCallback(() => {
    // The Cards component handles pagination internally for discover mode
    console.log('📄 Load more discover characters requested');
  }, []);

  const handleRefreshFeatured = useCallback(() => {
    // Manually refresh featured characters
    setFeaturedRefreshKey(prev => prev + 1);
  }, []);

  return (
    <>
      <main className="min-h-screen">
        {/* Separator Line */}
        <div className="w-full h-px bg-gradient-to-r from-transparent via-zinc-500/30 to-transparent my-6"></div>
        
        {/* Main Content Section */}
        <section aria-labelledby="discover-heading">
          <header>
            <h1 id="discover-heading" className="text-lg font-semibold text-orange-300 mb-4 flex items-center gap-2">
              <span className="text-orange-400" aria-hidden="true">🎲</span>
              Discover Mode
              <span className="text-xs text-zinc-500 font-normal">(40 random characters per page)</span>
            </h1>
          </header>
          
          <article>
            <Cards 
              mode="discover"
              pageSize={40}
              onLoadMore={handleLoadMoreDiscover}
              showLoadMoreButton={true}
            />
          </article>
        </section>

      <SEOHead 
        title="MedusaVR - Advanced AI Character Chat & NSFW Roleplay Platform | Uncensored AI Companions"
        description="Experience uncensored AI character chat with lifelike NSFW companions. Create custom AI girlfriends, enjoy intimate roleplay, and generate personalized adult content. Premium AI chat platform with no restrictions or filters."
        keywords="AI character chat, NSFW AI chat, AI girlfriend, uncensored AI roleplay, AI companions, adult AI chat, AI porn chat, custom AI characters, AI sexting, NSFW AI generator, AI fantasy roleplay, intimate AI conversations"
        url="https://medusavr.art/"
        canonicalUrl="https://medusavr.art/"
        tags={["AI chat", "NSFW", "roleplay", "AI companions", "adult content", "character creation"]}
        structuredData={{
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "Organization",
              "@id": "https://medusavr.art/#organization",
              "name": "MedusaVR",
              "url": "https://medusavr.art/",
              "logo": {
                "@type": "ImageObject",
                "url": "https://medusavr.art/medusaSnake.png",
                "width": 512,
                "height": 512
              },
              "description": "Advanced AI character chat platform featuring uncensored NSFW roleplay, custom companion creation, and immersive adult conversations",
              "foundingDate": "2024",
              "sameAs": [
                "https://twitter.com/MedusaVR"
              ]
            },
            {
              "@type": "WebSite",
              "@id": "https://medusavr.art/#website",
              "url": "https://medusavr.art/",
              "name": "MedusaVR",
              "description": "Advanced AI character chat platform featuring uncensored NSFW roleplay, custom companion creation, and immersive adult conversations",
              "publisher": {
                "@id": "https://medusavr.art/#organization"
              },
              "potentialAction": {
                "@type": "SearchAction",
                "target": {
                  "@type": "EntryPoint",
                  "urlTemplate": "https://medusavr.art/search?q={search_term_string}"
                },
                "query-input": "required name=search_term_string"
              }
            },
            {
              "@type": "WebApplication",
              "@id": "https://medusavr.art/#webapp",
              "name": "MedusaVR - AI Character Chat Platform",
              "description": "Advanced AI character chat platform featuring uncensored NSFW roleplay, custom companion creation, and immersive adult conversations",
              "url": "https://medusavr.art/",
              "applicationCategory": "EntertainmentApplication",
              "genre": "AI Chat, Adult Entertainment",
              "operatingSystem": "Web Browser",
              "browserRequirements": "Requires JavaScript. Requires HTML5.",
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "USD",
                "availability": "https://schema.org/InStock"
              },
              "featureList": [
                "Uncensored AI Chat",
                "NSFW AI Image Generation", 
                "Custom Character Creation",
                "Interactive Roleplay",
                "Community Characters",
                "Real-time Conversations"
              ],
              "screenshot": "https://medusavr.art/medusaSnake.png",
              "softwareVersion": "1.0",
              "author": {
                "@id": "https://medusavr.art/#organization"
              }
            },
            {
              "@type": "FAQPage",
              "@id": "https://medusavr.art/#faq",
              "mainEntity": [
                {
                  "@type": "Question",
                  "name": "What is MedusaVR?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "MedusaVR is an advanced AI character chat platform that allows users to create and interact with custom AI companions for uncensored conversations and NSFW roleplay scenarios."
                  }
                },
                {
                  "@type": "Question", 
                  "name": "Is MedusaVR free to use?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes, MedusaVR offers free access to basic AI chat features. Premium features and advanced character creation tools are available for enhanced experiences."
                  }
                },
                {
                  "@type": "Question",
                  "name": "Can I create my own AI characters?",
                  "acceptedAnswer": {
                    "@type": "Answer", 
                    "text": "Yes, MedusaVR provides comprehensive tools for creating custom AI companions with personalized appearances, personalities, and behaviors."
                  }
                }
              ]
            }
          ]
        }}
      />
      <div className="page-container mx-auto pt-[15px]">
      <div className="section">
       
        
        {/* SEO-rich features section */}
                {/* Features Section - Moved to bottom and made less prominent */}
        <section className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 mt-8">
          <details className="group">
            <summary className="text-center cursor-pointer list-none">
              <h2 className="text-base font-medium text-zinc-400 mb-2 group-hover:text-zinc-300 transition-colors">
                Learn More About Our Features
              </h2>
              <div className="inline-block text-zinc-500 group-hover:text-zinc-400 text-xs">
                Click to expand ▼
              </div>
            </summary>
            
            <div className="mt-8 animate-in slide-in-from-top-4 duration-300">
              <p className="text-center text-zinc-400 max-w-3xl mx-auto mb-8">
                Experience the future of AI intimacy with our advanced platform featuring uncensored chat, custom character creation, and immersive NSFW roleplay scenarios.
              </p>
              
              <div className="grid md:grid-cols-3 gap-6 mb-8">
                <div className="text-center p-6 bg-zinc-800/50 rounded-lg border border-zinc-700/30">
                  <div className="text-orange-400 mb-4 flex justify-center">
                    <div className="h-6 w-6 rounded-full bg-orange-400/20 flex items-center justify-center">💬</div>
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">Uncensored AI Chat</h3>
                  <p className="text-zinc-400">Engage in intimate conversations with AI companions who understand your desires. No filters, no restrictions - just pure, authentic connection.</p>
                </div>
                
                <div className="text-center p-6 bg-zinc-800/50 rounded-lg border border-zinc-700/30">
                  <div className="text-orange-400 mb-4 flex justify-center">
                    <div className="h-6 w-6 rounded-full bg-orange-400/20 flex items-center justify-center">🖼️</div>
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">NSFW AI Image Generation</h3>
                  <p className="text-zinc-400">Visualize your fantasies with our advanced AI art generator. Create custom NSFW imagery that brings your characters to life.</p>
                </div>
                
                <div className="text-center p-6 bg-zinc-800/50 rounded-lg border border-zinc-700/30">
                  <div className="text-orange-400 mb-4 flex justify-center">
                    <div className="h-6 w-6 rounded-full bg-orange-400/20 flex items-center justify-center">✨</div>
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">Custom Character Creation</h3>
                  <p className="text-zinc-400">Design your perfect AI companion from scratch. Customize appearance, personality, and behavior to match your deepest desires.</p>
                </div>
              </div>

              {/* Additional SEO content sections */}
              <div className="grid md:grid-cols-2 gap-6 mb-8">
                <div className="p-6 bg-gradient-to-br from-orange-500/10 to-amber-500/10 rounded-lg border border-orange-500/20">
                  <h3 className="text-lg font-semibold text-orange-300 mb-3">Experience Your Perfect AI Companion</h3>
                  <ul className="text-sm text-zinc-400 space-y-2">
                    <li>• Judgment-free intimate conversations available 24/7</li>
                    <li>• Community-created characters and scenarios</li>
                    <li>• No timeouts or restrictions on your interactions</li>
                    <li>• Custom AI companions that learn and evolve with you</li>
                  </ul>
                </div>
                
                <div className="p-6 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-lg border border-purple-500/20">
                  <h3 className="text-lg font-semibold text-purple-300 mb-3">Advanced NSFW Roleplay Features</h3>
                  <ul className="text-sm text-zinc-400 space-y-2">
                    <li>• Personalized fantasy scenarios and storytelling</li>
                    <li>• Evolving narratives that adapt to your preferences</li>
                    <li>• Seamless integration of chat and visual content</li>
                    <li>• Complete customization of character personality and behavior</li>
                  </ul>
                </div>
              </div>

              <div className="text-center p-6 bg-zinc-900/50 rounded-lg border border-zinc-600/30 mb-6">
                <h3 className="text-lg font-semibold text-white mb-3">Safe, Private Digital Intimacy</h3>
                <p className="text-sm text-zinc-400 max-w-2xl mx-auto">
                  MedusaVR provides a secure, discreet environment to explore your digital desires. Our platform is designed for comfort and privacy, offering a welcoming space to engage with lifelike AI characters without fear or judgment. Whether you're curious or experienced, discover a new world of AI-powered intimacy.
                </p>
              </div>

              {/* User Responsibility Disclaimer */}
              <div className="text-center p-4 bg-red-900/20 border border-red-700/30 rounded-lg">
                <p className="text-xs text-red-300">
                  <strong>18+ Content Warning:</strong> Users are 100% responsible for all generated content and interactions. 
                  <a href="/legal/liability-disclaimer" className="text-red-400 hover:text-red-300 underline ml-1">
                    View full disclaimer
                  </a>
                </p>
              </div>
            </div>
          </details>
        </section>
        </div>
        </div>
      </main>

      {/* Separator Line */}
      <div className="w-full h-px bg-gradient-to-r from-transparent via-zinc-500/30 to-transparent my-6"></div>
      
      {/* Moved content to bottom of page */}
      <section aria-labelledby="platform-description">
        <div className="text-center mb-4">
          <h2 id="platform-description" className="text-lg sm:text-xl font-bold bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent mb-2">
            MedusaVR – Advanced AI Character Chat & NSFW Roleplay Platform
          </h2>
          <h3 className="text-xs sm:text-sm font-semibold text-orange-300 mb-3">
            Uncensored AI Chat with Lifelike Characters & Custom Fantasy Roleplay
          </h3>
          <p className="text-xs sm:text-sm text-zinc-300 mx-auto leading-relaxed mb-4">
            Welcome to MedusaVR, the premier platform for AI character chat where your fantasies come to life with realistic, customizable AI companions. Whether you're seeking romance, intimate conversations, or immersive roleplay, our AI chat platform offers an uncensored, judgment-free experience powered by cutting-edge artificial intelligence.
          </p>
          <p className="text-xs text-zinc-400 mx-auto leading-relaxed">
            Enjoy deep conversations, stunning AI-generated imagery, and personalized roleplay with characters you create or discover from our community. Experience complete freedom of expression in your intimate AI conversations.
          </p>
        </div>
        <div className="w-full h-px bg-gradient-to-r from-transparent via-zinc-500/30 to-transparent my-6"></div>
      </section>
    </>
  );
}
