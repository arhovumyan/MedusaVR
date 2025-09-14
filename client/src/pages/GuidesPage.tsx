import React from "react";
import { Link, useRoute } from "wouter";
import SEOHead from "@/components/SEO/SEOHead";
import Breadcrumb from "@/components/SEO/Breadcrumb";
import { Badge } from "@/components/ui/badge";
import { Clock, User, Calendar, ArrowRight } from "lucide-react";

// Sample blog posts for SEO and content strategy
const blogPosts = [
  {
    id: 1,
    title: "Complete Guide to AI Character Creation",
    slug: "complete-guide-ai-character-creation",
    excerpt: "Learn how to create compelling AI characters with detailed personalities, backstories, and engaging conversation styles. Master the art of character development.",
    content: `Creating compelling AI characters requires more than just writing a few personality traits. This comprehensive guide will walk you through the essential steps to develop characters that feel real, engaging, and memorable.

## Understanding Character Fundamentals

The foundation of any great AI character lies in their core personality traits, motivations, and background. Start by defining:

- **Core personality**: What drives your character? Are they optimistic, cynical, adventurous, or cautious?
- **Background story**: Where did they come from? What experiences shaped them?
- **Speech patterns**: How do they communicate? Formal or casual? Witty or serious?
- **Relationships**: How do they interact with others? Are they social or reserved?

## Building Authentic Personalities

Authentic characters have depth and complexity. Consider these elements:

### Contradictions Make Characters Real
Real people aren't perfectly consistent, and neither should your AI characters be. A tough exterior might hide vulnerability, or a shy character might be bold in their area of expertise.

### Motivations and Goals
What does your character want? This could be simple (making friends) or complex (seeking redemption for past mistakes). Goals drive conversations and interactions.

### Flaws and Strengths
Perfect characters are boring. Give your characters both strengths they're proud of and flaws they struggle with.

## Technical Implementation Tips

When setting up your character in MedusaVR:

1. **Use specific, concrete details** rather than vague descriptions
2. **Include conversation examples** to guide the AI's responses
3. **Define boundaries** - what topics will they engage with or avoid?
4. **Test thoroughly** with different conversation starters

## Common Mistakes to Avoid

- Making characters too perfect or too flawed
- Overloading with backstory that doesn't affect conversations
- Creating characters without clear motivations
- Ignoring how the character would actually speak

Remember, great AI characters feel like real people with their own thoughts, feelings, and perspectives. Take time to develop them thoughtfully, and your audience will connect with them on a deeper level.`,
    author: "MedusaVR Team",
    publishedAt: "2024-01-15",
    readTime: "8 min read",
    category: "Character Creation",
    tags: ["AI Characters", "Character Development", "Tutorial", "Best Practices"],
    featured: true
  },
  {
    id: 2,
    title: "Advanced Prompting Techniques for Better AI Conversations",
    slug: "advanced-prompting-techniques-ai-conversations",
    excerpt: "Discover professional prompting strategies to create more natural, engaging, and contextually aware AI conversations. Level up your chat experience.",
    content: `Effective prompting is the key to unlocking the full potential of AI conversations. Whether you're chatting with existing characters or creating your own, understanding how to communicate with AI will dramatically improve your experience.

## The Psychology of AI Communication

AI models respond best to clear, specific, and contextual prompts. Think of prompting as giving directions - the more specific and clear you are, the better the results.

### Context Setting
Before diving into conversation, establish context:
- Where are we? (setting)
- What's happening? (situation)
- What's the mood? (tone)

### Example Context Setting:
"We're sitting in a cozy coffee shop on a rainy afternoon. You seem thoughtful today, perhaps reflecting on recent changes in your life."

## Advanced Techniques

### 1. Layered Prompting
Build complexity gradually rather than dumping everything at once:

**Weak**: "Let's roleplay a complex scenario where you're a detective investigating a murder in Victorian London with supernatural elements and political intrigue."

**Strong**: Start with "You're a detective in Victorian London" then gradually introduce elements as the conversation develops.

### 2. Emotional Priming
Set the emotional tone before content:
- "You're feeling nostalgic about..."
- "You're excited to share..."
- "You're carefully considering..."

### 3. Perspective Prompting
Guide the AI's viewpoint:
- "From your character's perspective..."
- "Considering your past experiences..."
- "Given your personality..."

## Troubleshooting Common Issues

**Generic Responses**: Add more specific context and personality details
**Breaking Character**: Remind the AI of their role and motivations
**Repetitive Patterns**: Introduce new elements or change the conversational direction

## Best Practices for Different Scenarios

### Casual Conversations
- Keep prompts natural and conversational
- Allow for organic flow
- Don't over-direct every response

### Roleplay Scenarios  
- Establish clear scene and character motivations
- Use present tense for immediacy
- Build tension and stakes gradually

### Creative Collaborations
- Define roles clearly (you write X, AI writes Y)
- Set boundaries and expectations
- Encourage creativity while maintaining consistency

The key to great AI conversations is practice and experimentation. Try different approaches, see what works best for your style, and don't be afraid to be creative with your prompts.`,
    author: "Dr. Sarah Chen",
    publishedAt: "2024-01-10",
    readTime: "6 min read",
    category: "AI Communication",
    tags: ["Prompting", "AI Chat", "Communication", "Tips"],
    featured: true
  },
  {
    id: 3,
    title: "NSFW AI Content: Ethics, Safety, and Best Practices",
    slug: "nsfw-ai-content-ethics-safety-best-practices",
    excerpt: "A comprehensive guide to responsible NSFW AI content creation, covering ethical considerations, safety measures, and community guidelines.",
    content: `As AI technology becomes more sophisticated, discussions about NSFW AI content become increasingly important. This guide covers ethical considerations, safety measures, and best practices for responsible engagement.

## Understanding the Landscape

NSFW AI content exists within a complex framework of legal, ethical, and technological considerations. It's essential to approach this topic with maturity and awareness.

### Legal Considerations
- Age verification and consent
- Compliance with local laws and regulations
- Platform terms of service
- Content distribution restrictions

### Ethical Framework
- Consent and agency in AI representations
- Impact on real human relationships
- Responsibility in content creation
- Respect for community standards

## Safety Measures

### For Creators
1. **Clear Content Labeling**: Always mark NSFW content appropriately
2. **Age Restrictions**: Ensure content is only accessible to adults
3. **Consent Mechanisms**: Build in clear opt-in systems
4. **Boundary Respect**: Respect user limits and preferences

### For Users
1. **Understand Your Motivations**: Be honest about why you're engaging
2. **Set Personal Boundaries**: Know your limits and stick to them
3. **Maintain Real-World Connections**: Don't substitute AI for human relationships
4. **Practice Digital Wellness**: Monitor your usage patterns

## Best Practices for Platforms

### Content Moderation
- Automated screening systems
- Human review processes
- User reporting mechanisms
- Regular policy updates

### User Protection
- Robust age verification
- Privacy protection measures
- Clear content warnings
- Easy content filtering

## The Future of NSFW AI

As technology evolves, so do the ethical considerations. Key areas of ongoing development include:

- Improved safety measures
- Better content filtering
- Enhanced user control
- Stronger privacy protections

## Community Guidelines

Responsible engagement means:
- Respecting other users' boundaries
- Following platform rules
- Reporting inappropriate content
- Engaging constructively in discussions

The goal is to create spaces where adult users can explore AI interactions safely and responsibly while maintaining ethical standards and respecting all community members.`,
    author: "Ethics Committee",
    publishedAt: "2024-01-05",
    readTime: "10 min read",
    category: "Ethics & Safety",
    tags: ["NSFW", "Ethics", "Safety", "Guidelines"],
    featured: false
  }
];

