# Development Setup Guide

## Quick Start

### 1. Start the Backend Server

```bash
# Navigate to the project root
cd /Users/aro/Documents/MedusaFriendly

# Install dependencies (if not already done)
npm install

# Start the backend server
npm run dev:server
# OR
cd server && npm run dev
```

### 2. Start the Frontend (in a new terminal)

```bash
# In a new terminal window
cd /Users/aro/Documents/MedusaFriendly

# Start the frontend
npm run dev:client
# OR
cd client && npm run dev
```

### 3. Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5002
- **Health Check**: http://localhost:5002/health

## Environment Configuration

### Backend Environment (.env)

Create a `.env` file in the project root:

```bash
# Copy the template
cp env.template .env
```

Then edit `.env` with your actual values:

```bash
# Database
MONGODB_URI=mongodb://localhost:27017/your-database
DB_NAME=your-database

# JWT
JWT_SECRET=your-super-secret-jwt-key-here

# Firebase (required for authentication)
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_CLIENT_EMAIL=your-firebase-client-email
FIREBASE_PRIVATE_KEY=your-firebase-private-key

# Application
NODE_ENV=development
PORT=5002
FRONTEND_URL=http://localhost:5173
```

### Frontend Environment (client/.env)

Create a `.env` file in the client directory:

```bash
# Copy the template
cp client/env.template client/.env
```

Then edit `client/.env`:

```bash
# API Configuration
VITE_API_URL=http://localhost:5002
VITE_SOCKET_URL=ws://localhost:5002

# Firebase Client Configuration
VITE_FIREBASE_API_KEY=your-firebase-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-firebase-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
VITE_FIREBASE_APP_ID=your-firebase-app-id
VITE_FIREBASE_MEASUREMENT_ID=your-measurement-id
```

## Common Issues & Solutions

### 1. "Failed to load resource: net::ERR_CONNECTION_REFUSED"

**Problem**: Backend server is not running
**Solution**: Start the backend server with `npm run dev:server`

### 2. "React Router Future Flag Warning"

**Problem**: This warning is from a different library, not your code
**Solution**: This is harmless and can be ignored (you're using Wouter, not React Router)

### 3. "Resource preload warnings"

**Problem**: HTML preload configuration issues
**Solution**: Fixed in the latest update

### 4. API calls failing

**Problem**: Backend not running or wrong API URL
**Solution**: 
1. Ensure backend is running on port 5002
2. Check that `VITE_API_URL` is set correctly in `client/.env`
3. Verify the backend health endpoint: http://localhost:5002/health

## Development Scripts

```bash
# Start both frontend and backend
npm run dev

# Start only backend
npm run dev:server

# Start only frontend  
npm run dev:client

# Build for production
npm run build

# Start production build
npm run start
```

## Docker Development

If you prefer using Docker:

```bash
# Start development environment
docker-compose -f docker-compose.dev.yml up

# Start production environment
docker-compose -f docker-compose.prod.yml up
```

## Troubleshooting

### Check if backend is running:
```bash
curl http://localhost:5002/health
```

### Check if frontend is running:
```bash
curl http://localhost:5173
```

### View backend logs:
```bash
# If using npm
npm run dev:server

# If using Docker
docker-compose logs -f backend
```

### View frontend logs:
```bash
# If using npm
npm run dev:client

# If using Docker
docker-compose logs -f frontend
```

## Required Services

Before starting development, ensure you have:

1. **MongoDB** - Database server
2. **Firebase Project** - Authentication
3. **Node.js** - Runtime environment

## Next Steps

1. Set up your environment variables
2. Start the backend server
3. Start the frontend
4. Access the application at http://localhost:5173

The application should now work without connection errors!
