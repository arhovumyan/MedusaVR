# Vercel Frontend Environment Variables

## ✅ **Use these variables for Vercel (Frontend)**

```bash
# Application Environment
VITE_APP_ENV=production

# API URLs (Update with your Railway backend URL)
VITE_DEV_API_URL=http://localhost:5002
VITE_PROD_API_URL=https://vrfansbackend.up.railway.app
VITE_DOCKER_API_URL=http://backend:5002
VITE_API_URL=https://vrfansbackend.up.railway.app
VITE_SOCKET_URL=https://vrfansbackend.up.railway.app

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

## 🔧 **Important Notes:**

1. **API URLs**: Make sure `VITE_API_URL` and `VITE_SOCKET_URL` point to your Railway backend
2. **Environment**: Changed `VITE_APP_ENV` to `production`
3. **Removed**: All non-`VITE_*` variables (these are for backend only)

## 📋 **Vercel Configuration from Image:**

Based on your Vercel setup image, here are the recommended settings:

- **Framework Preset**: Next.js (but you're using Vite, so this might need adjustment)
- **Root Directory**: `./client` (since your frontend is in the client folder)
- **Build Command**: `npm install && npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

## ⚠️ **Framework Preset Issue:**

Your Vercel image shows "Next.js" but you're using Vite. You should:
1. Change Framework Preset to "Vite" or "Other"
2. Or manually set the build commands as shown above
