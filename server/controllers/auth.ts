import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { UserModel } from "../db/models/UserModel.js";
import express from 'express';
import { getAuth } from '../lib/firebase-admin.js'; // use initialized Firebase Admin SDK
import { generateSecureTokens, trackSession, SECURE_COOKIE_CONFIG, secureLogout } from '../middleware/secureSession.js';
import { emailVerificationService } from '../services/EmailVerificationService.js';

// import { CloudinaryFolderService } from "../services/CloudinaryFolderService";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-this-in-production";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || "30d";

interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    username: string;
    avatarUrl?: string;
    isVerified: boolean;
    role: 'user' | 'creator' | 'admin';
    coins?: number;
    tier: 'free' | 'artist' | 'virtuoso' | 'icon';
    subscription?: {
      status: 'none' | 'active' | 'canceled' | 'past_due' | 'unpaid';
      plan?: 'artist' | 'virtuoso' | 'icon';
      startDate?: string;
      endDate?: string;
      paymentId?: string;
      autoRenew?: boolean;
    };
    preferences?: {
      selectedTags: string[];
      nsfwEnabled: boolean;
      completedOnboarding: boolean;
    };
    createdAt: string;
    updatedAt: string;
  };
}

// Generate JWT tokens - Updated to use secure session management
function generateTokens(userId: string, req?: Request): { 
  accessToken: string; 
  refreshToken: string; 
  sessionId: string; 
  expiresAt: Date; 
} {
  const tokens = generateSecureTokens(userId);
  
  // Track session for security monitoring
  if (req) {
    trackSession(tokens.sessionId, userId, req);
  }
  
  return tokens;
}

// Register new user
export async function register(req: Request, res: Response) {
  try {
    const { email, username, password } = req.body;

    // Validation
    if (!email || !username || !password) {
      return res.status(400).json({ message: "Email, username, and password are required" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters long" });
    }

    // Check if user already exists
    const existingUser = await UserModel.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      return res.status(400).json({ 
        message: existingUser.email === email ? "Email already registered" : "Username already taken" 
      });
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user with email verification disabled
    const newUser = await UserModel.create({
      email,
      username,
      password: hashedPassword,
      coins: 15, // Give new users 15 coins to start
      verified: true, // Email verification disabled
    });

    // Create Cloudinary folder structure for the new user (if configured)
    try {
      // Dynamic import to avoid breaking the controller if Cloudinary is not configured
      const { CloudinaryFolderService } = await import("../services/CloudinaryFolderService");
      
      if (CloudinaryFolderService.isConfigured()) {
        console.log("Cloudinary configured?", CloudinaryFolderService.isConfigured());
        console.log("Cloudinary name:", process.env.CLOUDINARY_CLOUD_NAME);
        const folderCreated = await CloudinaryFolderService.createUserFolders(newUser.username);
        if (folderCreated) {
          console.log(`✅ Successfully created Cloudinary folders for user ${newUser.username}`);
        } else {
          console.warn(`Failed to create Cloudinary folders for user ${newUser.username}, but user registration completed`);
        }
      } else {
        console.log(`⚠️ Cloudinary not configured, skipping folder creation for user ${newUser.username}`);
      }
    } catch (folderError) {
      console.error(`Error creating Cloudinary folders for user ${newUser.username}:`, folderError);
      // Don't fail registration if folder creation fails - user can still use the app
    }

    // Email verification disabled - no email sent

    // Generate secure tokens for automatic sign-in
    const { accessToken, refreshToken, sessionId, expiresAt } = generateTokens(newUser._id.toString(), req);
    
    // Set secure cookies
    res.cookie('accessToken', accessToken, {
      ...SECURE_COOKIE_CONFIG,
      maxAge: SECURE_COOKIE_CONFIG.maxAge
    });
    
    res.cookie('sessionId', sessionId, {
      ...SECURE_COOKIE_CONFIG,
      maxAge: SECURE_COOKIE_CONFIG.maxAge
    });

    // Log successful registration and auto-login
    console.log(`✅ Successful registration and auto-login: ${newUser.email} from ${req.ip} (Session: ${sessionId.substring(0, 8)}...)`);

    // Return success response with authentication tokens for automatic sign-in
    const authResponse: AuthResponse = {
      accessToken,
      refreshToken,
      user: {
        id: newUser._id.toString(),
        email: newUser.email,
        username: newUser.username,
        avatarUrl: newUser.avatarUrl || newUser.avatar,
        isVerified: newUser.verified,
        role: 'user',
        coins: newUser.coins || 0,
        tier: newUser.tier || 'free',
        subscription: newUser.subscription || { status: 'none' },
        preferences: newUser.preferences || {
          selectedTags: [],
          nsfwEnabled: false,
          completedOnboarding: false
        },
        createdAt: newUser.createdAt.toISOString(),
        updatedAt: newUser.updatedAt.toISOString()
      }
    };

    res.status(201).json(authResponse);
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: "Registration failed" });
  }
}

