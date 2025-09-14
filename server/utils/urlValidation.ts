import { URL } from 'url';

// Allowed domains for redirects
const ALLOWED_DOMAINS = [
  'localhost',
  '127.0.0.1',
  'medusa-vrfriendly.vercel.app',
  'www.medusa-vrfriendly.vercel.app',
  'vercel.app', // For development
  process.env.FRONTEND_URL, // Environment-based domain
].filter(Boolean);

// Allowed protocols
const ALLOWED_PROTOCOLS = ['http:', 'https:'];

/**
 * Validates if a URL is safe for redirects
 * @param urlString - The URL string to validate
 * @returns boolean - True if URL is safe, false otherwise
 */
export function isValidRedirectUrl(urlString: string): boolean {
  try {
    // Basic string validation
    if (!urlString || typeof urlString !== 'string') {
      return false;
    }

    // Check for obvious malicious patterns
    const maliciousPatterns = [
      /javascript:/i,
      /data:/i,
      /vbscript:/i,
      /file:/i,
      /ftp:/i,
    ];

    if (maliciousPatterns.some(pattern => pattern.test(urlString))) {
      return false;
    }

    // Parse URL
    const parsedUrl = new URL(urlString);

    // Check protocol
    if (!ALLOWED_PROTOCOLS.includes(parsedUrl.protocol)) {
      return false;
    }

    // Check domain
    const hostname = parsedUrl.hostname.toLowerCase();
    
    // Allow relative URLs (no hostname)
    if (!hostname) {
      return true;
    }

    // Check against allowed domains
    const isAllowedDomain = ALLOWED_DOMAINS.some(domain => {
      if (!domain) return false;
      
      // Exact match
      if (hostname === domain.toLowerCase()) {
        return true;
      }
      
      // Subdomain match (e.g., api.example.com matches example.com)
      if (hostname.endsWith('.' + domain.toLowerCase())) {
        return true;
      }
      
      return false;
    });

    return isAllowedDomain;
  } catch (error) {
    // Invalid URL format
    return false;
  }
}

/**
 * Sanitizes a URL for safe redirection
 * @param urlString - The URL string to sanitize
 * @returns string - Sanitized URL or default safe URL
 */
export function sanitizeRedirectUrl(urlString: string): string {
  if (isValidRedirectUrl(urlString)) {
    return urlString;
  }
  
  // Default to home page if URL is not valid
  return '/';
}

/**
 * Validates and sanitizes multiple URLs
 * @param urls - Array of URL strings
 * @returns Array of sanitized URLs
 */
export function sanitizeUrls(urls: string[]): string[] {
  return urls.map(url => sanitizeRedirectUrl(url));
}

/**
 * Checks if a URL is a relative path (no domain)
 * @param urlString - The URL string to check
 * @returns boolean - True if relative, false otherwise
 */
export function isRelativeUrl(urlString: string): boolean {
  try {
    if (!urlString || typeof urlString !== 'string') {
      return false;
    }
    
    // Relative URLs don't start with protocol or //
    return !urlString.startsWith('http://') && 
           !urlString.startsWith('https://') && 
           !urlString.startsWith('//') &&
           (urlString.startsWith('/') || urlString.startsWith('./') || urlString.startsWith('../'));
  } catch (error) {
    return false;
  }
}

/**
 * Adds allowed domains to the whitelist (for development)
 * @param domains - Array of domain strings to add
 */
export function addAllowedDomains(domains: string[]): void {
  domains.forEach(domain => {
    if (domain && typeof domain === 'string' && !ALLOWED_DOMAINS.includes(domain)) {
      ALLOWED_DOMAINS.push(domain);
    }
  });
}

/**
 * Gets the current list of allowed domains
 * @returns Array of allowed domain strings
 */
export function getAllowedDomains(): string[] {
  return [...ALLOWED_DOMAINS];
}
