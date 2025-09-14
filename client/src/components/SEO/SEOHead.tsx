import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'profile' | 'product';
  noIndex?: boolean;
  canonicalUrl?: string;
  structuredData?: object;
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
  section?: string;
  tags?: string[];
  locale?: string;
  alternateLanguages?: { [key: string]: string };
}

export const SEOHead: React.FC<SEOHeadProps> = ({
  title = "MedusaVR - AI Character Chat & Image Generator",
  description = "Create custom AI characters, generate custom images, and enjoy unlimited AI chat conversations. The ultimate platform for AI companions, content creation, and interactive roleplay.",
  keywords = "AI character chat, AI generator, AI companion app, generate AI images, AI chat, anime AI characters, custom AI characters, AI roleplay, character creation, AI art generator",
  image = "https://medusa-vrfriendly.vercel.app/medusaSnake.png",
  url = "https://medusa-vrfriendly.vercel.app",
  type = "website",
  noIndex = false,
  canonicalUrl,
  structuredData,
  author = "MedusaVR",
  publishedTime,
  modifiedTime,
  section,
  tags = [],
  locale = "en_US",
  alternateLanguages = {}
}) => {
  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{title}</title>
      <meta name="title" content={title} />
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="author" content={author} />
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1" />
      <meta name="theme-color" content="#f97316" />
      <meta name="format-detection" content="telephone=no" />
      <meta name="rating" content="mature" />
      <meta name="content-rating" content="mature" />
      
      {/* Language and Region */}
      <meta name="language" content="en" />
      <meta name="geo.region" content="US" />
      <meta name="geo.placename" content="United States" />
      
      {/* Canonical URL */}
      {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}
      
      {/* Alternate Languages */}
      {Object.entries(alternateLanguages).map(([lang, url]) => (
        <link key={lang} rel="alternate" hrefLang={lang} href={url} />
      ))}
      
      {/* Robots */}
      {noIndex ? (
        <meta name="robots" content="noindex, nofollow" />
      ) : (
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
      )}

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content={title} />
      <meta property="og:site_name" content="MedusaVR" />
      <meta property="og:locale" content={locale} />
      {publishedTime && <meta property="article:published_time" content={publishedTime} />}
      {modifiedTime && <meta property="article:modified_time" content={modifiedTime} />}
      {author && <meta property="article:author" content={author} />}
      {section && <meta property="article:section" content={section} />}
      {tags.length > 0 && tags.map((tag, index) => (
        <meta key={index} property="article:tag" content={tag} />
      ))}

      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={url} />
      <meta property="twitter:title" content={title} />
      <meta property="twitter:description" content={description} />
      <meta property="twitter:image" content={image} />
      <meta property="twitter:image:alt" content={title} />
      <meta property="twitter:site" content="@MedusaVR" />
      <meta property="twitter:creator" content="@MedusaVR" />

      {/* Additional Social Media */}
      <meta name="twitter:label1" content="Est. reading time" />
      <meta name="twitter:data1" content="3 minutes" />

      {/* Structured Data */}
      {structuredData && (
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      )}
    </Helmet>
  );
};

export default SEOHead;
