import express from "express";
import path from "path";
import cors from "cors";
import cookieParser from "cookie-parser";
import { OAuth2Client } from 'google-auth-library';
import { CharacterModel } from "./db/models/CharacterModel.js";
import characterRouter from "./routes/character.js";
import creatorRouter from "./routes/creators.js";
import userRouter from "./routes/users.js";
import chatRouter from "./routes/chats.js";
import followRouter from "./routes/follows.js";
import authRouter from "./routes/auth.js";
import uploadRouter from "./routes/upload.js";
import tagRouter from "./routes/tags.js";
import favoritesRouter from "./routes/favorites.js";
import conversationsRouter from "./routes/conversations.js";
import messagesRouter from "./routes/messages.js";
import userGalleryRouter from "./routes/userGallery.js";
// import cryptoPaymentsRouter from "./routes/cryptoPayments";
import imageGenerationRouter from "./routes/imageGeneration.js";
import subscriptionRouter from "./routes/subscriptions.js";
import commentRouter from "./routes/comments.js";
import testRouter from "./routes/test.js";
import testCloudinaryUploadRouter from "./routes/testCloudinaryUpload.js";
import testImageIndexRouter from "./routes/testImageIndex.js";
import coinsRouter from "./routes/coins.js";
import voiceRouter from "./routes/voice.js";
import sitemapRouter from "./routes/sitemap.js";
import wordStatsRouter from "./routes/wordStats.js";
import securityRouter from "./routes/security.js";
import { v2 as cloudinary } from "cloudinary";
import multer from "multer";
import { autoProcessMonthlyAllowance } from "./middleware/autoAllowance.js";
import dotenv from "dotenv";
import { setupSocket } from './config/socket.js';
import { fileURLToPath } from 'url';
// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Security middleware imports
import { securityHeaders, generalLimiter, authLimiter, uploadLimiter, chatLimiter, mongoSanitizer, parameterPollutionProtection, compressionMiddleware, customSecurityHeaders, requestSizeLimiter, suspiciousActivityDetector, apiKeyValidator, dosProtection, secureErrorHandler, validateEnvironment, conditionalCsrfProtection, sanitizeInput } from "./middleware/security.js";
// Import new security middleware
import { validateRedirects } from "./middleware/redirectValidation.js";
import { sessionRotation, validateSessionSecurity } from "./middleware/secureSession.js";
import { cacheService } from "./services/CacheService.js";
dotenv.config();
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});
// Use memory storage for multer (we'll upload to Cloudinary manually)
const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
    },
    fileFilter: (req, file, cb) => {
        // Check file type
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        }
        else {
            cb(new Error('Only image files are allowed'));
        }
    }
});
export function buildApp() {
    const app = express();
    // Trust the first proxy in front of the app (e.g., Nginx)
    app.set('trust proxy', 1);
    // Security middleware - order matters!
    // 0. Environment validation (first)
    app.use(validateEnvironment);
    // 1. DoS protection (first line of defense)
    app.use(dosProtection);
    // 2. Compression (early for performance)
    app.use(compressionMiddleware);
    // 3. Security headers
    app.use(securityHeaders);
    app.use(customSecurityHeaders);
    // 4. Request size limiting
    app.use(requestSizeLimiter);
    // 5. Rate limiting (general)
    app.use(generalLimiter);
    // 5.5 Log request origin (for debugging)
    app.use((req, res, next) => {
        console.log("Request Origin:", req.headers.origin);
        next();
    });
    // 6. CORS
    app.use(cors({
        origin: function (origin, callback) {
            // Allow requests with no origin (like mobile apps or curl requests)
            if (!origin)
                return callback(null, true);
            console.log(`🌐 CORS request from origin: ${origin}`);
            const allowedOrigins = [
                "http://localhost",
                "http://localhost:5173",
                "http://localhost:5174",
                "http://localhost:5175",
                "http://localhost:3000",
                "http://3.135.203.99",
                "https://medusavr.art",
                "https://www.medusavr.art",
                "http://medusavr.art",
                "http://www.medusavr.art",
                "https://vrfansbackend.up.railway.app",
                process.env.FRONTEND_URL || ""
            ];
            // Allow any Vercel domain
            const isVercelDomain = origin.endsWith('.vercel.app');
            if (allowedOrigins.includes(origin) || isVercelDomain) {
                console.log(`✅ CORS allowed for origin: ${origin}`);
                return callback(null, true);
            }
            console.log(`❌ CORS blocked for origin: ${origin}`);
            console.log(`📝 Allowed origins:`, allowedOrigins);
            return callback(new Error('Not allowed by CORS'));
        },
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-CSRF-Token', 'X-XSRF-Token'],
        exposedHeaders: ['X-Total-Count', 'X-Page-Count'],
    }));
    // 7. Cookie parser for session management
    app.use(cookieParser());
    // 8. Body parsing with security (exclude webhook route from JSON parsing)
    app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));
    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true, limit: '10mb' }));
    // 9. Input sanitization
    app.use(mongoSanitizer);
    app.use(parameterPollutionProtection);
    app.use(sanitizeInput); // Enhanced DOMPurify sanitization
    // 10. CSRF token endpoint (needs special handling - no CSRF protection needed)
    app.get('/api/csrf-token', (req, res, next) => {
        // Generate a CSRF token first
        conditionalCsrfProtection(req, res, (err) => {
            if (err) {
                return next(err);
            }
            // Return the generated token
            res.json({ csrfToken: req.csrfToken() });
        });
    });
    // 11. Redirect validation
    app.use(validateRedirects);
    // 12. Session security
    app.use(sessionRotation);
    app.use(validateSessionSecurity);
    // 13. Suspicious activity detection
    app.use(suspiciousActivityDetector);
    // 14. API key validation for admin routes
    app.use(apiKeyValidator);
    // 15. Auto-process monthly allowances for authenticated users
    app.use('/api', autoProcessMonthlyAllowance);
    // 16. Request logging (after security checks)
    app.use((req, res, next) => {
        const timestamp = new Date().toISOString();
        const ip = req.ip || req.connection.remoteAddress || 'unknown';
        const authHeader = req.headers.authorization;
        console.log(`[${timestamp}] ${req.method} ${req.url} - ${ip} - Auth: ${authHeader ? 'Bearer ***' : 'None'}`);
        next();
    });
    // Serve static files from public directory
    app.use(express.static(path.join(__dirname, 'public')));
    // ===== CACHE HEALTH AND METRICS ENDPOINTS =====
    app.get('/api/cache/health', async (req, res) => {
        try {
            const health = await cacheService.healthCheck();
            res.json({
                cache: health,
                timestamp: new Date().toISOString()
            });
        }
        catch (error) {
            console.warn('⚠️ Cache health check error:', error);
            res.status(500).json({ error: 'Cache health check failed' });
        }
    });
    app.get('/api/cache/metrics', (req, res) => {
        try {
            const metrics = cacheService.getMetrics();
            res.json({
                cache: metrics,
                timestamp: new Date().toISOString()
            });
        }
        catch (error) {
            console.warn('⚠️ Cache metrics error:', error);
            res.status(500).json({ error: 'Failed to retrieve cache metrics' });
        }
    });
    app.delete("/api/characters/:id/avatar", async (req, res, next) => {
        try {
            const id = Number(req.params.id);
            const char = await CharacterModel.findOne({ id });
            if (!char?.avatar)
                return res.sendStatus(404);
            const publicId = `characters_${id}`;
            await cloudinary.uploader.destroy(publicId);
            await CharacterModel.updateOne({ id }, { $unset: { avatar: "" } });
            res.json({ message: "Avatar deleted from Cloudinary" });
        }
        catch (err) {
            next(err);
        }
    });
    //Upload to Cloudinary
    app.post("/api/characters/:id/avatar", upload.single("avatar"), async (req, res, next) => {
        try {
            const id = Number(req.params.id);
            if (!req.file) {
                return res.status(400).json({ message: "No file uploaded" });
            }
            // Upload buffer to Cloudinary
            const uploadResult = await new Promise((resolve, reject) => {
                cloudinary.uploader.upload_stream({
                    folder: "character_avatars",
                    public_id: `character_${id}`,
                    allowed_formats: ["jpg", "jpeg", "png"]
                }, (error, result) => {
                    if (error)
                        reject(error);
                    else
                        resolve(result);
                }).end(req.file.buffer);
            });
            const url = uploadResult.secure_url;
            await CharacterModel.updateOne({ id }, { avatar: url });
            res.json({ message: "Avatar uploaded to Cloudinary", url });
        }
        catch (err) {
            next(err);
        }
    });
    // // Serve avatar from MongoDB
    // app.get(
    //   "/api/characters/:id/avatar",
    //   async (req: Request, res: Response, next: NextFunction) => {
    //     try {
    //       const id = Number(req.params.id);
    //       const char = await CharacterModel.findOne({ id });
    //       if (!char?.avatar) return res.sendStatus(404);
    //       res.redirect(char.avatar); // Cloudinary serves it
    //     } catch (err) {
    //       next(err);
    //     }
    //   }
    // );
    // Mount REST routers under /api with specific rate limiting
    app.use("/api/characters", characterRouter);
    app.use("/api/creators", creatorRouter);
    app.use("/api/users", userRouter);
    app.use("/api/chats", chatLimiter, chatRouter);
    app.use("/api/follows", followRouter);
    // Auth routes - CSRF protection temporarily disabled for production debugging
    app.use("/api/auth", authLimiter, authRouter);
    app.use("/api/upload", uploadLimiter, uploadRouter); // Temporarily disable CSRF for upload in development
    app.use("/api/tags", tagRouter);
    app.use("/api/conversations", conversationsRouter);
    app.use("/api/messages", messagesRouter);
    app.use("/api/user-gallery", userGalleryRouter);
    app.use("/api/word-stats", wordStatsRouter);
    app.use("/api/subscriptions", subscriptionRouter);
    app.use("/api/coins", coinsRouter);
    app.use("/api/voice", voiceRouter);
    app.use("/api", commentRouter);
    // SEO routes - no rate limiting for search engines
    app.use("/", sitemapRouter);
    app.use("/api/image-generation", uploadLimiter, imageGenerationRouter);
    // Debug logging for favorites router
    console.log("Mounting favorites router at /api/favorites");
    app.use("/api/favorites", favoritesRouter);
    console.log("Favorites router mounted successfully");
    // Test endpoints for character generation
    app.use("/api/test", testRouter);
    app.use("/api/test-cloudinary", testCloudinaryUploadRouter);
    app.use("/api/test-image-index", testImageIndexRouter);
    // Security endpoints (CSP reporting, etc.)
    app.use("/api/security", securityRouter);
    // Health checks (no rate limiting needed)
    app.get("/health", (_req, res) => res.sendStatus(204));
    app.get("/api/health", (_req, res) => res.json({
        status: "ok",
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    }));
    // Debug endpoint to test API routing
    app.get("/api/test", (_req, res) => {
        res.json({
            message: "API is working!",
            timestamp: new Date().toISOString(),
            routes: [
                "/api/characters",
                "/api/creators",
                "/api/users",
                "/api/chats",
                "/api/follows",
                "/api/auth",
                "/api/upload",
                "/api/tags",
                "/api/favorites",
            ]
        });
    });
    // Handle 404 for API routes
    app.use("/api/*", (_req, res) => {
        res.status(404).json({
            error: "API endpoint not found",
            message: "The requested API endpoint does not exist"
        });
    });
    // Global error handler (security-aware)
    app.use(secureErrorHandler);
    return app;
}
// Socket.IO server setup function
export function setupWebSocketServer(server) {
    return setupSocket(server);
}
