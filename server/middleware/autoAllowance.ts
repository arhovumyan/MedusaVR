import { Request, Response, NextFunction } from "express";
import { CoinService } from "../services/CoinService.js";

/**
 * Middleware to automatically check and process monthly coin allowances
 * This runs on authenticated requests to ensure users get their monthly allowance
 */
export const autoProcessMonthlyAllowance = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).userId;
    
    if (!userId) {
      // No authenticated user, skip allowance check
      return next();
    }

    // Check and process monthly allowance asynchronously
    // Don't wait for this to complete to avoid slowing down requests
    CoinService.processMonthlyRefill(userId).then(result => {
      if (result.success && result.coinsAdded > 0) {
        console.log(`✨ Auto-processed monthly allowance: ${result.coinsAdded} coins for user ${userId}`);
      }
    }).catch(error => {
      console.error('Error in auto monthly allowance processing:', error);
    });

    next();
  } catch (error) {
    console.error('Error in autoProcessMonthlyAllowance middleware:', error);
    // Don't fail the request if allowance processing fails
    next();
  }
};
