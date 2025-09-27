import React from "react";
import { useRoute, Link } from "wouter";
import SEOHead from "@/components/SEO/SEOHead";
import Breadcrumb from "@/components/SEO/Breadcrumb";
import { Badge } from "@/components/ui/badge";
import { Clock, User, Calendar, ArrowLeft, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";

// Sample blog posts data (in real app, this would come from API/CMS)
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

export default function BlogPostPage() {
  const [match, params] = useRoute("/guides/:slug");
  const slug = params?.slug;

  const post = blogPosts.find(p => p.slug === slug);

  if (!match || !post) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-800 to-orange-900/20 text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Post Not Found</h1>
          <p className="text-zinc-400 mb-6">The guide you're looking for doesn't exist.</p>
          <Link href="/guides">
            <Button className="bg-orange-600 hover:bg-orange-700">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Guides
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const breadcrumbItems = [
    { name: 'Home', href: '/' },
    { name: 'Guides', href: '/guides' },
    { name: post.title, href: `/guides/${post.slug}` }
  ];

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": post.title,
    "description": post.excerpt,
    "author": {
      "@type": "Person",
      "name": post.author
    },
    "datePublished": post.publishedAt,
    "dateModified": post.publishedAt,
    "publisher": {
      "@type": "Organization",
      "name": "MedusaVR",
      "logo": {
        "@type": "ImageObject",
        "url": "https://medusa-vrfriendly.vercel.app/medusaSnake.png"
      }
    },
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": `https://medusa-vrfriendly.vercel.app/guides/${post.slug}`
    },
    "keywords": post.tags.join(', '),
    "articleSection": post.category,
    "wordCount": post.content.split(' ').length
  };

  // Parse markdown-style content to HTML (basic implementation)
  const formatContent = (content: string) => {
    return content
      .split('\n\n')
      .map((paragraph, index) => {
        if (paragraph.startsWith('## ')) {
          return <h2 key={index} className="text-2xl font-bold mt-8 mb-4 text-orange-400">{paragraph.replace('## ', '')}</h2>;
        }
        if (paragraph.startsWith('### ')) {
          return <h3 key={index} className="text-xl font-semibold mt-6 mb-3">{paragraph.replace('### ', '')}</h3>;
        }
        if (paragraph.startsWith('- ')) {
          const items = paragraph.split('\n').map(item => item.replace('- ', ''));
          return (
            <ul key={index} className="list-disc pl-6 mb-4 space-y-2">
              {items.map((item, i) => <li key={i} className="text-zinc-300">{item}</li>)}
            </ul>
          );
        }
        if (paragraph.includes('**')) {
          const formattedText = paragraph.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>');
          return <p key={index} className="mb-4 text-zinc-300 leading-relaxed" dangerouslySetInnerHTML={{ __html: formattedText }} />;
        }
        return <p key={index} className="mb-4 text-zinc-300 leading-relaxed">{paragraph}</p>;
      });
  };

  return (
    <>
      <SEOHead
        title={`${post.title} | MedusaVR Guides`}
        description={post.excerpt}
        keywords={post.tags.join(', ')}
        structuredData={articleSchema}
        type="article"
        canonicalUrl={`https://medusa-vrfriendly.vercel.app/guides/${post.slug}`}
      />
      
      <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-800 to-orange-900/20 text-white">
        <Breadcrumb items={breadcrumbItems} />
        
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
          {/* Back Button */}
          <div className="mb-8">
            <Link href="/guides">
              <Button variant="ghost" className="text-zinc-400 hover:text-white">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Guides
              </Button>
            </Link>
          </div>

          {/* Article Header */}
          <header className="mb-12">
            <div className="flex flex-wrap items-center gap-3 mb-6">
              <Badge variant="secondary" className="bg-orange-600/20 text-orange-400 border-orange-500/30">
                {post.category}
              </Badge>
              {post.tags.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="outline" className="text-zinc-400 border-zinc-700 text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
            
            <h1 className="text-4xl sm:text-5xl font-bold mb-6 leading-tight bg-gradient-to-r from-white to-zinc-300 bg-clip-text text-transparent">
              {post.title}
            </h1>
            
            <p className="text-xl text-zinc-400 mb-8 leading-relaxed">
              {post.excerpt}
            </p>
            
            <div className="flex flex-wrap items-center gap-6 text-sm text-zinc-500 pb-8 border-b border-zinc-800/50">
              <span className="flex items-center gap-2">
                <User size={16} />
                {post.author}
              </span>
              <span className="flex items-center gap-2">
                <Calendar size={16} />
                {new Date(post.publishedAt).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </span>
              <span className="flex items-center gap-2">
                <Clock size={16} />
                {post.readTime}
              </span>
              <Button 
                variant="ghost" 
                size="sm" 
                className="ml-auto text-zinc-400 hover:text-orange-400"
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({
                      title: post.title,
                      text: post.excerpt,
                      url: window.location.href
                    });
                  }
                }}
              >
                <Share2 size={16} className="mr-2" />
                Share
              </Button>
            </div>
          </header>

          {/* Article Content */}
          <article className="prose prose-invert prose-orange max-w-none">
            {formatContent(post.content)}
          </article>

          {/* Article Footer */}
          <footer className="mt-16 pt-8 border-t border-zinc-800/50">
            <div className="text-center">
              <p className="text-zinc-400 mb-6">
                Found this guide helpful? Share it with others who might benefit!
              </p>
              <div className="flex justify-center gap-4">
                <Link href="/guides">
                  <Button variant="outline" className="border-zinc-700 hover:border-orange-500/50">
                    More Guides
                  </Button>
                </Link>
                <Link href="/ForYouPage">
                  <Button className="bg-orange-600 hover:bg-orange-700">
                    Explore Characters
                  </Button>
                </Link>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </>
  );
}
