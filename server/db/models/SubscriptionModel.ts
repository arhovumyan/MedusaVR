import { Schema, model } from 'mongoose';

export interface ISubscription {
  _id: string;
  userId: string;
  planId: string;
  status: 'active' | 'canceled' | 'past_due' | 'unpaid' | 'incomplete' | 'incomplete_expired' | 'paused' | 'trialing';
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  canceledAt?: Date;
  trialStart?: Date;
  trialEnd?: Date;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const subscriptionSchema = new Schema<ISubscription>({
  userId: {
    type: String,
    required: true,
    index: true,
  },
  planId: {
    type: String,
    required: true,
    enum: ['premium', 'deluxe', 'elite'],
  },
  status: {
    type: String,
    required: true,
    enum: ['active', 'canceled', 'past_due', 'unpaid', 'incomplete', 'incomplete_expired', 'paused', 'trialing'],
    default: 'incomplete',
  },
  currentPeriodStart: {
    type: Date,
    required: true,
  },
  currentPeriodEnd: {
    type: Date,
    required: true,
  },
  cancelAtPeriodEnd: {
    type: Boolean,
    default: false,
  },
  canceledAt: {
    type: Date,
  },
  trialStart: {
    type: Date,
  },
  trialEnd: {
    type: Date,
  },
  metadata: {
    type: Schema.Types.Mixed,
    default: {},
  },
}, {
  timestamps: true,
});

// Indexes for better query performance
subscriptionSchema.index({ userId: 1, status: 1 });
subscriptionSchema.index({ currentPeriodEnd: 1 });

export const SubscriptionModel = model<ISubscription>('Subscription', subscriptionSchema);
