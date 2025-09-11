import jwt from 'jsonwebtoken';
import crypto from 'crypto';
// Session security configuration
export const SESSION_CONFIG = {
    JWT_EXPIRES_IN: '24h',
    JWT_REFRESH_EXPIRES_IN: '7d',
    COOKIE_MAX_AGE: 24 * 60 * 60 * 1000,
    REFRESH_COOKIE_MAX_AGE: 7 * 24 * 60 * 60 * 1000, // 7 days
};
// Secure cookie configuration
export const SECURE_COOKIE_CONFIG = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: SESSION_CONFIG.COOKIE_MAX_AGE,
};
// Track active sessions for security monitoring
const activeSessions = new Map();
/**
 * Generate secure JWT tokens with rotation capability
 */
export function generateSecureTokens(userId, options) {
    const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-this-in-production";
    const sessionId = options?.sessionId || generateSessionId();
    const accessTokenPayload = {
        userId,
        sessionId,
        type: 'access',
        iat: Math.floor(Date.now() / 1000),
    };
    const refreshTokenPayload = {
        userId,
        sessionId,
        type: 'refresh',
        iat: Math.floor(Date.now() / 1000),
    };
    const accessToken = jwt.sign(accessTokenPayload, JWT_SECRET, {
        expiresIn: SESSION_CONFIG.JWT_EXPIRES_IN
    });
    const refreshToken = jwt.sign(refreshTokenPayload, JWT_SECRET, {
        expiresIn: SESSION_CONFIG.JWT_REFRESH_EXPIRES_IN
    });
    const expiresAt = new Date(Date.now() + SESSION_CONFIG.COOKIE_MAX_AGE);
    return {
        accessToken,
        refreshToken,
        sessionId,
        expiresAt
    };
}
/**
 * Generate a secure session ID
 */
function generateSessionId() {
    return crypto.randomBytes(32).toString('hex');
}
/**
 * Track session for security monitoring
 */
export function trackSession(sessionId, userId, req) {
    activeSessions.set(sessionId, {
        userId,
        createdAt: new Date(),
        lastActivity: new Date(),
        ipAddress: req.ip || 'unknown',
        userAgent: req.headers['user-agent'] || 'unknown'
    });
    // Clean up old sessions periodically
    if (activeSessions.size > 10000) {
        cleanupOldSessions();
    }
}
/**
 * Update session activity
 */
export function updateSessionActivity(sessionId) {
    const session = activeSessions.get(sessionId);
    if (session) {
        session.lastActivity = new Date();
    }
}
/**
 * Remove session tracking
 */
export function removeSessionTracking(sessionId) {
    activeSessions.delete(sessionId);
}
/**
 * Clean up old sessions
 */
function cleanupOldSessions() {
    const now = new Date();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    for (const [sessionId, session] of activeSessions.entries()) {
        if (now.getTime() - session.lastActivity.getTime() > maxAge) {
            activeSessions.delete(sessionId);
        }
    }
}
/**
 * Session rotation middleware - regenerates tokens periodically
 */
export const sessionRotation = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        try {
            const token = authHeader.substring(7);
            const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-this-in-production";
            const decoded = jwt.verify(token, JWT_SECRET);
            // Check if token is close to expiration (rotate if less than 5 minutes remaining)
            const now = Math.floor(Date.now() / 1000);
            const timeToExpiry = decoded.exp - now;
            if (timeToExpiry < 300 && decoded.type === 'access') { // Less than 5 minutes
                console.log(`🔄 Rotating token for user ${decoded.userId} (${timeToExpiry}s remaining)`);
                // Generate new tokens
                const { accessToken, refreshToken, sessionId, expiresAt } = generateSecureTokens(decoded.userId, { sessionId: decoded.sessionId });
                // Set new token in response headers for client to update
                res.setHeader('X-New-Access-Token', accessToken);
                res.setHeader('X-Token-Rotation', 'true');
                // Update session tracking
                updateSessionActivity(sessionId);
                console.log(`✅ Token rotated successfully for user ${decoded.userId}`);
            }
        }
        catch (error) {
            // Token invalid or expired, let auth middleware handle it
        }
    }
    next();
};
/**
 * Enhanced logout with session cleanup
 */
export const secureLogout = (sessionId) => {
    if (sessionId) {
        removeSessionTracking(sessionId);
    }
    // Additional cleanup could be added here (database session invalidation, etc.)
};
/**
 * Session security middleware - validates session integrity
 */
export const validateSessionSecurity = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        try {
            const token = authHeader.substring(7);
            const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-this-in-production";
            const decoded = jwt.verify(token, JWT_SECRET);
            // Validate session exists and is active
            const session = activeSessions.get(decoded.sessionId);
            if (session) {
                // Check for suspicious activity
                const ipAddress = req.ip || 'unknown';
                const userAgent = req.headers['user-agent'] || 'unknown';
                // Detect IP address changes (potential session hijacking)
                if (session.ipAddress !== ipAddress) {
                    console.warn(`🚨 IP address change detected for session ${decoded.sessionId}: ${session.ipAddress} -> ${ipAddress}`);
                    // In production, you might want to invalidate the session
                    if (process.env.NODE_ENV === 'production') {
                        removeSessionTracking(decoded.sessionId);
                        return res.status(401).json({ error: 'Session security violation detected' });
                    }
                }
                // Update activity
                updateSessionActivity(decoded.sessionId);
            }
        }
        catch (error) {
            // Let auth middleware handle token validation
        }
    }
    next();
};
/**
 * Get session statistics for monitoring
 */
export function getSessionStats() {
    const now = new Date();
    const stats = {
        totalSessions: activeSessions.size,
        activeLastHour: 0,
        activeLastDay: 0,
        oldestSession: null,
        newestSession: null,
    };
    for (const session of activeSessions.values()) {
        const timeSinceActivity = now.getTime() - session.lastActivity.getTime();
        if (timeSinceActivity < 60 * 60 * 1000) { // 1 hour
            stats.activeLastHour++;
        }
        if (timeSinceActivity < 24 * 60 * 60 * 1000) { // 24 hours
            stats.activeLastDay++;
        }
        if (!stats.oldestSession || session.createdAt < stats.oldestSession) {
            stats.oldestSession = session.createdAt;
        }
        if (!stats.newestSession || session.createdAt > stats.newestSession) {
            stats.newestSession = session.createdAt;
        }
    }
    return stats;
}
