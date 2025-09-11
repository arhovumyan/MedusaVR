import { Schema, model } from "mongoose";
import mongoose from "mongoose";
const MessageSchema = new Schema({
    conversationId: {
        type: Schema.Types.ObjectId,
        ref: 'Conversation',
        required: true,
        index: true
    },
    sender: {
        type: String,
        enum: ['user', 'ai'],
        required: true
    },
    content: {
        type: String,
        required: true,
        trim: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    },
    // Additional metadata for UI purposes
    messageId: {
        type: String,
        unique: true,
        default: function () {
            return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        }
    },
    // For AI messages, store character info
    characterId: {
        type: Number,
        required: function () {
            return this.sender === 'ai';
        }
    },
    characterName: {
        type: String,
        required: function () {
            return this.sender === 'ai';
        }
    },
    // Message status
    isRead: {
        type: Boolean,
        default: false
    },
    // Image message fields
    imageUrl: {
        type: String,
        required: false
    },
    imagePrompt: {
        type: String,
        required: false
    },
    // For future enhancements
    attachments: [{
            type: String, // URLs to images/files
            name: String,
            size: Number
        }]
}, {
    timestamps: { createdAt: 'timestamp', updatedAt: 'updatedAt' }
});
// Indexes for efficient queries
MessageSchema.index({ conversationId: 1, timestamp: 1 });
MessageSchema.index({ conversationId: 1, timestamp: -1 });
export const MessageModel = mongoose.models.Message || model("Message", MessageSchema, "messages");
export const Message = MessageModel;
