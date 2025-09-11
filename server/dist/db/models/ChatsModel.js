// src/db/models/ChatsModel.ts
import { Schema, model } from "mongoose";
import mongoose from "mongoose";
// Individual message schema
const MessageSchema = new Schema({
    id: { type: String, required: true },
    senderId: { type: String, required: true },
    senderType: { type: String, enum: ['user', 'ai'], required: true },
    content: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    characterId: { type: String },
    characterName: { type: String },
    imageUrl: { type: String },
    imagePrompt: { type: String },
}, { _id: false });
// Chat session schema
const ChatSchema = new Schema({
    userId: {
        type: String, // Changed to String to work with Firebase UIDs
        required: true,
    },
    characterId: {
        type: Number, // Match your character ID type
        required: true,
    },
    messages: {
        type: [MessageSchema],
        default: [],
    },
    lastMessage: {
        type: String,
        default: "",
    },
    lastActivity: {
        type: Date,
        default: Date.now,
    },
    unreadCount: {
        type: Number,
        default: 0
    },
}, {
    timestamps: true,
});
// Create compound index for efficient queries
ChatSchema.index({ userId: 1, characterId: 1 }, { unique: true });
ChatSchema.index({ userId: 1, lastActivity: -1 });
export const ChatsModel = mongoose.models.Chat || model("Chat", ChatSchema, "chats");
export const Chat = ChatsModel;
