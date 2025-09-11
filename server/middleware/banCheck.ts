import { Request, Response, NextFunction } from 'express';
import { UserBanService } from '../services/UserBanService.js';

/**
 * Middleware to check if a user is banned before allowing access
 */
export async function checkUserBanStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as any).user?.uid || (req as any).userId;
    
    if (!userId) {
      // No user ID means not authenticated, let other middleware handle
      return next();
    }

    // Check if user is banned
    const banStatus = await UserBanService.checkBanStatus(userId);
    
    if (banStatus.isBanned) {
      console.log('🚫 Banned user attempted access:', {
        userId,
        banType: banStatus.banType,
        banReason: banStatus.banReason,
        endpoint: req.originalUrl,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });

      const response: any = {
        error: 'Account Banned',
        banned: true,
        banType: banStatus.banType,
        message: banStatus.banMessage || 'Your account has been banned.',
        bannedAt: banStatus.bannedAt
      };

      // Add expiration info for temporary bans
      if (banStatus.banType === 'temporary' && banStatus.banExpiresAt && banStatus.remainingHours) {
        response.banExpiresAt = banStatus.banExpiresAt;
        response.remainingHours = banStatus.remainingHours;
        response.message = `Your account is temporarily banned. ${banStatus.remainingHours} hours remaining.`;
      }

      return res.status(403).json(response);
    }

    // User is not banned, continue
    next();
  } catch (error) {
    console.error('Error checking ban status:', error);
    // Don't block on errors, but log them
    next();
  }
}

/**
 * Middleware specifically for login endpoints to prevent banned users from getting tokens
 */
export async function checkBanOnLogin(req: Request, res: Response, next: NextFunction) {
  try {
    // This runs after authentication but before token generation
    const userId = (req as any).user?.uid || (req as any).userId;
    
    if (!userId) {
      return next();
    }

    const banStatus = await UserBanService.checkBanStatus(userId);
    
    if (banStatus.isBanned) {
      console.log('🚫 Banned user attempted login:', {
        userId,
        banType: banStatus.banType,
        banReason: banStatus.banReason,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });

      const errorMessage = banStatus.banType === 'permanent'
        ? 'Your account has been permanently banned and cannot be accessed.'
        : `Your account is temporarily banned. Please try again later.`;

      return res.status(403).json({
        error: 'Account Banned',
        message: errorMessage,
        banned: true,
        banType: banStatus.banType,
        banReason: banStatus.banReason
      });
    }

    next();
  } catch (error) {
    console.error('Error checking ban on login:', error);
    next();
  }
}

export default { checkUserBanStatus, checkBanOnLogin };
