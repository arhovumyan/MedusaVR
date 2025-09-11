// src/db/models/CreatorModel.ts
import { Schema, model } from "mongoose";
import mongoose from "mongoose";
const CreatorSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    displayName: { type: String, required: true },
    followerCount: { type: Number, default: 0 },
    characterCount: { type: Number, default: 0 },
    totalMessages: { type: Number, default: 0 },
    joinDate: { type: Date, default: Date.now },
    badges: { type: [String], default: [] }
}, {
    timestamps: true
});
export const CreatorModel = mongoose.models.Creator || model("Creator", CreatorSchema, "creators");
