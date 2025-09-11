import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

// Generate cryptographically secure nonce
export function generateSecureNonce(): string {
  return crypto.randomBytes(16).toString('base64');
}

// Middleware to inject nonce into HTML for static React app
export function injectNonceMiddleware(req: Request, res: Response, next: NextFunction) {
  // Only process HTML requests to root path or React routes
  if (!req.path.endsWith('.html') && !isReactRoute(req.path)) {
    return next();
  }

  try {
    // Generate a secure nonce for this request
    const nonce = generateSecureNonce();
    
    // Store nonce in response locals for use in CSP header
    res.locals.nonce = nonce;
    
    // Read the static HTML file
    const htmlPath = path.join(process.cwd(), '../client/dist/index.html');
    
    if (!fs.existsSync(htmlPath)) {
      return next(); // Fallback to next middleware if file doesn't exist
    }
    
    let html = fs.readFileSync(htmlPath, 'utf8');
    
    // Inject nonce into script tags
    html = html.replace(
      /(<script(?!\s+src=)[^>]*>)/g,
      `$1<!-- nonce="${nonce}" -->`
    );
    
    // Inject nonce into inline scripts with src
    html = html.replace(
      /(<script[^>]*>)/g,
      (match) => {
        if (match.includes('nonce=')) return match; // Already has nonce
        return match.replace('>', ` nonce="${nonce}">`);
      }
    );
    
    // Set proper CSP header with the nonce
    const cspPolicy = `
      default-src 'self';
      script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https://apis.google.com https://www.gstatic.com https://accounts.google.com;
      style-src 'self' 'nonce-${nonce}' https://fonts.googleapis.com;
      font-src 'self' https://fonts.gstatic.com;
      img-src 'self' data: https: blob: https://res.cloudinary.com https://images.unsplash.com https://lh3.googleusercontent.com;
      connect-src 'self' wss: ws: https: https://api.cloudinary.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://www.googleapis.com https://www.google-analytics.com https://oauth2.googleapis.com;
      frame-src 'self' https://*.firebaseapp.com https://*.web.app https://accounts.google.com https://content.googleapis.com https://www.google.com;
      object-src 'none';
      base-uri 'self';
      form-action 'self' https://accounts.google.com;
      frame-ancestors 'none';
      upgrade-insecure-requests;
      block-all-mixed-content;
      report-to csp-endpoint;
    `.replace(/\s+/g, ' ').trim();
    
    res.setHeader('Content-Security-Policy', cspPolicy);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
    
  } catch (error) {
    console.error('Error injecting nonce into HTML:', error);
    next(); // Fallback to default behavior
  }
}

// Check if the path is a React route (not a static asset)
function isReactRoute(path: string): boolean {
  // Static assets typically have file extensions
  const staticExtensions = ['.js', '.css', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.webp', '.woff', '.woff2', '.ttf', '.json', '.xml', '.txt'];
  const hasExtension = staticExtensions.some(ext => path.toLowerCase().endsWith(ext));
  
  // If it has a known static extension, it's not a React route
  if (hasExtension) return false;
  
  // If it's the root path or looks like a React route, it should get the HTML
  return path === '/' || (!path.includes('.') && !path.startsWith('/api/'));
}

export default injectNonceMiddleware;
