# Project Setup Guide

This project has been cleaned of all previous credentials, domains, and deployment configurations. Follow this guide to set up your own instance.

## 🚀 Quick Start

### 1. Environment Configuration

1. **Copy environment templates:**
   ```bash
   cp env.template .env
   cp client/env.template client/.env
   ```

2. **Fill in your environment variables:**
   - Edit `.env` with your backend configuration
   - Edit `client/.env` with your frontend configuration
   - See the template files for all required variables

### 2. Required Services Setup

#### Database
- Set up MongoDB (local or cloud)
- Update `MONGODB_URI` in `.env`

#### Authentication
- Create a Firebase project
- Add Firebase configuration to both `.env` files
- Download service account key and update `FIREBASE_SERVICE_ACCOUNT_KEY`

#### Image Storage
Choose one of:
- **Cloudinary**: Set up account and add credentials
- **Bunny CDN**: Set up storage zone and add credentials

#### AI Services
- **Replicate**: For image generation
- **OpenRouter**: For AI chat functionality
- **Deepgram**: For voice features (optional)

#### Payment Processing (Optional)
- **NOWPayments**: For cryptocurrency payments

### 3. Domain Configuration

1. **Update domain references:**
   - Replace `your-domain.com` in all files with your actual domain
   - Update CORS origins in `server/app.ts`
   - Update meta tags in `client/index.html`

2. **Update SEO files:**
   - `client/public/robots.txt`
   - `client/public/sitemap.xml`

### 4. Development Setup

```bash
# Install dependencies
npm install

# Start development servers
npm run dev
```

### 5. Production Deployment

#### Backend Deployment
- Deploy to Railway, Heroku, or your preferred platform
- Set all environment variables in your deployment platform
- Ensure CORS is configured for your frontend domain

#### Frontend Deployment
- Deploy to Vercel, Netlify, or your preferred platform
- Set all `VITE_*` environment variables
- Configure custom domain if needed

## 📁 Key Files Modified

### Server Configuration
- `server/app.ts` - CORS and Cloudinary configuration
- `server/index.ts` - Database connection
- `docker-compose.yml` - Docker configuration

### Client Configuration
- `client/index.html` - Meta tags and SEO
- `client/src/lib/imageUpload.ts` - Image upload configuration
- `client/public/robots.txt` - Search engine directives
- `client/public/sitemap.xml` - Site structure

### Documentation
- All documentation files updated with placeholder values
- Deployment guides updated for generic setup

## 🔧 Environment Variables Reference

### Backend (.env)
```bash
# Database
MONGODB_URI=mongodb://localhost:27017/your-database
DB_NAME=your-database

# JWT
JWT_SECRET=your-super-secret-jwt-key-here

# Firebase
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_CLIENT_EMAIL=your-firebase-client-email
FIREBASE_PRIVATE_KEY=your-firebase-private-key

# Image Storage (choose one)
CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret

# OR Bunny CDN
BUNNY_API_KEY=your-bunny-api-key
BUNNY_ACCESS_KEY=your-bunny-access-key
BUNNY_STORAGE_ZONE_NAME=your-storage-zone-name

# AI Services
REPLICATE_API_TOKEN=your-replicate-api-token
OPENROUTER_API_KEY=your-openrouter-api-key
DEEPGRAM_API_KEY=your-deepgram-api-key

# Application
NODE_ENV=production
PORT=5002
FRONTEND_URL=https://your-domain.com
```

### Frontend (client/.env)
```bash
# API
VITE_API_URL=https://your-backend-domain.com
VITE_SOCKET_URL=wss://your-backend-domain.com

# Firebase Client
VITE_FIREBASE_API_KEY=your-firebase-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-firebase-project-id

# Image Storage
VITE_CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
VITE_CLOUDINARY_UPLOAD_PRESET=your-upload-preset
```

## 🚨 Security Notes

1. **Never commit `.env` files** - They contain sensitive credentials
2. **Use strong, unique secrets** for JWT and session keys
3. **Enable HTTPS** in production
4. **Configure proper CORS** for your domains only
5. **Set up rate limiting** and security headers

## 📞 Support

If you encounter issues:
1. Check that all environment variables are set correctly
2. Verify service credentials are valid
3. Ensure CORS is configured for your domains
4. Check the documentation in the `/documentation` folder

## 🔄 What Was Cleaned

- ✅ Removed Firebase service account credentials
- ✅ Replaced all domain references with placeholders
- ✅ Removed hardcoded API keys and secrets
- ✅ Updated Docker configurations
- ✅ Cleaned documentation files
- ✅ Created environment templates
- ✅ Updated SEO and meta tags

Your project is now ready for your own configuration! 🎉
