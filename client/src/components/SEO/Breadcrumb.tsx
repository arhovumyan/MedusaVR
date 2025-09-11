import React from 'react';
import { ChevronRight, Home } from 'lucide-react';
import { Link } from 'wouter';

interface BreadcrumbItem {
  name: string;
  href?: string;
  current?: boolean;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({ items, className = "" }) => {
  // Generate structured data for breadcrumbs
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      ...(item.href && { "item": `https://medusavr.art${item.href}` })
    }))
  };

  return (
    <>
      {/* Structured Data */}
      <script type="application/ld+json">
        {JSON.stringify(structuredData)}
      </script>
      
      {/* Visual Breadcrumb */}
      <nav className={`flex ${className}`} aria-label="Breadcrumb">
        <ol className="flex items-center space-x-2 text-sm">
          {items.map((item, index) => (
            <li key={index} className="flex items-center">
              {index > 0 && (
                <ChevronRight className="h-4 w-4 text-zinc-400 mx-2" />
              )}
              {item.current ? (
                <span className="text-orange-400 font-medium" aria-current="page">
                  {item.name}
                </span>
              ) : item.href ? (
                <Link 
                  href={item.href} 
                  className="text-zinc-300 hover:text-orange-400 transition-colors duration-200 flex items-center gap-1"
                >
                  {index === 0 && <Home className="h-3 w-3" />}
                  {item.name}
                </Link>
              ) : (
                <span className="text-zinc-400">{item.name}</span>
              )}
            </li>
          ))}
        </ol>
      </nav>
    </>
  );
};

export default Breadcrumb;
