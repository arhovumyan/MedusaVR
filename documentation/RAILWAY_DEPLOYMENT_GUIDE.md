# Deployment Environment Variables Setup Guide

## Required Environment Variables for Production Deployment

### Backend Environment Variables
Set these in your backend service:

```bash
# Database
MONGODB_URI=your_mongodb_connection_string

# JWT
JWT_SECRET=your_jwt_secret_key_for_production

# Firebase Admin
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_CLIENT_EMAIL=your_firebase_client_email
FIREBASE_PRIVATE_KEY=your_firebase_private_key

# Image Generation
REPLICATE_API_TOKEN=your_replicate_api_token

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Node Environment
NODE_ENV=production
PORT=8080

# CORS Origins (UPDATE THESE WITH YOUR ACTUAL URLS)
FRONTEND_URL=https://your-frontend-domain.com
```

### Frontend Environment Variables
Set these in your frontend deployment:

```bash
# API Connection
VITE_API_URL=https://your-backend-url.com

# Firebase Client Config
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
VITE_FIREBASE_APP_ID=your_firebase_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_firebase_measurement_id

# Cloudinary
VITE_CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
VITE_CLOUDINARY_UPLOAD_PRESET=your_cloudinary_upload_preset
```

## Step-by-Step Deployment Guide

### 1. Deploy Backend to Railway

1. **Connect your Repository to Railway:**
   ```bash
   # If not already connected, go to Railway dashboard
   # Click "New Project" → "Deploy from GitHub repo"
   # Select your MedusaVR repository
   ```

2. **Configure Railway Build Settings:**
   - Railway should auto-detect your Node.js project
   - Make sure it's pointing to the `/server` directory
   - Build command: `npm run build`
   - Start command: `npm start`

3. **Set Environment Variables in Railway:**
   Go to your Railway project → Variables tab → Add all the environment variables listed above

4. **Configure Railway Domain:**
   - Go to Settings → Domains
   - Your Railway URL will be something like: `https://your-project-name.railway.app`
   - Copy this URL - you'll need it for the frontend

### 2. Update Frontend Configuration

1. **Update your Vercel Environment Variables:**
   - Go to Vercel dashboard → Your project → Settings → Environment Variables
   - Update `VITE_API_URL` to your Railway backend URL
   - Update all other environment variables as needed

2. **Redeploy Frontend:**
   ```bash
   # Trigger a new deployment in Vercel
   # Or push a new commit to trigger auto-deployment
   ```

### 3. Test Socket.IO Connection

1. **Check Railway Logs:**
   ```bash
   # In Railway dashboard → Deployments → View Logs
   # Look for Socket.IO server startup messages
   ```

2. **Test the Connection:**
   - Open your frontend app
   - Navigate to a chat page
   - Check browser developer tools → Network tab
   - Look for WebSocket connections to your Railway URL

### 4. Troubleshooting

If Socket.IO still doesn't connect, check:

1. **CORS Configuration:**
   - Make sure `FRONTEND_URL` environment variable is set correctly in Railway
   - Check that your Vercel URL is included in the CORS origins

2. **Network Issues:**
   - Railway supports WebSockets by default
   - Make sure your Railway service is running (check health endpoint: `/health`)

3. **Authentication:**
   - Make sure JWT tokens are working correctly
   - Check that Firebase authentication is properly configured

### 5. Health Check

Visit your Railway backend health endpoint:
```
https://your-railway-backend-url.railway.app/health
```

You should see:
```json
{
  "status": "ok",
  "timestamp": "2024-01-XX...",
  "service": "medusavr-backend",
  "socketio": "enabled"
}
```

## Production Monitoring

### Railway Dashboard
- Monitor your backend logs in real-time
- Check CPU and memory usage
- Monitor WebSocket connections

### Browser Developer Tools
- Network tab: Check WebSocket connection status
- Console: Look for Socket.IO connection logs
- Application tab: Check for authentication tokens

## Common Issues and Fixes

### Issue: "Mixed Content" errors
**Solution:** Make sure both frontend and backend use HTTPS in production

### Issue: WebSocket connection fails
**Solutions:**
1. Check CORS configuration
2. Verify Railway backend is running
3. Check authentication tokens
4. Verify environment variables

### Issue: Socket.IO connects but messages don't send
**Solutions:**
1. Check authentication middleware
2. Verify MongoDB connection
3. Check character/user permissions

This guide should get your Socket.IO server running perfectly on Railway! 🚀