// Login user
export async function login(req: Request, res: Response) {
  try {
    const { emailOrUsername, password } = req.body;
    
    // Debug log for CSRF token debugging
    console.log('🛡️ Login attempt - CSRF token present:', !!(req.headers['x-csrf-token'] || req.headers['x-xsrf-token'] || req.body._csrf));
    console.log('🛡️ Login attempt - Origin:', req.headers.origin);
    console.log('🛡️ Login attempt - User agent:', req.headers['user-agent']?.substring(0, 50));

    // Validation
    if (!emailOrUsername || !password) {
      return res.status(400).json({ message: "Email/username and password are required" });
    }

    // Find user by email or username
    const user = await UserModel.findOne({
      $or: [{ email: emailOrUsername }, { username: emailOrUsername }]
    });

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Check password (skip for OAuth users who don't have a password)
    if (user.password) {
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
    } else {
      // User doesn't have a password (OAuth user), but they're trying to login with password
      return res.status(401).json({ message: "This account uses Google sign-in. Please use Google to sign in." });
    }

    // Email verification check removed - allow login without verification

    // Generate secure tokens with session tracking
    const { accessToken, refreshToken, sessionId, expiresAt } = generateTokens(user._id.toString(), req);
    
    // Set secure cookies
    res.cookie('accessToken', accessToken, {
      ...SECURE_COOKIE_CONFIG,
      maxAge: SECURE_COOKIE_CONFIG.maxAge
    });
    
    res.cookie('sessionId', sessionId, {
      ...SECURE_COOKIE_CONFIG,
      maxAge: SECURE_COOKIE_CONFIG.maxAge
    });

    // Log successful login for security monitoring
    console.log(`✅ Successful login: ${user.email} from ${req.ip} (Session: ${sessionId.substring(0, 8)}...)`);

    // Log the decoded token and user (for debugging)
    try {
      const decoded = jwt.verify(accessToken, JWT_SECRET) as any;
      console.log("Decoded token:", decoded);
      const userFromDb = await UserModel.findById(decoded.userId);
      console.log("User from DB:", userFromDb);
    } catch (error) {
      console.error("Error decoding token or fetching user:", error);
    }

    // Prepare response
    const authResponse: AuthResponse = {
      accessToken,
      refreshToken,
      user: {
        id: user._id.toString(),
        email: user.email,
        username: user.username,
        avatarUrl: user.avatarUrl || user.avatar,
        isVerified: user.verified,
        role: 'user',
        coins: user.coins || 0,
        tier: user.tier || 'free', // Use user's tier or default
        subscription: user.subscription || { status: 'none' }, // Use user's subscription or default
        preferences: user.preferences || {
          selectedTags: [],
          nsfwEnabled: false,
          completedOnboarding: false
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    };

    res.json(authResponse);
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Login failed" });
  }
}

// Logout user (mainly for cleanup)
export async function logout(req: Request, res: Response) {
  try {
    // Get session information from token or cookies
    const authHeader = req.headers.authorization;
    let sessionId: string | undefined;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7);
        const decoded = jwt.verify(token, JWT_SECRET) as any;
        sessionId = decoded.sessionId;
      } catch (error) {
        // Token invalid, continue with logout anyway
      }
    }
    
    // Get sessionId from cookies as fallback
    if (!sessionId && req.cookies?.sessionId) {
      sessionId = req.cookies.sessionId;
    }
    
    // Perform secure logout
    if (sessionId) {
      secureLogout(sessionId);
      console.log(`🚪 Logout: Session ${sessionId.substring(0, 8)}... terminated`);
    }
    
    // Clear cookies
    res.clearCookie('accessToken', SECURE_COOKIE_CONFIG);
    res.clearCookie('sessionId', SECURE_COOKIE_CONFIG);
    
    console.log(`✅ Successful logout from ${req.ip}`);
    res.json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ message: "Logout failed" });
  }
}

// Refresh access token
export async function refreshToken(req: Request, res: Response) {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ message: "Refresh token is required" });
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, JWT_SECRET) as any;
    
    if (decoded.type !== 'refresh') {
      return res.status(401).json({ message: "Invalid refresh token" });
    }

    // Find user
    const user = await UserModel.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    // Generate new access token
    const newAccessToken = jwt.sign({ userId: user._id.toString() }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions);

    res.json({ accessToken: newAccessToken });
  } catch (error) {
    console.error("Token refresh error:", error);
    res.status(401).json({ message: "Invalid refresh token" });
  }
}

