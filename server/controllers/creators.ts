import { Request, Response } from "express";
import { CreatorModel } from "../db/models/CreatorsModel.js";
import mongoose from "mongoose";

export async function listCreators(req: Request, res: Response) {
  try {
    const limit  = parseInt(req.query.limit  as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;
    
    const creators = await CreatorModel.find({})
      .populate('userId', 'username displayName avatarUrl')
      .limit(limit)
      .skip(offset)
      .lean();
    
    res.json(creators);
  } catch(err) {
    console.error("⚠️ listCreators error:", err);
    res.status(500).json({ message: "Failed to fetch creators" });
  }
}

export async function getCreator(req: Request, res: Response) {
  try {
    const id = req.params.id;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid creator ID" });
    }
    
    const creator = await CreatorModel.findById(id)
      .populate('userId', 'username displayName avatarUrl')
      .lean();
    
    if (!creator) return res.status(404).json({ message: "Creator not found" });
    res.json(creator);
  } catch {
    res.status(500).json({ message: "Failed to fetch creator" });
  }
}

export async function getByUser(req: Request, res: Response) {
  try {
    const userId = req.params.userId;
    if (!mongoose.isValidObjectId(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }
    
    const creator = await CreatorModel.findOne({ userId })
      .populate('userId', 'username displayName avatarUrl')
      .lean();
    
    if (!creator) return res.status(404).json({ message: "Creator not found" });
    res.json(creator);
  } catch {
    res.status(500).json({ message: "Failed to fetch creator" });
  }
}