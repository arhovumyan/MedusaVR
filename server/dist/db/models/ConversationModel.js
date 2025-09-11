import { Schema, model } from "mongoose";
const MessageSchema = new Schema({
    messageId: { type: String, required: true },
    senderType: { type: String, enum: ["user", "ai"], required: true },
    content: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
});
const ConversationSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    characterId: { type: Number, required: true }, // Use numeric character ID for consistency
    title: { type: String, required: true },
    lastMessage: { type: String, default: "" },
    lastActivity: { type: Date, default: Date.now },
    messageCount: { type: Number, default: 0 },
    isFavorite: { type: Boolean, default: false },
    isArchived: { type: Boolean, default: false },
    messages: [MessageSchema],
}, {
    timestamps: true,
});
export const ConversationModel = model("Conversation", ConversationSchema);
export const Conversation = ConversationModel;
