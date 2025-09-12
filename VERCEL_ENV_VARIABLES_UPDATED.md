# Vercel Frontend Environment Variables - UPDATED

## ✅ **Use these variables for Vercel (Frontend)**

```bash
# Application Environment
VITE_APP_ENV=production

# API URLs - UPDATED WITH YOUR RAILWAY URL
VITE_DEV_API_URL=http://localhost:5002
VITE_PROD_API_URL=https://medusavr-production.up.railway.app
VITE_DOCKER_API_URL=http://backend:5002
VITE_API_URL=https://medusavr-production.up.railway.app
VITE_SOCKET_URL=https://medusavr-production.up.railway.app

# Firebase Client Configuration
VITE_FIREBASE_API_KEY=AIzaSyCJ1PiogVXI0mZKZEZaf-8NxCndVlifR20
VITE_FIREBASE_AUTH_DOMAIN=vrfans-firebase.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=vrfans-firebase
VITE_FIREBASE_STORAGE_BUCKET=vrfans-firebase.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=84702763507
VITE_FIREBASE_APP_ID=1:84702763507:web:88004f28b0de06a7341a86
VITE_FIREBASE_MEASUREMENT_ID=G-CDLH4QBNVP

# Cloudinary Client Configuration
VITE_CLOUDINARY_CLOUD_NAME=dqqxxg51o
VITE_CLOUDINARY_UPLOAD_PRESET=ml_default
```

## 🔧 **Key Changes Made:**

1. **API URLs**: Updated to use your Railway backend: `https://medusavr-production.up.railway.app`
2. **Environment**: Set to `production`
3. **Removed**: All non-`VITE_*` variables (these are for backend only)

## 📋 **Vercel Configuration Settings:**

- **Framework Preset**: Vite (or Other)
- **Root Directory**: `./client`
- **Build Command**: `npm install && npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`
