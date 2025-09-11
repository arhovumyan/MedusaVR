// src/db/models/ChatsModel.ts
import { Schema, model, models, Document } from "mongoose";
import mongoose from "mongoose";

interface IMessage {
  id: string;
  senderId: string;
  senderType: 'user' | 'ai';
  content: string;
  timestamp: Date;
  characterId?: string;
  characterName?: string;
  imageUrl?: string;
  imagePrompt?: string;
}

interface IChat extends Document {
  userId: string;
  characterId: number;
  messages: IMessage[];
  lastMessage?: string;
  lastActivity: Date;
  messageCount: number;
}

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

export const ChatsModel = mongoose.models.Chat || model<IChat>("Chat", ChatSchema, "chats");
export { IChat, IMessage };
export const Chat = ChatsModel;