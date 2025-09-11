// src/db/models/FollowModel.ts
import { Schema, model } from "mongoose";
import mongoose from "mongoose";
import { z } from "zod";
// Mongoose Schema
const FollowSchema = new Schema({
    followerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    followedId: { type: Schema.Types.ObjectId, ref: "User", required: true },
}, {
    timestamps: { createdAt: "createdAt", updatedAt: false }
});
// Mongoose Model
export const FollowModel = mongoose.models.Follow || model("Follow", FollowSchema, "follows");
// Zod Schema for Validation
export const insertFollowSchema = z.object({
    followerId: z.string().min(1),
    followedId: z.string().min(1),
});
