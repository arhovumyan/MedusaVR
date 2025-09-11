
import { Schema, model, Document } from "mongoose";

interface IMessage extends Document {
  messageId: string;
  senderType: "user" | "ai";
  content: string;
  timestamp: Date;
}

interface IConversation extends Document {
  userId: Schema.Types.ObjectId;
  characterId: number; // Use numeric character ID for consistency
  title: string;
  lastMessage: string;
  lastActivity: Date;
  messageCount: number;
  isFavorite: boolean;
  isArchived: boolean;
  messages: IMessage[];
}

const MessageSchema = new Schema({
  messageId: { type: String, required: true },
  senderType: { type: String, enum: ["user", "ai"], required: true },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
});

const ConversationSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    characterId: { type: Number, required: true }, // Use numeric character ID for consistency
    title: { type: String, required: true },
    lastMessage: { type: String, default: "" },
    lastActivity: { type: Date, default: Date.now },
    messageCount: { type: Number, default: 0 },
    isFavorite: { type: Boolean, default: false },
    isArchived: { type: Boolean, default: false },
    messages: [MessageSchema],
  },
  {
    timestamps: true,
  }
);

export const ConversationModel = model<IConversation>("Conversation", ConversationSchema);
export { IMessage, IConversation };
export const Conversation = ConversationModel;
