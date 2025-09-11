# MedusaVR Domain Configuration Guide

## Domain: your-domain.com

This document outlines all the changes made to configure your new domain `your-domain.com` across the application.

## ✅ Updates Completed

### 1. **Server CORS Configuration** (`server/app.ts`)
- ✅ Fixed CORS import issue
- ✅ Added `your-domain.com` domain variants:
  - `https://your-domain.com`
  - `https://www.your-domain.com`
  - `http://your-domain.com`
  - `http://www.your-domain.com`

### 2. **SEO & Meta Tags** (`client/index.html`)
- ✅ Updated all Open Graph URLs to `https://your-domain.com`
- ✅ Updated Twitter Card URLs to `https://your-domain.com`
- ✅ Added canonical URL: `https://your-domain.com`
- ✅ Enhanced meta tags with keywords, author, robots
- ✅ Added PWA manifest link
- ✅ Improved mobile web app meta tags

### 3. **Search Engine Optimization**
- ✅ **robots.txt** updated with `https://your-domain.com/sitemap.xml`
- ✅ **sitemap.xml** updated with all pages using `https://your-domain.com`
- ✅ Enhanced robots.txt with crawl rules and bot permissions

### 4. **PWA Support**
- ✅ Created `manifest.json` for Progressive Web App functionality
- ✅ Configured app name, icons, theme colors, and display settings

### 5. **Environment Configuration**
- ✅ Updated `.env.production` to use `https://your-domain.com/api`
- ✅ Updated socket URL to `https://your-domain.com`

## 🔧 Next Steps for Production Deployment

### DNS Configuration
You'll need to configure these DNS records for `your-domain.com`:

```
Type: A
Name: @
Value: [Your server IP address]

Type: CNAME
Name: www
Value: your-domain.com
```

### SSL/HTTPS Setup
1. **Option A: Cloudflare** (Recommended)
   - Add your domain to Cloudflare
   - Enable SSL/TLS encryption
   - Use "Full (strict)" encryption mode

2. **Option B: Let's Encrypt**
   - Install certbot on your server
   - Generate SSL certificates for both `your-domain.com` and `www.your-domain.com`

### Server Configuration
Update your production server environment variables:
```bash
FRONTEND_URL=https://your-domain.com
ALLOWED_ORIGINS=https://your-domain.com,https://www.your-domain.com
```

### Deployment Platforms
- **Vercel**: Domain will auto-configure when you add the custom domain
- **Railway**: Update environment variables in Railway dashboard
- **Netlify**: Add custom domain in site settings

## 📋 Files Modified

### Server Files
- ✅ `server/app.ts` - CORS configuration

### Client Files
- ✅ `client/index.html` - Meta tags and SEO
- ✅ `client/.env.production` - Production API URLs
- ✅ `client/public/robots.txt` - Search engine directives
- ✅ `client/public/sitemap.xml` - Site structure for SEO
- ✅ `client/public/manifest.json` - PWA configuration

## 🚀 Testing Your Domain

Once DNS is configured and SSL is set up:

1. **Test main site**: https://your-domain.com
2. **Test www redirect**: https://www.your-domain.com
3. **Test API endpoints**: https://your-domain.com/api/health
4. **Test sitemap**: https://your-domain.com/sitemap.xml
5. **Test robots.txt**: https://your-domain.com/robots.txt

## 📊 SEO Tools Setup

After going live, submit your sitemap to:
- **Google Search Console**: https://search.google.com/search-console
- **Bing Webmaster Tools**: https://www.bing.com/webmasters
- **Yandex Webmaster**: https://webmaster.yandex.com

## 🔍 Performance Monitoring

Consider setting up:
- Google Analytics 4
- Google Tag Manager
- Core Web Vitals monitoring
- Uptime monitoring (UptimeRobot, Pingdom)

Your MedusaVR application is now fully configured for the `your-domain.com` domain! 🎉
