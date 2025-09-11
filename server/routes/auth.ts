import { Router } from "express";
import { register, login, refreshToken, getProfile, logout, updateProfile, addCoins, googleOAuthHandler, verifyEmail, resendVerificationEmail } from "../controllers/auth.js";
import { requireAuth } from "../middleware/auth.js";
import { checkBanOnLogin, checkUserBanStatus } from "../middleware/banCheck.js";

const router = Router();

// Public routes
router.post("/register", register);
router.post("/login", login);
router.post("/refresh", refreshToken);
router.post("/logout", logout);
router.post("/google", googleOAuthHandler); // Google OAuth login

// Email verification routes
router.get("/verify-email", verifyEmail);
router.post("/resend-verification", resendVerificationEmail);

// Protected routes (with ban checking)
router.get("/me", requireAuth, checkUserBanStatus, getProfile);
router.put("/me", requireAuth, checkUserBanStatus, updateProfile);
router.post("/add-coins", requireAuth, checkUserBanStatus, addCoins); // Demo endpoint

export default router;
