import { Schema, model, Document, Types } from "mongoose";

export interface IViolation extends Document {
  userId: Types.ObjectId;
  violationType: 'age_violation' | 'system_manipulation' | 'jailbreak_attempt' | 'bypass_attempt' | 'repeated_violations';
  severity: 'low' | 'medium' | 'high' | 'critical';
  
  // Evidence
  violatingMessage: string;
  detectedPatterns: string[];
  conversationContext?: string;
  characterId?: string;
  
  // Technical details
  ipAddress: string;
  userAgent: string;
  deviceFingerprint?: string;
  sessionId?: string;
  endpoint: string; // 'websocket_message', 'rest_api', etc.
  
  // Action taken
  actionTaken: 'warning' | 'temporary_ban' | 'permanent_ban' | 'account_review';
  banDuration?: number; // in hours, null for permanent
  
  // Metadata
  timestamp: Date;
  reportedToAuthorities?: boolean;
  complianceExported?: boolean;
  
  // Admin notes
  adminNotes?: string;
  reviewedBy?: Types.ObjectId; // Admin user ID
  reviewedAt?: Date;
}

const ViolationSchema = new Schema<IViolation>({
  userId: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    index: true 
  },
  
  violationType: {
    type: String,
    enum: ['age_violation', 'system_manipulation', 'jailbreak_attempt', 'bypass_attempt', 'repeated_violations'],
    required: true,
    index: true
  },
  
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    required: true,
    index: true
  },
  
  // Evidence (encrypted in production)
  violatingMessage: {
    type: String,
    required: true,
    maxlength: 10000 // Prevent abuse
  },
  
  detectedPatterns: [{
    type: String,
    maxlength: 500
  }],
  
  conversationContext: {
    type: String,
    maxlength: 5000 // Last few messages for context
  },
  
  characterId: {
    type: String,
    index: true
  },
  
  // Technical forensics
  ipAddress: {
    type: String,
    required: true,
    index: true
  },
  
  userAgent: {
    type: String,
    required: true
  },
  
  deviceFingerprint: {
    type: String,
    index: true
  },
  
  sessionId: {
    type: String,
    index: true
  },
  
  endpoint: {
    type: String,
    required: true,
    enum: ['websocket_message', 'rest_api', 'character_creation', 'image_generation', 'other']
  },
  
  // Action taken
  actionTaken: {
    type: String,
    enum: ['warning', 'temporary_ban', 'permanent_ban', 'account_review'],
    required: true,
    index: true
  },
  
  banDuration: {
    type: Number, // hours
    min: 1,
    max: 8760 // 1 year max
  },
  
  // Audit trail
  timestamp: {
    type: Date,
    default: Date.now,
    required: true,
    index: true
  },
  
  reportedToAuthorities: {
    type: Boolean,
    default: false,
    index: true
  },
  
  complianceExported: {
    type: Boolean,
    default: false,
    index: true
  },
  
  // Admin review
  adminNotes: {
    type: String,
    maxlength: 2000
  },
  
  reviewedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  
  reviewedAt: {
    type: Date
  }
}, {
  timestamps: true,
  collection: 'violations'
});

// Compound indexes for efficient queries
ViolationSchema.index({ userId: 1, timestamp: -1 });
ViolationSchema.index({ severity: 1, timestamp: -1 });
ViolationSchema.index({ violationType: 1, actionTaken: 1 });
ViolationSchema.index({ ipAddress: 1, timestamp: -1 });

// Pre-save middleware for additional validation
ViolationSchema.pre('save', function(next) {
  // Require ban duration for temporary bans
  if (this.actionTaken === 'temporary_ban' && !this.banDuration) {
    return next(new Error('Ban duration is required for temporary bans'));
  }
  
  // Don't allow ban duration for permanent bans
  if (this.actionTaken === 'permanent_ban' && this.banDuration) {
    this.banDuration = undefined;
  }
  
  next();
});

export const ViolationModel = model<IViolation>('Violation', ViolationSchema);
export default ViolationModel;
