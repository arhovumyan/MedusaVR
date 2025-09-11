// models/UserModel.ts
import { Schema, model, models } from "mongoose";
import mongoose from "mongoose";

const UserSchema = new Schema(
  {
    username: { type: String, required: true, unique: true },
    email:    { type: String, required: true, unique: true },
    password: { type: String, required: true },
    avatar:   { type: String, default: null }, // Deprecated - use avatarUrl
    avatarUrl: { type: String, default: null }, // New field for Cloudinary URLs
    bio:      { type: String, default: null },
    verified: { type: Boolean, default: false },
    emailVerificationToken: { type: String, default: null },
    emailVerificationExpires: { type: Date, default: null },
    coins:    { type: Number, default: 0 },
    favorites: [{ type: Number, default: [] }], // Array of character IDs
    likedCharacters: [{ type: Number, default: [] }], // Array of character IDs
    preferences: {
      selectedTags: [{ type: String, default: [] }], // Array of preferred tag names
      nsfwEnabled: { type: Boolean, default: false },
      completedOnboarding: { type: Boolean, default: false }
    },
    
    // Social features
    followingCount: { type: Number, default: 0 },
    followersCount: { type: Number, default: 0 },
    
    // User activity tracking
    stats: {
      charactersCreated: { type: Number, default: 0 },
      imagesGenerated: { type: Number, default: 0 },
      conversationsStarted: { type: Number, default: 0 },
      totalMessages: { type: Number, default: 0 },
      joinDate: { type: Date, default: Date.now }
    },
    
    // Coin management
    lastMonthlyRefill: { type: Date, default: null },
    subscriptionStartDate: { type: Date, default: null }, // For yearly subscription tracking
    yearlyCoinsRemaining: { type: Number, default: 0 }, // Monthly grants remaining for yearly subs
    lastCoinGrantDate: { type: Date, default: null }, // Exact date of last coin grant
    
    // New tiered subscription system
    tier: { 
      type: String, 
      enum: ['free', 'artist', 'virtuoso', 'icon'], 
      default: 'free' 
    },
    subscription: {
      status: { 
        type: String, 
        enum: ['none', 'active', 'canceled', 'past_due', 'unpaid'], 
        default: 'none' 
      },
      plan: { 
        type: String, 
        enum: ['artist', 'virtuoso', 'icon'], 
        default: null 
      },
      startDate: { type: Date, default: null },
      endDate: { type: Date, default: null },
      paymentId: { type: String, default: null },
      autoRenew: { type: Boolean, default: true },
      billingPeriod: { 
        type: String, 
        enum: ['monthly', 'yearly'], 
        default: 'monthly' 
      }
    },

    // Account status and ban system
    accountStatus: {
      type: String,
      enum: ['active', 'banned', 'suspended', 'under_review', 'deactivated'],
      default: 'active',
      index: true
    },
    
    // Ban details
    banInfo: {
      isBanned: { type: Boolean, default: false, index: true },
      banType: { 
        type: String, 
        enum: ['temporary', 'permanent'], 
        default: null 
      },
      banReason: { 
        type: String, 
        enum: ['age_violation', 'repeated_violations', 'terms_violation', 'payment_fraud', 'admin_action'],
        default: null 
      },
      bannedAt: { type: Date, default: null },
      banExpiresAt: { type: Date, default: null }, // null for permanent bans
      bannedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null }, // Admin who banned
      banMessage: { type: String, default: null }, // Custom message shown to user
      
      // Evidence and compliance
      totalViolations: { type: Number, default: 0 },
      lastViolationAt: { type: Date, default: null },
      complianceFlags: [{
        type: String,
        enum: ['under_18_attempt', 'payment_chargeback', 'reported_content', 'law_enforcement']
      }]
    },
    
    // Security tracking
    securityInfo: {
      lastLoginIP: { type: String, default: null, index: true },
      registrationIP: { type: String, default: null, index: true },
      deviceFingerprints: [{ type: String }], // Track devices used
      suspiciousActivity: { type: Boolean, default: false },
      failedLoginAttempts: { type: Number, default: 0 },
      lastFailedLogin: { type: Date, default: null },
      accountLocked: { type: Boolean, default: false },
      lockExpires: { type: Date, default: null }
    }
  },
  {
    timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" }
  }
);

export const UserModel = mongoose.models.User || model("User", UserSchema, "users");