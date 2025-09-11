# Content Security Policy (CSP) and Clickjacking Protection Implementation

## Overview

This document outlines the comprehensive implementation of a **Strict Content Security Policy (CSP)** and clickjacking protection for MedusaVR using nginx security headers. This implementation follows the latest security best practices and provides robust protection against XSS, clickjacking, and other web security threats.

## ✅ **What's New in This Implementation**

- **Hash-based Strict CSP**: Uses SHA256 hashes for inline scripts instead of unsafe directives
- **strict-dynamic**: Modern CSP feature that allows trusted scripts to load additional scripts
- **CSP Violation Reporting**: Real-time monitoring of security policy violations
- **Comprehensive Clickjacking Protection**: Multiple layers using both legacy and modern approaches
- **Zero 'unsafe-inline'**: Completely eliminates dangerous CSP bypasses

## Implemented Security Measures

### 1. Clickjacking Protection

Based on [MDN's Clickjacking documentation](https://developer.mozilla.org/en-US/docs/Web/Security/Attacks/Clickjacking), we've implemented multiple layers of protection:

#### X-Frame-Options Header
```nginx
add_header X-Frame-Options "DENY" always;
```
- **Purpose**: Prevents the site from being embedded in iframes
- **Value**: `DENY` - completely prevents framing
- **Applied to**: All responses (main site, API, WebSocket)

#### CSP frame-ancestors Directive
```nginx
frame-ancestors 'none';
```
- **Purpose**: Modern replacement for X-Frame-Options
- **Value**: `'none'` - prevents embedding in any context
- **Compatibility**: Works with modern browsers, falls back to X-Frame-Options for older ones

### 2. Content Security Policy (CSP)

#### Strict CSP Implementation
```nginx
Content-Security-Policy: "default-src 'self'; 
script-src 'self' 'sha256-vKBtKt4tkKmyC3nuP9sQqJYrnGzlIk7igPLRN8vVv3E=' 'sha256-ifKTjJw/MSNzCywKVXz2VApQS4qbNmu3B5K1Ek4kb20=' 'strict-dynamic' https://apis.google.com https://www.gstatic.com https://accounts.google.com; 
style-src 'self' https://fonts.googleapis.com; 
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
report-to csp-endpoint;"
```

**Key Improvements:**
- **Hash-based script allowlisting**: `'sha256-vKBtKt4tkKmyC3nuP9sQqJYrnGzlIk7igPLRN8vVv3E='` and `'sha256-ifKTjJw/MSNzCywKVXz2VApQS4qbNmu3B5K1Ek4kb20='` for JSON-LD scripts
- **strict-dynamic**: Allows trusted scripts to load additional scripts dynamically
- **No 'unsafe-inline'**: Completely removes dangerous CSP bypasses
- **CSP Reporting**: `report-to csp-endpoint` enables violation monitoring

#### API Endpoints CSP
```nginx
Content-Security-Policy: "default-src 'none'; frame-ancestors 'none';"
```
- **Purpose**: Strict policy for API endpoints
- **Prevents**: All loading except explicit needs, iframe embedding

#### WebSocket CSP
```nginx
Content-Security-Policy: "default-src 'none'; connect-src 'self' wss: ws:; frame-ancestors 'none';"
```
- **Purpose**: Allows only WebSocket connections
- **Prevents**: All other resource loading, iframe embedding

### 3. Additional Security Headers

#### Cross-Origin Policies
```nginx
add_header Cross-Origin-Embedder-Policy "require-corp" always;
add_header Cross-Origin-Opener-Policy "same-origin" always;
add_header Cross-Origin-Resource-Policy "same-origin" always;
```

#### Permissions Policy
```nginx
add_header Permissions-Policy "camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=(), speaker=(), vibrate=(), fullscreen=(self)" always;
```

#### Other Security Headers
```nginx
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always; # Production only
```

## Strict CSP Directive Breakdown

### script-src (Hash-based + strict-dynamic)
- `'self'`: Scripts from same origin
- `'sha256-vKBtKt4tkKmyC3nuP9sQqJYrnGzlIk7igPLRN8vVv3E='`: Hash for WebApplication JSON-LD script
- `'sha256-ifKTjJw/MSNzCywKVXz2VApQS4qbNmu3B5K1Ek4kb20='`: Hash for WebSite JSON-LD script
- `'strict-dynamic'`: Allows trusted scripts to load additional scripts
- Essential domains only: Google APIs, Firebase for authentication

**Why Hash-based is Better:**
- No need for server-side nonce generation
- Works with static files
- More secure than 'unsafe-inline'
- Compatible with CDNs and caching

### img-src
- `'self'`: Same-origin images
- `data:`: Data URI images
- `https:`: HTTPS images
- `blob:`: Blob URLs for dynamic content
- `https://res.cloudinary.com`: Cloudinary CDN
- Google user content domains

### connect-src
- `'self'`: Same-origin connections
- `wss: ws:`: WebSocket connections
- Various API endpoints (Cloudinary, Firebase, Google)

### frame-src
- `'self'`: Same-origin frames
- Firebase domains for authentication
- Google domains for OAuth

## Security Benefits

### Clickjacking Prevention
1. **X-Frame-Options DENY**: Prevents embedding in older browsers
2. **frame-ancestors 'none'**: Modern standard preventing embedding
3. **Multiple layers**: Both headers ensure compatibility across all browsers

### XSS Prevention
1. **script-src restrictions**: Only allows scripts from trusted sources
2. **object-src 'none'**: Prevents plugin execution
3. **base-uri 'self'**: Prevents base tag injection

### Data Exfiltration Prevention
1. **connect-src restrictions**: Limits outbound connections
2. **form-action restrictions**: Controls form submission targets
3. **Cross-origin policies**: Prevents unauthorized resource sharing

### Mixed Content Protection
1. **upgrade-insecure-requests**: Auto-upgrades HTTP to HTTPS
2. **block-all-mixed-content**: Blocks mixed content entirely

## CSP Violation Reporting

### Backend Endpoint
A dedicated endpoint `/api/security/csp-report` handles violation reports:

```typescript
// Handles both legacy and modern CSP report formats
router.post('/csp-report', async (req: Request, res: Response) => {
  // Logs violations with detailed information
  // In production: store in database, send alerts, aggregate stats
});
```

### Nginx Configuration
```nginx
# CSP violation reporting endpoint
location /csp-report {
    access_log /var/log/nginx/csp_violations.log;
    proxy_pass http://backend:5002/api/security/csp-report;
    limit_except POST { deny all; }
}

# Reporting-Endpoints header
add_header Reporting-Endpoints "csp-endpoint=\"/csp-report\"" always;
```

### Monitoring Violations
```javascript
// Client-side violation monitoring
document.addEventListener('securitypolicyviolation', (e) => {
    console.log('CSP Violation:', e.violatedDirective, e.blockedURI);
    // Automatic reporting to backend
});
```

## Testing

### Automated Testing
Use the provided test file: `/security/csp-test.html`
- Tests inline script blocking
- Verifies clickjacking protection  
- Monitors CSP violations in real-time

### Manual Testing
1. **Strict CSP Test**: Inline scripts should be blocked
2. **Clickjacking Test**: Try embedding your site in an iframe
3. **CSP Violations**: Check browser console for violations
4. **Header Verification**: Use browser dev tools to verify headers

### Security Scanners
- **Mozilla Observatory**: Test overall security score
- **CSP Evaluator**: Analyze CSP policy strength
- **Penetration Testing**: Run automated security tests

## Troubleshooting

### Common Issues
1. **Inline scripts blocked**: Use nonces or move to external files
2. **Images not loading**: Add domains to img-src
3. **Third-party widgets broken**: Add required domains to CSP

### CSP Violations
Monitor CSP violations in production:
```javascript
document.addEventListener('securitypolicyviolation', (e) => {
    console.log('CSP Violation:', e.violatedDirective, e.blockedURI);
    // Send to monitoring service
});
```

## Production Deployment

### Environment-Specific CSP
- **Development**: More permissive for debugging
- **Production**: Strict policy as implemented

### Monitoring
- Set up CSP violation reporting
- Monitor security headers with automated tools
- Regular security audits

## Compliance

This implementation follows:
- [OWASP Clickjacking Defense](https://cheatsheetseries.owasp.org/cheatsheets/Clickjacking_Defense_Cheat_Sheet.html)
- [MDN CSP Guidelines](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- Modern web security best practices

## Updates and Maintenance

1. Regularly review CSP violations
2. Update allowed domains as needed
3. Test new features against CSP
4. Monitor for new security threats
5. Update security headers as standards evolve

## References

- [MDN Clickjacking Documentation](https://developer.mozilla.org/en-US/docs/Web/Security/Attacks/Clickjacking)
- [CSP Level 3 Specification](https://www.w3.org/TR/CSP3/)
- [OWASP Content Security Policy](https://owasp.org/www-project-secure-headers/#content-security-policy)
