import mongoose, { Schema, Document } from 'mongoose';

export interface ITag extends Document {
  _id: string;
  name: string;
  displayName: string;
  description?: string;
  category: string;
  color: string;
  emoji?: string;
  isNSFW: boolean;
  usageCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const TagSchema = new Schema<ITag>({
  name: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true
  },
  displayName: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    required: true,
    enum: [
      'character-type', 'genre', 'personality', 'physical-traits', 'appearance', 
      'origin', 'sexuality', 'fantasy-kink', 'content-rating', 'relationship', 
      'ethnicity', 'scenario'
    ],
    index: true
  },
  color: {
    type: String,
    required: true,
    match: /^#([0-9A-F]{3}){1,2}$/i
  },
  emoji: {
    type: String,
    trim: true
  },
  isNSFW: {
    type: Boolean,
    default: false,
    index: true
  },
  usageCount: {
    type: Number,
    default: 0,
    index: true
  }
}, {
  timestamps: true
});

// Index for search and filtering
TagSchema.index({ name: 'text', displayName: 'text', description: 'text' });
TagSchema.index({ category: 1, usageCount: -1 });

export const TagModel = mongoose.model<ITag>('Tag', TagSchema);
