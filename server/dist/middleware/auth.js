import jwt from "jsonwebtoken";
import { UserModel } from "../db/models/UserModel.js";
import rateLimit from "express-rate-limit";
import * as dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
// ES module compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
// Load environment variables from the parent directory if not already loaded
if (!process.env.JWT_SECRET) {
    dotenv.config({ path: path.join(__dirname, '../../.env') });
}
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-this-in-production";
// how many times a user can try to authenticate and fail
export const authRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 3, // 3 attempts per window
    message: {
        error: "Too many authentication attempts. Please try again later.",
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true,
});
// someone trying to enter a vip room without being authenticated
export async function requireAuth(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
        const userAgent = req.headers['user-agent'] || 'unknown';
        console.log(`🔍 AUTH DEBUG - ${req.method} ${req.path}`);
        console.log(`🔍 AUTH DEBUG - Authorization header:`, authHeader ? 'present' : 'missing');
        console.log(`🔍 AUTH DEBUG - Full auth header:`, authHeader);
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            console.warn(`🔒 Unauthorized access attempt from ${ipAddress} - ${userAgent}`);
            console.warn(`🔒 Missing or invalid auth header:`, authHeader);
            return res.status(401).json({ error: "User not authenticated" });
        }
        const token = authHeader.substring(7); // Remove 'Bearer ' prefix
        console.log(`🔍 AUTH DEBUG - Token (first 20 chars):`, token.substring(0, 20) + '...');
        // Verify token with enhanced error handling
        let decoded;
        try {
            decoded = jwt.verify(token, JWT_SECRET);
            console.log(`🔍 AUTH DEBUG - Token decoded successfully:`, { userId: decoded.userId, type: decoded.type });
        }
        catch (jwtError) {
            console.warn(`🔒 Invalid JWT from ${ipAddress}: ${jwtError.message}`);
            return res.status(401).json({ error: "Invalid or expired token" });
        }
        if (decoded.type === 'refresh') {
            console.warn(`🔒 Refresh token used for access from ${ipAddress}`);
            return res.status(401).json({ error: "Invalid token type" });
        }
        // Check if user still exists
        const user = await UserModel.findById(decoded.userId);
        if (!user) {
            console.warn(`🔒 Token for non-existent user from ${ipAddress}: ${decoded.userId}`);
            return res.status(401).json({ error: "User not found" });
        }
        // Check if user is banned
        if (user.banInfo && user.banInfo.isActive) {
            const banInfo = user.banInfo;
            console.warn(`🚫 Banned user access attempt: ${user.email} (${user.username}) from ${ipAddress}`);
            console.warn(`🚫 Ban type: ${banInfo.banType}, Reason: ${banInfo.banReason}`);
            // For permanent bans, return a more specific error
            if (banInfo.banType === 'permanent') {
                return res.status(403).json({
                    error: "Account permanently banned",
                    banType: "permanent",
                    reason: banInfo.banReason || "Severe content violations",
                    message: "Your account has been permanently banned for severe content violations. All access has been revoked."
                });
            }
            // For temporary bans, check if they've expired
            if (banInfo.banExpiresAt && new Date() < banInfo.banExpiresAt) {
                return res.status(403).json({
                    error: "Account temporarily banned",
                    banType: "temporary",
                    reason: banInfo.banReason || "Content violations",
                    expiresAt: banInfo.banExpiresAt,
                    message: `Your account is temporarily banned until ${banInfo.banExpiresAt.toISOString()}`
                });
            }
            // If ban has expired, update the user's ban status
            if (banInfo.banExpiresAt && new Date() >= banInfo.banExpiresAt) {
                await UserModel.findByIdAndUpdate(user._id, {
                    'banInfo.isActive': false,
                    'banInfo.unbannedAt': new Date()
                });
                console.log(`✅ Ban expired for user: ${user.email}, access restored`);
            }
        }
        console.log(`✅ AUTH DEBUG - User authenticated:`, { userId: user._id, email: user.email });
        // Add security context to request
        req.userId = decoded.userId;
        req.user = user;
        req.ipAddress = ipAddress;
        req.userAgent = userAgent;
        // Log successful authentication for security monitoring
        if (Math.random() < 0.1) { // Log 10% of successful auths to avoid spam
            console.log(`✅ Authenticated user: ${user.email} from ${ipAddress}`);
        }
        next();
    }
    catch (error) {
        console.error("🚨 Auth middleware error:", error);
        return res.status(401).json({
            error: "Authentication failed",
            timestamp: new Date().toISOString()
        });
    }
}
//browse the website without login
export async function optionalAuth(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.substring(7);
            try {
                const decoded = jwt.verify(token, JWT_SECRET);
                if (decoded.type !== 'refresh') {
                    const user = await UserModel.findById(decoded.userId);
                    if (user) {
                        // Check if user is banned (but don't block access for optional auth)
                        if (user.banInfo && user.banInfo.isActive) {
                            console.warn(`🚫 Banned user using optional auth: ${user.email} (${user.username})`);
                            // Don't set user data for banned users in optional auth
                        }
                        else {
                            req.userId = decoded.userId;
                            req.user = user;
                            req.ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
                            req.userAgent = req.headers['user-agent'] || 'unknown';
                        }
                    }
                }
            }
            catch (jwtError) {
                // Silently continue without authentication for optional auth
            }
        }
        next();
    }
    catch (error) {
        // Continue without authentication
        next();
    }
}
// club managers this control room
export async function requireAdmin(req, res, next) {
    try {
        if (!req.user) {
            return res.status(401).json({ message: "Authentication required" });
        }
        if (req.user.role !== 'admin') {
            console.warn(`🔒 Non-admin access attempt to admin endpoint: ${req.user.email} from ${req.ipAddress}`);
            return res.status(403).json({ message: "Admin access required" });
        }
        console.log(`🔑 Admin access granted: ${req.user.email} to ${req.path}`);
        next();
    }
    catch (error) {
        console.error("Admin auth middleware error:", error);
        return res.status(500).json({ message: "Authorization failed" });
    }
}
// Creator role check middleware
export async function requireCreator(req, res, next) {
    try {
        if (!req.user) {
            return res.status(401).json({ message: "Authentication required" });
        }
        if (!['creator', 'admin'].includes(req.user.role)) {
            console.warn(`🔒 Non-creator access attempt: ${req.user.email} from ${req.ipAddress}`);
            return res.status(403).json({ message: "Creator access required" });
        }
        next();
    }
    catch (error) {
        console.error("Creator auth middleware error:", error);
        return res.status(500).json({ message: "Authorization failed" });
    }
}
// each person has their own room and only they can access it
export function requireOwnership(resourceIdParam = 'id') {
    return async (req, res, next) => {
        try {
            if (!req.user) {
                return res.status(401).json({ message: "Authentication required" });
            }
            const resourceId = req.params[resourceIdParam];
            const userId = req.userId;
            // Admin can access any resource
            if (req.user.role === 'admin') {
                return next();
            }
            // For user resources, check ownership
            if (resourceId !== userId) {
                console.warn(`🔒 Unauthorized resource access: ${req.user.email} tried to access ${resourceId}`);
                return res.status(403).json({ message: "Access denied - not resource owner" });
            }
            next();
        }
        catch (error) {
            console.error("Ownership middleware error:", error);
            return res.status(500).json({ message: "Authorization failed" });
        }
    };
}
// Token blacklist check (for logout functionality)
const blacklistedTokens = new Set();
// you log out, and we blacklist your token
export function blacklistToken(token) {
    blacklistedTokens.add(token);
    // Clean up blacklist periodically (tokens expire anyway)
    if (blacklistedTokens.size > 10000) {
        blacklistedTokens.clear();
    }
}
export function checkBlacklist(req, res, next) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        if (blacklistedTokens.has(token)) {
            return res.status(401).json({ message: "Token has been revoked" });
        }
    }
    next();
}