// Get current user profile
export async function getProfile(req: Request, res: Response) {
  try {
    const userId = (req as any).userId; // Set by auth middleware
    
    const user = await UserModel.findById(userId).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      id: user._id.toString(),
      email: user.email,
      username: user.username,
      avatarUrl: user.avatarUrl || user.avatar,
      verified: user.verified,
      coins: user.coins,
      bio: user.bio,
      preferences: user.preferences || {
        selectedTags: [],
        nsfwEnabled: false,
        completedOnboarding: false
      },
      tier: user.tier || 'free',
      subscription: user.subscription || { status: 'none' },
    });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({ message: "Failed to get profile" });
  }
}

// Update current user profile
export async function updateProfile(req: Request, res: Response) {
  try {
    const userId = (req as any).userId; // Set by auth middleware
    const { username, bio, avatarUrl, avatar } = req.body;

    // Validate input
    const updateData: any = {};
    if (username !== undefined) {
      if (username.length < 3) {
        return res.status(400).json({ message: "Username must be at least 3 characters long" });
      }
      // Check if username is already taken by another user
      const existingUser = await UserModel.findOne({ username, _id: { $ne: userId } });
      if (existingUser) {
        return res.status(400).json({ message: "Username already taken" });
      }
      updateData.username = username;
    }
    if (bio !== undefined) updateData.bio = bio;
    // Support both 'avatar' and 'avatarUrl' for backward compatibility
    if (avatarUrl !== undefined) updateData.avatar = avatarUrl;
    if (avatar !== undefined) updateData.avatar = avatar;

    // Update user
    const updatedUser = await UserModel.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    ).select("-password");

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      id: updatedUser._id.toString(),
      email: updatedUser.email,
      username: updatedUser.username,
      avatarUrl: updatedUser.avatarUrl || updatedUser.avatar,
      isVerified: updatedUser.verified,
      coins: updatedUser.coins || 0,
      bio: updatedUser.bio,
      role: 'user',
      tier: updatedUser.tier || 'free',
      subscription: updatedUser.subscription || { status: 'none' },
      preferences: updatedUser.preferences || {
        selectedTags: [],
        nsfwEnabled: false,
        completedOnboarding: false
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ message: "Failed to update profile" });
  }
}

// Add coins to current user (for testing/demo purposes)
export async function addCoins(req: Request, res: Response) {
  try {
    const userId = (req as any).userId; // Set by auth middleware
    const { amount } = req.body;

    if (!amount || typeof amount !== 'number') {
      return res.status(400).json({ message: "Valid coin amount is required" });
    }

    // Update user coins
    const updatedUser = await UserModel.findByIdAndUpdate(
      userId,
      { $inc: { coins: amount } },
      { new: true, runValidators: true }
    ).select("-password");

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      id: updatedUser._id.toString(),
      email: updatedUser.email,
      username: updatedUser.username,
      avatar: updatedUser.avatar,
      verified: updatedUser.verified,
      coins: updatedUser.coins,
      bio: updatedUser.bio,
      tier: updatedUser.tier || 'free',
      subscription: updatedUser.subscription || { status: 'none' },
      message: `${amount > 0 ? 'Added' : 'Deducted'} ${Math.abs(amount)} coins`
    });
  } catch (error) {
    console.error("Add coins error:", error);
    res.status(500).json({ message: "Failed to update coins" });
  }
}
const router = express.Router();

