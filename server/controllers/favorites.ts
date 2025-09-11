import { Request, Response } from "express";
import { UserModel } from "../db/models/UserModel.js";
import { CharacterModel } from "../db/models/CharacterModel.js";

interface AuthRequest extends Request {
  userId?: string;
}

// Get user's favorites
export async function getFavorites(req: AuthRequest, res: Response) {
  try {
    const userId = req.userId;
    
    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Get full character objects for favorited character IDs
    const favoriteIds = user.favorites || [];
    const characters = await CharacterModel.find({ 
      id: { $in: favoriteIds } 
    });

    res.json(characters);
  } catch (error) {
    console.error("Get favorites error:", error);
    res.status(500).json({ message: "Failed to get favorites" });
  }
}

// Add character to favorites
export async function addToFavorites(req: AuthRequest, res: Response) {
  try {
    const userId = req.userId;
    const { characterId } = req.body;
    
    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    if (!characterId) {
      return res.status(400).json({ message: "Character ID is required" });
    }

    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Initialize favorites if it doesn't exist
    if (!user.favorites) {
      user.favorites = [];
    }

    // Check if already in favorites
    if (user.favorites.includes(characterId)) {
      return res.status(400).json({ message: "Character already in favorites" });
    }

    // Add to favorites
    user.favorites.push(characterId);
    await user.save();

    res.json({ 
      message: "Added to favorites", 
      favorites: user.favorites 
    });
  } catch (error) {
    console.error("Add to favorites error:", error);
    res.status(500).json({ message: "Failed to add to favorites" });
  }
}

// Remove character from favorites
export async function removeFromFavorites(req: AuthRequest, res: Response) {
  try {
    const userId = req.userId;
    const { characterId } = req.params;
    
    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    if (!characterId) {
      return res.status(400).json({ message: "Character ID is required" });
    }

    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Initialize favorites if it doesn't exist
    if (!user.favorites) {
      user.favorites = [];
    }

    // Remove from favorites
    const characterIdNumber = parseInt(characterId);
    user.favorites = user.favorites.filter(id => id !== characterIdNumber);
    await user.save();

    res.json({ 
      message: "Removed from favorites", 
      favorites: user.favorites 
    });
  } catch (error) {
    console.error("Remove from favorites error:", error);
    res.status(500).json({ message: "Failed to remove from favorites" });
  }
}

// Toggle favorite status
export async function toggleFavorite(req: AuthRequest, res: Response) {
  try {
    const userId = req.userId;
    const { characterId } = req.body;
    
    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    if (!characterId) {
      return res.status(400).json({ message: "Character ID is required" });
    }

    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Initialize favorites if it doesn't exist
    if (!user.favorites) {
      user.favorites = [];
    }

    const characterIdNumber = parseInt(characterId);
    const isFavorite = user.favorites.includes(characterIdNumber);

    if (isFavorite) {
      // Remove from favorites
      user.favorites = user.favorites.filter(id => id !== characterIdNumber);
    } else {
      // Add to favorites
      user.favorites.push(characterIdNumber);
    }

    await user.save();

    res.json({ 
      message: isFavorite ? "Removed from favorites" : "Added to favorites",
      isFavorite: !isFavorite,
      favorites: user.favorites 
    });
  } catch (error) {
    console.error("Toggle favorite error:", error);
    res.status(500).json({ message: "Failed to toggle favorite" });
  }
}
