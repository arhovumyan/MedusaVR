// src/db/models/CommentModel.ts
import { Schema, model, Document } from "mongoose";

export interface IComment extends Document {
  _id: string;
  characterId: number;
  userId: Schema.Types.ObjectId;
  content: string;
  likes: number;
  replies: Schema.Types.ObjectId[];
  parentCommentId?: Schema.Types.ObjectId;
  isEdited: boolean;
  editedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const CommentSchema = new Schema<IComment>({
  characterId: {
    type: Number,
    required: true,
    index: true
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  content: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  likes: {
    type: Number,
    default: 0
  },
  replies: [{
    type: Schema.Types.ObjectId,
    ref: 'Comment'
  }],
  parentCommentId: {
    type: Schema.Types.ObjectId,
    ref: 'Comment',
    default: null
  },
  isEdited: {
    type: Boolean,
    default: false
  },
  editedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
CommentSchema.index({ characterId: 1, createdAt: -1 });
CommentSchema.index({ userId: 1, createdAt: -1 });
CommentSchema.index({ parentCommentId: 1, createdAt: 1 });

export const CommentModel = model<IComment>("Comment", CommentSchema, "comments"); 