export async function googleOAuthHandler(req: Request, res: Response) {
  try {
    const { idToken } = req.body;
    console.log('📝 Google OAuth request received with token:', idToken ? 'present' : 'missing');
    
    if (!idToken) return res.status(400).json({ message: 'Missing ID token' });

    console.log('🔍 Attempting to verify ID token with Firebase Admin SDK...');
    const decoded = await getAuth().verifyIdToken(idToken);
    console.log('✅ ID token verified successfully:', { email: decoded.email, name: decoded.name });
    
    const { email, name, picture } = decoded;

    if (!email) {
      console.log('❌ No email provided by Google');
      return res.status(400).json({ message: 'Email not provided by Google' });
    }

    console.log('🔍 Looking for existing user with email:', email);
    let user = await UserModel.findOne({ email });
    
    if (!user) {
      console.log('📝 Creating new user for:', email);
      
      // Generate a unique username to avoid collisions
      let username = name || email.split('@')[0];
      let usernameCounter = 0;
      let finalUsername = username;
      
      // Check if username already exists and modify if needed
      while (await UserModel.findOne({ username: finalUsername })) {
        usernameCounter++;
        finalUsername = `${username}${usernameCounter}`;
        console.log(`🔄 Username '${username}' taken, trying '${finalUsername}'`);
      }
      
      try {
        user = await UserModel.create({
          email,
          username: finalUsername,
          avatar: picture,
          // No password for OAuth users - they authenticate via Google
          verified: true,
          coins: 15, // Give new OAuth users 15 coins to start (same as regular registration)
        });
        console.log('✅ New user created:', user._id, 'with username:', finalUsername);
        
        // Create Cloudinary folder structure for the new user (if configured)
        try {
          // Dynamic import to avoid breaking the controller if Cloudinary is not configured
          const { CloudinaryFolderService } = await import("../services/CloudinaryFolderService");
          
          if (CloudinaryFolderService.isConfigured()) {
            console.log("Cloudinary configured?", CloudinaryFolderService.isConfigured());
            console.log("Cloudinary name:", process.env.CLOUDINARY_CLOUD_NAME);
            const folderCreated = await CloudinaryFolderService.createUserFolders(user.username);
            if (folderCreated) {
              console.log(`✅ Successfully created Cloudinary folders for user ${user.username}`);
            } else {
              console.warn(`Failed to create Cloudinary folders for user ${user.username}, but user registration completed`);
            }
          } else {
            console.log(`⚠️ Cloudinary not configured, skipping folder creation for user ${user.username}`);
          }
        } catch (folderError) {
          console.error(`Error creating Cloudinary folders for user ${user.username}:`, folderError);
          // Don't fail registration if folder creation fails - user can still use the app
        }
      } catch (createError) {
        console.error('❌ Error creating user:', createError);
        return res.status(500).json({ message: 'Failed to create user account' });
      }
    } else {
      console.log('✅ Existing user found:', user._id);
      
      // Update user's avatar if it's from Google and they don't have one
      if (picture && !user.avatar) {
        await UserModel.updateOne({ _id: user._id }, { avatar: picture });
        user.avatar = picture;
        console.log('📷 Updated user avatar from Google');
      }
    }

    // Generate tokens using the same function as regular login with session tracking
    const { accessToken, refreshToken, sessionId, expiresAt } = generateTokens(user._id.toString(), req);
    
    // Set secure cookies
    res.cookie('accessToken', accessToken, {
      ...SECURE_COOKIE_CONFIG,
      maxAge: SECURE_COOKIE_CONFIG.maxAge
    });
    
    res.cookie('sessionId', sessionId, {
      ...SECURE_COOKIE_CONFIG,
      maxAge: SECURE_COOKIE_CONFIG.maxAge
    });

    // Prepare response in the same format as regular login
    const authResponse: AuthResponse = {
      accessToken,
      refreshToken,
      user: {
        id: user._id.toString(),
        email: user.email,
        username: user.username,
        avatarUrl: user.avatarUrl || user.avatar,
        isVerified: user.verified,
        role: 'user',
        coins: user.coins || 0,
        tier: user.tier || 'free',
        subscription: user.subscription || { status: 'none' },
        preferences: user.preferences || {
          selectedTags: [],
          nsfwEnabled: false,
          completedOnboarding: false
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    };

    // Log successful OAuth login for security monitoring
    console.log(`✅ Successful Google OAuth login: ${user.email} from ${req.ip} (Session: ${sessionId.substring(0, 8)}...)`);
    
    console.log('✅ Google OAuth completed successfully for:', email);
    res.json(authResponse);
  } catch (err) {
    console.error("🔥 Google OAuth error details:", {
      message: err instanceof Error ? err.message : 'Unknown error',
      name: err instanceof Error ? err.name : 'Unknown',
      code: (err as any)?.code,
      stack: err instanceof Error ? err.stack : undefined
    });
    res.status(500).json({ message: "Google login failed" });
  }
}


// Email verification endpoint
export async function verifyEmail(req: Request, res: Response) {
  try {
    const { token } = req.query;

    if (!token || typeof token !== 'string') {
      return res.status(400).json({ 
        success: false, 
        message: "Verification token is required" 
      });
    }

    const result = await emailVerificationService.verifyEmailToken(token);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error("Email verification error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Email verification failed" 
    });
  }
}

// Resend verification email endpoint
export async function resendVerificationEmail(req: Request, res: Response) {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ 
        success: false, 
        message: "Email address is required" 
      });
    }

    const result = await emailVerificationService.resendVerificationEmail(email);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error("Resend verification email error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to resend verification email" 
    });
  }
}

export default router;