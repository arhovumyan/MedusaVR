# 🚀 Deployment Guide: Vercel + Railway

## ✅ **Your Current URLs**

### **Railway Backend (Already Deployed)**
- **URL**: `https://vrfansbackend.up.railway.app`
- **Status**: ✅ Already running

### **Vercel Frontend (To Deploy)**
- **URL**: Will be `https://medusa-vr-friendly.vercel.app` (based on your project name)

## 📋 **Step-by-Step Deployment**

### **Step 1: Update Railway Environment Variables**

Go to your Railway dashboard and update these variables:

```bash
# Database (IMPORTANT: Change to MedusaFriendly)
MONGODB_URI=mongodb+srv://vrfans11:LZa9dOgq3PhS0zxN@vrfanscluster.lt8bt55.mongodb.net/MedusaFriendly?retryWrites=true&w=majority

# Environment
NODE_ENV=production
APP_ENV=production

# CORS (Update after Vercel deployment)
FRONTEND_URL=https://medusa-vr-friendly.vercel.app

# Keep all your other variables as they are
```

### **Step 2: Deploy Vercel Frontend**

#### **Vercel Configuration:**
- **Framework Preset**: Change from "Next.js" to "Vite" or "Other"
- **Root Directory**: Change from "./" to "./client"
- **Build Command**: `npm install && npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

#### **Vercel Environment Variables:**
```bash
# Application
VITE_APP_ENV=production

# API URLs (Use your Railway backend)
VITE_API_URL=https://vrfansbackend.up.railway.app
VITE_SOCKET_URL=https://vrfansbackend.up.railway.app
VITE_PROD_API_URL=https://vrfansbackend.up.railway.app

# Firebase Client
VITE_FIREBASE_API_KEY=AIzaSyCJ1PiogVXI0mZKZEZaf-8NxCndVlifR20
VITE_FIREBASE_AUTH_DOMAIN=vrfans-firebase.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=vrfans-firebase
VITE_FIREBASE_STORAGE_BUCKET=vrfans-firebase.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=84702763507
VITE_FIREBASE_APP_ID=1:84702763507:web:88004f28b0de06a7341a86
VITE_FIREBASE_MEASUREMENT_ID=G-CDLH4QBNVP

# Cloudinary
VITE_CLOUDINARY_CLOUD_NAME=dqqxxg51o
VITE_CLOUDINARY_UPLOAD_PRESET=ml_default
```

### **Step 3: Test the Connection**

After both deployments:

1. **Test Railway Backend**:
   ```bash
   curl https://vrfansbackend.up.railway.app/health
   ```

2. **Test Vercel Frontend**: Visit your Vercel URL

3. **Test Full Connection**: Use your app and check if it connects to the backend

## 🔧 **Important Notes**

### **Database Migration**
- Your Railway is currently using the `test` database
- You need to change it to `MedusaFriendly` database
- This is the **most important change** to make

### **CORS Configuration**
- Railway needs to know your Vercel URL for CORS
- Update `FRONTEND_URL` in Railway after Vercel deployment

### **Environment Variables**
- **Railway**: Only backend variables (no `VITE_*`)
- **Vercel**: Only frontend variables (only `VITE_*`)

## 🚨 **Critical Changes Needed**

1. **Railway**: Change `MONGODB_URI` from `test` to `MedusaFriendly`
2. **Railway**: Add `FRONTEND_URL` after Vercel deployment
3. **Vercel**: Fix Framework Preset and Root Directory
4. **Vercel**: Update API URLs to use Railway backend

## 📞 **Testing Commands**

```bash
# Test Railway backend health
curl https://vrfansbackend.up.railway.app/health

# Test Railway backend with your app
curl https://vrfansbackend.up.railway.app/api/health

# Check Railway logs
# (In Railway dashboard → Deployments → View Logs)
```

## 🎯 **Expected Result**

After deployment, you should have:
- ✅ Railway backend running on `https://vrfansbackend.up.railway.app`
- ✅ Vercel frontend running on `https://medusa-vr-friendly.vercel.app`
- ✅ Frontend successfully connecting to backend
- ✅ Using MedusaFriendly database instead of test database
