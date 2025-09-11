// src/db/models/CommentModel.ts
import { Schema, model } from "mongoose";
const CommentSchema = new Schema({
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
export const CommentModel = model("Comment", CommentSchema, "comments");