export default function GuidesPage() {
  const breadcrumbItems = [
    { name: 'Home', href: '/' },
    { name: 'Guides & Blog', href: '/guides' }
  ];

  const featuredPosts = blogPosts.filter(post => post.featured);
  const regularPosts = blogPosts.filter(post => !post.featured);

  const guidesSchema = {
    "@context": "https://schema.org",
    "@type": "Blog",
    "name": "MedusaVR Guides & Blog",
    "description": "Expert guides, tutorials, and insights for AI character creation, conversations, and digital companionship.",
    "url": "https://medusa-vrfriendly.vercel.app/guides",
    "author": {
      "@type": "Organization",
      "name": "MedusaVR"
    },
    "blogPost": blogPosts.map(post => ({
      "@type": "BlogPosting",
      "headline": post.title,
      "description": post.excerpt,
      "url": `https://medusa-vrfriendly.vercel.app/guides/${post.slug}`,
      "datePublished": post.publishedAt,
      "author": {
        "@type": "Person",
        "name": post.author
      },
      "keywords": post.tags.join(', ')
    }))
  };

  return (
    <>
      <SEOHead
        title="AI Character Guides & Blog | MedusaVR"
        description="Expert guides on AI character creation, conversation techniques, and digital companionship. Learn from tutorials, tips, and best practices for better AI interactions."
        keywords="AI character guides, AI chat tutorials, character creation tips, AI conversation guide, digital companions, AI roleplay guide, NSFW AI safety"
        structuredData={guidesSchema}
        type="website"
      />
      
      <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-800 to-orange-900/20 text-white">
        <Breadcrumb items={breadcrumbItems} />
        
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl sm:text-5xl font-bold mb-4 bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">
              Guides & Blog
            </h1>
            <p className="text-xl text-zinc-300 max-w-3xl mx-auto">
              Master the art of AI character creation and conversation with expert guides, tutorials, and insights from the MedusaVR community.
            </p>
          </div>

          {/* Featured Posts */}
          {featuredPosts.length > 0 && (
            <section className="mb-16">
              <h2 className="text-2xl font-bold mb-8 text-center">Featured Guides</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {featuredPosts.map((post) => (
                  <Link
                    key={post.id}
                    href={`/guides/${post.slug}`}
                    className="group block"
                  >
                    <article className="bg-zinc-900/50 rounded-xl border border-zinc-800/50 hover:border-orange-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-orange-500/10 overflow-hidden h-full">
                      <div className="p-6 sm:p-8 h-full flex flex-col">
                        <div className="flex items-center gap-3 mb-4">
                          <Badge variant="secondary" className="bg-orange-600/20 text-orange-400 border-orange-500/30">
                            Featured
                          </Badge>
                          <Badge variant="outline" className="text-zinc-400 border-zinc-700">
                            {post.category}
                          </Badge>
                        </div>
                        
                        <h3 className="text-2xl font-bold mb-3 group-hover:text-orange-400 transition-colors duration-200 line-clamp-2">
                          {post.title}
                        </h3>
                        
                        <p className="text-zinc-400 mb-6 line-clamp-3 flex-grow">
                          {post.excerpt}
                        </p>
                        
                        <div className="flex items-center justify-between text-sm text-zinc-500">
                          <div className="flex items-center gap-4">
                            <span className="flex items-center gap-1">
                              <User size={14} />
                              {post.author}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock size={14} />
                              {post.readTime}
                            </span>
                          </div>
                          <span className="flex items-center gap-1 text-orange-400 group-hover:text-orange-300">
                            Read More
                            <ArrowRight size={14} />
                          </span>
                        </div>
                      </div>
                    </article>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* All Posts */}
          <section>
            <h2 className="text-2xl font-bold mb-8 text-center">All Guides</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {blogPosts.map((post) => (
                <Link
                  key={post.id}
                  href={`/guides/${post.slug}`}
                  className="group block"
                >
                  <article className="bg-zinc-900/50 rounded-xl border border-zinc-800/50 hover:border-orange-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-orange-500/10 overflow-hidden h-full">
                    <div className="p-6 h-full flex flex-col">
                      <div className="flex items-center gap-2 mb-3">
                        <Badge variant="outline" className="text-zinc-400 border-zinc-700 text-xs">
                          {post.category}
                        </Badge>
                      </div>
                      
                      <h3 className="text-lg font-semibold mb-3 group-hover:text-orange-400 transition-colors duration-200 line-clamp-2">
                        {post.title}
                      </h3>
                      
                      <p className="text-sm text-zinc-400 mb-4 line-clamp-3 flex-grow">
                        {post.excerpt}
                      </p>
                      
                      <div className="flex items-center justify-between text-xs text-zinc-500">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1">
                            <Calendar size={12} />
                            {new Date(post.publishedAt).toLocaleDateString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock size={12} />
                            {post.readTime}
                          </span>
                        </div>
                        <ArrowRight size={12} className="text-orange-400 group-hover:text-orange-300" />
                      </div>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
