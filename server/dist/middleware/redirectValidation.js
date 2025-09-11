import { isValidRedirectUrl, sanitizeRedirectUrl } from '../utils/urlValidation.js';
/**
 * Middleware to validate redirect URLs
 * Checks common redirect parameters and sanitizes them
 */
export const validateRedirects = (req, res, next) => {
    // Common redirect parameter names
    const redirectParams = ['redirect', 'redirectTo', 'returnUrl', 'return_url', 'next', 'url', 'goto'];
    let foundRedirect = false;
    // Check query parameters
    for (const param of redirectParams) {
        const redirectUrl = req.query[param];
        if (redirectUrl) {
            if (isValidRedirectUrl(redirectUrl)) {
                req.validatedRedirect = redirectUrl;
            }
            else {
                console.warn(`⚠️  Invalid redirect URL blocked: ${redirectUrl} from IP: ${req.ip}`);
                req.validatedRedirect = '/';
            }
            foundRedirect = true;
            break;
        }
    }
    // Check body parameters
    if (!foundRedirect && req.body) {
        for (const param of redirectParams) {
            const redirectUrl = req.body[param];
            if (redirectUrl) {
                if (isValidRedirectUrl(redirectUrl)) {
                    req.validatedRedirect = redirectUrl;
                }
                else {
                    console.warn(`⚠️  Invalid redirect URL blocked: ${redirectUrl} from IP: ${req.ip}`);
                    req.validatedRedirect = '/';
                }
                break;
            }
        }
    }
    next();
};
/**
 * Middleware to validate specific redirect parameter
 * @param paramName - The parameter name to validate
 */
export const validateSpecificRedirect = (paramName) => {
    return (req, res, next) => {
        const redirectUrl = (req.query[paramName] || req.body[paramName]);
        if (redirectUrl && typeof redirectUrl === 'string') {
            if (isValidRedirectUrl(redirectUrl)) {
                req.validatedRedirect = redirectUrl;
            }
            else {
                console.warn(`⚠️  Invalid redirect URL blocked (${paramName}): ${redirectUrl} from IP: ${req.ip}`);
                req.validatedRedirect = '/';
            }
        }
        next();
    };
};
/**
 * Utility function for controllers to safely redirect
 * @param res - Express Response object
 * @param redirectUrl - URL to redirect to
 * @param defaultUrl - Default URL if validation fails
 */
export const safeRedirect = (res, redirectUrl, defaultUrl = '/') => {
    const sanitizedUrl = sanitizeRedirectUrl(redirectUrl);
    if (sanitizedUrl !== redirectUrl) {
        console.warn(`⚠️  Redirect URL sanitized: ${redirectUrl} -> ${sanitizedUrl}`);
    }
    res.redirect(sanitizedUrl);
};
/**
 * Middleware to block open redirects
 * This is a more strict version that blocks all external redirects
 */
export const blockOpenRedirects = (req, res, next) => {
    const redirectParams = ['redirect', 'redirectTo', 'returnUrl', 'return_url', 'next', 'url', 'goto'];
    // Check query parameters
    for (const param of redirectParams) {
        const redirectUrl = req.query[param];
        if (redirectUrl) {
            try {
                const url = new URL(redirectUrl, `${req.protocol}://${req.get('host')}`);
                // Block external redirects entirely
                if (url.hostname !== req.hostname) {
                    console.warn(`🚨 Open redirect attempt blocked: ${redirectUrl} from IP: ${req.ip}`);
                    return res.status(400).json({
                        error: 'Invalid redirect URL',
                        message: 'External redirects are not allowed'
                    });
                }
            }
            catch (error) {
                // Invalid URL format
                console.warn(`🚨 Invalid redirect URL format: ${redirectUrl} from IP: ${req.ip}`);
                return res.status(400).json({
                    error: 'Invalid redirect URL format',
                    message: 'The redirect URL is not valid'
                });
            }
        }
    }
    next();
};
/**
 * Middleware for authentication redirects
 * More permissive for auth flows but still validates
 */
export const validateAuthRedirect = (req, res, next) => {
    const redirectUrl = (req.query.redirect || req.body.redirect);
    if (redirectUrl && typeof redirectUrl === 'string') {
        // For auth redirects, we're more permissive but still validate
        if (isValidRedirectUrl(redirectUrl)) {
            req.validatedRedirect = redirectUrl;
        }
        else {
            // For auth, redirect to dashboard instead of home
            console.warn(`⚠️  Invalid auth redirect URL blocked: ${redirectUrl} from IP: ${req.ip}`);
            req.validatedRedirect = '/dashboard';
        }
    }
    else {
        // Default auth redirect
        req.validatedRedirect = '/dashboard';
    }
    next();
};
