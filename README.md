# MedusaVR - AI-Powered Character Chat & Image Generation Platform

[![Node.js](https://img.shields.io/badge/Node.js-20+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18+-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5+-blue.svg)](https://www.typescriptlang.org/)

> **MedusaVR** is a cutting-edge AI platform that combines real-time character chat, custom AI companion creation, and high-quality image generation. Built with enterprise-grade architecture, it delivers sub-100ms chat latency and 3× faster image generation compared to baseline systems.

## **Key Features**

### **Core Capabilities**
-  AI Character Chat**: Real-time conversations with AI companions using advanced language models
-  Image Generation**: High-quality AI image creation with custom characters and styles
-  Character Creation**: Build custom AI companions with unique personalities and appearances
-  Voice Integration**: Real-time voice calls with AI characters using Deepgram
-  Advanced Search**: Semantic search and recommendations powered by embeddings
-  Responsive Design**: Optimized for desktop, tablet, and mobile experiences

### **Technical Highlights**
-  Performance**: 99% faster character loading (2-3s → 22ms) with Redis caching
-  Real-time**: WebSocket-based communication with Socket.IO
-  Security**: Enterprise-grade security with CSRF protection, rate limiting, and content filtering
-  Scalable**: Microservices architecture with Docker containerization
-  Multi-modal**: Seamless integration of chat, voice, and image generation

## **System Architecture**

### **Technology Stack**
```
Frontend: React 18 + TypeScript + Vite + Tailwind CSS
Backend: Node.js + Express + TypeScript + Socket.IO
Database: MongoDB + Redis (caching)
AI Services: OpenRouter (LLM) + RunPod (Image Generation) + Deepgram (Voice)
Storage: Cloudinary + Bunny CDN
Deployment: Docker + Railway/Vercel
```

### **Architecture Overview**
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React SPA     │    │   Nginx Proxy   │    │  Node.js API    │
│   (Frontend)    │◄──►│   (Gateway)     │◄──►│   (Backend)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Socket.IO     │    │   Rate Limiting │    │   MongoDB       │
│   (Real-time)   │    │   & Security    │    │   (Database)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │                       │
                                │                       │
                                ▼                       ▼
                       ┌─────────────────┐    ┌─────────────────┐
                       │   Redis Cache   │    │   AI Services   │
                       │   (Performance) │    │ (OpenRouter/    │
                       └─────────────────┘    │  RunPod/Deepgram)│
                                              └─────────────────┘
```

##  **Project Structure**

```
MedusaFriendly/
├── client/                 # React frontend application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Application pages
│   │   ├── hooks/          # Custom React hooks
│   │   ├── types/          # TypeScript type definitions
│   │   └── utils/          # Utility functions
│   ├── public/             # Static assets
│   └── dist/               # Build output
├── server/                 # Node.js backend application
│   ├── controllers/        # Request handlers
│   ├── services/           # Business logic services
│   ├── routes/             # API route definitions
│   ├── middleware/         # Express middleware
│   ├── db/                 # Database models and connections
│   ├── config/             # Configuration files
│   └── scripts/            # Utility scripts
├── shared/                 # Shared types and utilities
├── documentation/          # Project documentation
├── docker-compose.yml      # Docker orchestration
├── Dockerfile.*           # Docker build configurations
└── package.json           # Root package configuration
```

##  **Quick Start**

### **Prerequisites**
- Node.js 20+ and npm
- MongoDB database
- Docker (optional, for containerized deployment)

### **1. Clone and Install**
```bash
git clone <repository-url>
cd MedusaFriendly
npm install
```

### **2. Environment Setup**
```bash
# Copy environment templates
cp env.template .env
cp client/env.template client/.env

# Edit .env files with your configuration
# See Environment Variables section below
```

### **3. Start Development**
```bash
# Start both frontend and backend
npm run dev

# Or start individually
npm run dev:client  # Frontend only
npm run dev:server  # Backend only
```

### **4. Access Application**
- Frontend: http://localhost:5173
- Backend API: http://localhost:5002
- Health Check: http://localhost:5002/health

##  **Environment Variables**

### **Root .env**
```bash
# Database
MONGODB_URI=mongodb://localhost:27017/medusavr
DB_NAME=medusavr

# Authentication
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}
JWT_SECRET=your-jwt-secret

# AI Services
OPENROUTER_API_KEY=your-openrouter-key
RUNPOD_WEBUI_URL=https://your-runpod-url.proxy.runpod.net
DEEPGRAM_API_KEY=your-deepgram-key

# Storage
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Redis (for caching)
REDIS_URL=redis://localhost:6379

# Security
CSRF_SECRET=your-csrf-secret
SESSION_SECRET=your-session-secret
```

### **Client .env**
```bash
# API Configuration
VITE_API_URL=http://localhost:5002
VITE_DEV_API_URL=http://localhost:5002

# Firebase (for authentication)
VITE_FIREBASE_API_KEY=your-firebase-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
VITE_FIREBASE_MEASUREMENT_ID=your-measurement-id

# Cloudinary (for image uploads)
VITE_CLOUDINARY_CLOUD_NAME=your-cloud-name
VITE_CLOUDINARY_UPLOAD_PRESET=your-upload-preset

# Environment
VITE_APP_ENV=development
```

## 🐳 **Docker Deployment**

### **Development**
```bash
# Start development environment
docker compose -f docker-compose.dev.yml up --build -d

# Check status
docker compose -f docker-compose.dev.yml ps

# View logs
docker compose -f docker-compose.dev.yml logs -f

# Stop services
docker compose -f docker-compose.dev.yml down
```

### **Production**
```bash
# Note: Production Docker files were removed during cleanup
# Use Railway/Vercel deployment instead (see Deployment section)
```

### **Health Check**
```bash
# Backend health check
curl http://localhost:5002/health

# Frontend check
curl -I http://localhost:5173
```

### **Access Points**
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5002
- **Health Check**: http://localhost:5002/health

##  **Development Scripts**

### **Available Commands**
```bash
# Development
npm run dev              # Start both frontend and backend
npm run dev:client       # Start frontend only
npm run dev:server       # Start backend only

# Building
npm run build            # Build both frontend and backend
npm run build:client     # Build frontend only
npm run build:server     # Build backend only

# Testing
npm run test             # Run unit tests
npm run test:security    # Run security tests
npm run check            # TypeScript type checking

# Database
npm run db:push          # Push database schema changes

# Character Generation
npm run generate-character    # Generate single character
npm run fast-generate        # Fast character generation
npm run generate-batch       # Batch character generation

# Utilities
npm run reset            # Clean build cache and restart
npm run migrate          # Run data migrations
```

##  **Core Features Deep Dive**

### **1. AI Character Chat**
- **Real-time Communication**: WebSocket-based chat with sub-100ms latency
- **Character Memory**: Persistent conversation history and context
- **Personality Customization**: Unique character traits and behaviors
- **Multi-modal Responses**: Text, images, and voice integration

### **2. Image Generation**
- **High-Quality Output**: 1024x1536 resolution with advanced models
- **Character Consistency**: Maintains character appearance across generations
- **Style Options**: Multiple art styles and LoRA model support
- **Batch Processing**: Generate multiple images efficiently

### **3. Character Creation**
- **Custom Personalities**: Define character traits, backstories, and behaviors
- **Visual Customization**: Avatar generation and appearance settings
- **Embedding System**: Semantic search and recommendation engine
- **Template System**: Pre-built character templates for quick creation

### **4. Voice Integration**
- **Real-time Voice Calls**: Socket.IO-based voice communication
- **Deepgram Integration**: High-quality speech-to-text and text-to-speech
- **Voice Customization**: Character-specific voice settings
- **Call Management**: Session handling and connection optimization

##  **Security Features**

### **Authentication & Authorization**
- Firebase-based user authentication
- JWT token management
- Role-based access control
- Session management with Redis

### **Content Security**
- CSRF protection
- Rate limiting (API and authentication)
- Content filtering and moderation
- Age verification for mature content

### **Data Protection**
- Input sanitization and validation
- Secure file upload handling
- Database query protection
- Environment variable security

### **Network Security**
- HTTPS enforcement
- Security headers (CSP, HSTS, etc.)
- CORS configuration
- Request size limits

##  **Performance Optimizations**

### **Caching Strategy**
- **Redis Caching**: 99% performance improvement for character data
- **Frontend Caching**: React Query with optimized stale times
- **Image Caching**: CDN-based image delivery
- **API Response Caching**: Intelligent cache invalidation

### **Database Optimization**
- **Indexing**: Optimized MongoDB indexes
- **Connection Pooling**: Efficient database connections
- **Query Optimization**: Reduced database load
- **Embedding Storage**: Vector-based search optimization

### **Frontend Performance**
- **Code Splitting**: Lazy loading of components
- **Image Optimization**: WebP format and lazy loading
- **Bundle Optimization**: Tree shaking and minification
- **CDN Integration**: Global content delivery

##  **Testing**

### **Test Structure**
```
testing/
├── unit/                 # Unit tests
├── integration/          # Integration tests
├── security/             # Security tests
└── e2e/                  # End-to-end tests
```

### **Running Tests**
```bash
npm run test              # Unit tests
npm run test:security     # Security audit
npm run test:integration  # Integration tests
```

##  **Monitoring & Analytics**

### **Health Monitoring**
- Application health checks
- Database connection monitoring
- Redis cache status
- AI service availability

### **Performance Metrics**
- Response time tracking
- Cache hit rates
- Error rate monitoring
- User engagement analytics

##  **Deployment**

### **Production Deployment**
1. **Railway (Backend)**: Automated deployment with environment variables
2. **Vercel (Frontend)**: Static site deployment with edge functions
3. **MongoDB Atlas**: Managed database service
4. **Redis Cloud**: Managed caching service

### **Environment Configuration**
- Production environment variables
- SSL certificate setup
- Domain configuration
- CDN setup for static assets

##  **Contributing**

### **Development Workflow**
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

### **Code Standards**
- TypeScript for type safety
- ESLint for code quality
- Prettier for code formatting
- Conventional commits for changelog

##  **Documentation**

### **Available Documentation**
- [Setup Guide](SETUP_README.md) - Detailed setup instructions
- [Deployment Guide](DEPLOYMENT_GUIDE.md) - Production deployment
- [API Documentation](documentation/) - API reference
- [Security Guide](SECURITY.md) - Security best practices

### **Architecture Documentation**
- [System Overview](documentation/SYSTEM_OVERVIEW.md)
- [Character Generation Guide](documentation/CHARACTER_GENERATION_GUIDE.md)
- [Research Paper](documentation/research/MedusaVR_Research_Paper.md)

##  **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

##  **Support**

### **Getting Help**
- Check the [documentation](documentation/) for detailed guides
- Review [common issues](documentation/troubleshooting.md)
- Open an issue for bugs or feature requests

### **Community**
- Join our Discord community
- Follow updates on Twitter
- Contribute to the project

---

**MedusaVR** - *Transforming AI interactions with real-time, multi-modal experiences*

Built using React, Node.js, and cutting-edge AI technologies.
