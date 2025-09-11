import helmet from "helmet";
import rateLimit from "express-rate-limit";
import mongoSanitize from "express-mongo-sanitize";
import hpp from "hpp";
import compression from "compression";
import csrf from "csurf";
import DOMPurify from "isomorphic-dompurify";
export const securityHeaders = helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            frameSrc: [
                "'self'",
                "https://*.firebaseapp.com",
                "https://*.web.app",
                "https://accounts.google.com",
                "https://content.googleapis.com",
                "https://www.google.com"
            ],
            styleSrc: [
                "'self'",
                "'unsafe-inline'",
                "https://fonts.googleapis.com",
                "https://cdn.jsdelivr.net"
            ],
            fontSrc: [
                "'self'",
                "https://fonts.gstatic.com",
                "https://cdn.jsdelivr.net"
            ],
            imgSrc: [
                "'self'",
                "data:",
                "https:",
                "http:",
                "https://res.cloudinary.com", // Cloudinary images
                "https://images.unsplash.com" // Sample images
            ],
            scriptSrc: [
                "'self'",
                "'unsafe-inline'", // Allow inline scripts for Google Tag Manager
                process.env.NODE_ENV === "development" ? "'unsafe-eval'" : "", // Vite HMR in dev
                "https://cdn.jsdelivr.net",
                "https://apis.google.com",
                "https://www.gstatic.com",
                "https://www.googletagmanager.com"
            ].filter(Boolean),
            scriptSrcElem: [
                "'self'",
                "'unsafe-inline'",
                "https://cdn.jsdelivr.net",
                "https://apis.google.com",
                "https://www.gstatic.com",
                "https://www.googletagmanager.com"
            ],
            connectSrc: [
                "'self'",
                process.env.NODE_ENV === "development" ? "ws://localhost:*" : "", // Vite HMR websocket
                "https://api.cloudinary.com",
                "https://identitytoolkit.googleapis.com",
                "https://securetoken.googleapis.com",
                "https://www.googleapis.com",
                "https://www.google-analytics.com"
            ].filter(Boolean),
            objectSrc: ["'none'"],
            upgradeInsecureRequests: process.env.NODE_ENV === "production" ? [] : null,
        },
    },
    crossOriginEmbedderPolicy: false, // Disable for better compatibility
});
// Enhanced rate limiting configurations that are more user-friendly
export const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: process.env.NODE_ENV === "development" ? 10000 : 1000, // Much higher limits
    message: {
        error: "You're making requests too quickly. Please slow down a bit.",
    },
    standardHeaders: true, // Return rate limit info in headers
    legacyHeaders: false, // Disable legacy headers
    // Enhanced skip function for better UX
    skip: (req) => {
        // Skip rate limiting for health checks and static assets
        if (req.path === '/health' || req.path === '/api/health') {
            return true;
        }
        // Skip rate limiting for job status polling to prevent rate limit issues
        if (req.path.includes('/api/image-generation/jobs/') && req.method === 'GET') {
            return true;
        }
        // Be more lenient with GET requests (reading data)
        if (req.method === 'GET') {
            return false; // Still apply limits but they're higher
        }
        return false;
    },
    // Custom key generator to be more lenient with localhost
    keyGenerator: (req) => {
        const ip = req.ip || 'unknown';
        // Be more lenient with localhost/development
        if (process.env.NODE_ENV === "development" &&
            (ip === '127.0.0.1' || ip === '::1' || ip.startsWith('192.168.'))) {
            return `dev-${ip}`;
        }
        return ip;
    }
});
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: process.env.NODE_ENV === "development" ? 100 : 10, // More attempts in dev
    message: {
        error: "Too many authentication attempts, please try again later.",
    },
    skipSuccessfulRequests: true, // Don't count successful requests
});
export const uploadLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: process.env.NODE_ENV === "development" ? 100 : 20, // More uploads in dev
    message: {
        error: "Too many upload attempts, please try again later.",
    },
});
export const chatLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: process.env.NODE_ENV === "development" ? 100 : 30, // More messages in dev
    message: {
        error: "Too many messages, please slow down.",
    },
});
// Existing middleware (unchanged)
export const mongoSanitizer = mongoSanitize({
    replaceWith: "_",
    onSanitize: ({ req, key }) => {
        console.warn(`⚠️  Sanitized key: ${key} from IP: ${req.ip}`);
    },
});
export const parameterPollutionProtection = hpp({
    whitelist: ["tags", "categories"], // Allow arrays for these parameters
});
// CSRF Protection Configuration
export const csrfProtection = csrf({
    cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? 'none' : 'strict',
        maxAge: 3600000, // 1 hour
    },
    sessionKey: 'session',
    value: (req) => {
        // Allow CSRF token from header or body
        return req.headers['x-csrf-token'] ||
            req.headers['x-xsrf-token'] ||
            req.body._csrf;
    },
    ignoreMethods: ['GET', 'HEAD', 'OPTIONS'],
});
// Custom CSRF middleware that skips CSRF for authenticated upload requests
export const conditionalCsrfProtection = (req, res, next) => {
    // Skip CSRF for upload requests in development
    if (process.env.NODE_ENV === 'development' && req.path.startsWith('/api/upload/')) {
        console.log('🛡️ Skipping CSRF for upload request in development:', req.path);
        return next();
    }
    // Apply CSRF protection for all other requests
    return csrfProtection(req, res, next);
};
// CSRF token endpoint middleware
export const provideCsrfToken = (req, res, next) => {
    if (req.path === '/api/csrf-token' && req.method === 'GET') {
        return res.json({ csrfToken: req.csrfToken() });
    }
    next();
};
// Input sanitization middleware using DOMPurify
export const sanitizeInput = (req, res, next) => {
    const sanitizeObject = (obj) => {
        if (typeof obj === 'string') {
            return DOMPurify.sanitize(obj);
        }
        if (Array.isArray(obj)) {
            return obj.map(sanitizeObject);
        }
        if (obj && typeof obj === 'object') {
            const sanitized = {};
            for (const key in obj) {
                if (obj.hasOwnProperty(key)) {
                    sanitized[key] = sanitizeObject(obj[key]);
                }
            }
            return sanitized;
        }
        return obj;
    };
    // Sanitize request body
    if (req.body) {
        req.body = sanitizeObject(req.body);
    }
    // Sanitize query parameters
    if (req.query) {
        req.query = sanitizeObject(req.query);
    }
    next();
};
export const compressionMiddleware = compression({
    level: 6, // Compression level (1-9)
    threshold: 1024, // Only compress if response is larger than 1KB
    filter: (req, res) => {
        if (req.headers["x-no-compression"]) {
            return false;
        }
        return compression.filter(req, res);
    },
});
export const customSecurityHeaders = (req, res, next) => {
    res.removeHeader("X-Powered-By");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("X-XSS-Protection", "1; mode=block");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
    // Add HSTS header for production
    if (process.env.NODE_ENV === "production") {
        res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
    }
    // Set appropriate cache headers for API responses
    if (req.path.startsWith("/api/")) {
        res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
        res.setHeader("Pragma", "no-cache");
        res.setHeader("Expires", "0");
    }
    next();
};
export const corsSecurityCheck = (req, res, next) => {
    const origin = req.headers.origin;
    const userAgent = req.headers['user-agent'] || '';
    // Log suspicious requests
    if (origin && !origin.includes('localhost') && !origin.includes('vercel.app') && process.env.NODE_ENV === 'development') {
        console.warn(`⚠️  Suspicious origin in development: ${origin} from ${req.ip}`);
    }
    // Block requests from known bad user agents
    const suspiciousAgents = ['curl/7.', 'wget/', 'python-requests/', 'bot'];
    const isSuspicious = suspiciousAgents.some(agent => userAgent.toLowerCase().includes(agent));
    if (isSuspicious && process.env.NODE_ENV === 'production') {
        console.warn(`⚠️  Blocked suspicious user agent: ${userAgent} from ${req.ip}`);
        return res.status(403).json({ error: 'Access denied' });
    }
    next();
};
// Request size limits
export const requestSizeLimiter = (req, res, next) => {
    const contentLength = req.headers['content-length'];
    const maxSize = 10 * 1024 * 1024; // 10MB limit
    if (contentLength && parseInt(contentLength) > maxSize) {
        return res.status(413).json({
            error: 'Request entity too large',
            maxSize: '10MB'
        });
    }
    next();
};
// Enhanced suspicious activity detector
export const suspiciousActivityDetector = (req, res, next) => {
    const suspiciousPatterns = [
        /(<script|javascript:|vbscript:|onload=|onerror=)/i,
        /(union.*select|drop.*table|delete.*from)/i,
        /(\.\.\/|\.\.\\|%2e%2e%2f|%2e%2e\\)/i,
        /(eval\(|expression\(|setTimeout\(|setInterval\()/i,
    ];
    const requestData = JSON.stringify({
        url: req.url,
        params: req.params,
        query: req.query,
        body: req.body
    });
    for (const pattern of suspiciousPatterns) {
        if (pattern.test(requestData)) {
            console.warn(`🚨 Suspicious activity detected from IP ${req.ip}: ${req.method} ${req.url}`);
            console.warn(`🚨 Pattern matched: ${pattern}`);
            return res.status(400).json({
                error: 'Invalid request detected'
            });
        }
    }
    next();
};
// Admin API key validation
export const apiKeyValidator = (req, res, next) => {
    if (req.path.startsWith('/api/admin/')) {
        const apiKey = req.headers['x-api-key'];
        const validApiKey = process.env.ADMIN_API_KEY;
        if (!apiKey || !validApiKey || apiKey !== validApiKey) {
            return res.status(401).json({
                error: 'Valid API key required for admin endpoints'
            });
        }
    }
    next();
};
// Enhanced DoS protection that's more intelligent
const requestTimes = new Map();
export const dosProtection = (req, res, next) => {
    const ip = req.ip || 'unknown';
    const now = Date.now();
    const timeWindow = 60 * 1000; // 1 minute
    // Much higher limits, especially for development
    const maxRequests = process.env.NODE_ENV === "development" ? 1000 : 500;
    if (!requestTimes.has(ip)) {
        requestTimes.set(ip, []);
    }
    const times = requestTimes.get(ip);
    // Remove old timestamps
    const recentTimes = times.filter(time => now - time < timeWindow);
    if (recentTimes.length >= maxRequests) {
        console.warn(`🚨 Potential DoS attack from IP: ${ip} (${recentTimes.length} requests in last minute)`);
        return res.status(429).json({
            error: 'Too many requests - please slow down'
        });
    }
    recentTimes.push(now);
    requestTimes.set(ip, recentTimes);
    // Cleanup old entries periodically
    if (Math.random() < 0.01) { // 1% chance to cleanup
        for (const [ip, times] of Array.from(requestTimes.entries())) {
            const recentTimes = times.filter((time) => now - time < timeWindow);
            if (recentTimes.length === 0) {
                requestTimes.delete(ip);
            }
            else {
                requestTimes.set(ip, recentTimes);
            }
        }
    }
    next();
};
// Secure error handling middleware
export const secureErrorHandler = (err, req, res, next) => {
    // Log the full error for debugging
    console.error('🚨 Error occurred:', {
        message: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
        url: req.url,
        method: req.method,
        ip: req.ip,
        userAgent: req.headers['user-agent']
    });
    // Don't expose sensitive error details in production
    const isDevelopment = process.env.NODE_ENV === 'development';
    let statusCode = err.statusCode || err.status || 500;
    let message = 'Internal server error';
    // Only show detailed errors in development
    if (isDevelopment) {
        message = err.message || message;
    }
    else {
        // In production, only show safe error messages
        switch (statusCode) {
            case 400:
                message = 'Bad request';
                break;
            case 401:
                message = 'Unauthorized';
                break;
            case 403:
                message = 'Forbidden';
                break;
            case 404:
                message = 'Not found';
                break;
            case 422:
                message = 'Invalid input';
                break;
            case 429:
                message = 'Too many requests';
                break;
            default:
                message = 'Internal server error';
                statusCode = 500;
        }
    }
    res.status(statusCode).json({
        error: message,
        ...(isDevelopment && { stack: err.stack })
    });
};
// Environment validation middleware
export const validateEnvironment = (req, res, next) => {
    const requiredEnvVars = ['JWT_SECRET', 'MONGODB_URI'];
    const missing = requiredEnvVars.filter(env => !process.env[env]);
    if (missing.length > 0 && process.env.NODE_ENV === 'production') {
        console.error('🚨 Missing required environment variables:', missing);
        return res.status(500).json({
            error: 'Server configuration error'
        });
    }
    // Check for weak JWT secret
    if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
        console.warn('⚠️  JWT_SECRET is too short - should be at least 32 characters');
    }
    next();
};
