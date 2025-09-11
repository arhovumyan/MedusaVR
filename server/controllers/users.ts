// controllers/users.ts
import { Request, Response } from "express";
import { UserModel } from "../db/models/UserModel.js";

export async function createUser(req: Request, res: Response) {
  try {
    const { username, email, password, avatar, bio } = req.body;

    const newUser = await UserModel.create({
      username,
      email,
      password,
      avatar: avatar ?? null,
      bio: bio ?? null
    });

    const { password: _, ...safe } = newUser.toObject();
    res.status(201).json(safe);
  } catch (err) {
    console.error("createUser error:", err);
    res.status(400).json({ message: "Invalid user data" });
  }
}

export async function getUsers(req: Request, res: Response) {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    const users = await UserModel.find().skip(offset).limit(limit).select("-password");
    res.json(users);
  } catch (err) {
    console.error("getUsers error:", err);
    res.status(500).json({ message: "Failed to fetch users" });
  }
}

export async function getUser(req: Request, res: Response) {
  try {
    const id = req.params.id;
    
    // Validate ObjectId format
    if (!/^[0-9a-fA-F]{24}$/.test(id)) {
      return res.status(400).json({ message: "Invalid user ID format" });
    }
    
    const user = await UserModel.findById(id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    console.error("getUser error:", err);
    res.status(500).json({ message: "Failed to fetch user" });
  }
}

export async function updateUser(req: Request, res: Response) {
  try {
    const userId = req.params.id;
    const authUserId = (req as any).userId || (req as any).user?.id;
    const updates = req.body;

    // Ensure user can only update their own profile
    if (userId !== authUserId) {
      return res.status(403).json({ message: "You can only update your own profile" });
    }

    // Validate username if being updated
    if (updates.username) {
      if (updates.username.length < 3 || updates.username.length > 30) {
        return res.status(400).json({ message: "Username must be between 3 and 30 characters" });
      }

      // Check if username is already taken
      const existingUser = await UserModel.findOne({ 
        username: updates.username,
        _id: { $ne: userId }
      });

      if (existingUser) {
        return res.status(400).json({ message: "Username is already taken" });
      }
    }

    // Only allow specific fields to be updated
    const allowedUpdates = ['username', 'bio', 'avatarUrl'];
    const filteredUpdates: any = {};
    
    for (const key of allowedUpdates) {
      if (updates[key] !== undefined) {
        filteredUpdates[key] = updates[key];
      }
    }

    const user = await UserModel.findByIdAndUpdate(
      userId,
      filteredUpdates,
      { new: true, runValidators: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      success: true,
      message: "Profile updated successfully",
      user
    });
  } catch (error) {
    console.error("Update user error:", error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: "Invalid data provided" });
    }
    res.status(500).json({ message: "Failed to update profile" });
  }
}

export async function deleteUser(req: Request, res: Response) {
  try {
    const userId = req.params.id;
    const authUserId = (req as any).userId || (req as any).user?.id;

    // Ensure user can only delete their own account
    if (userId !== authUserId) {
      return res.status(403).json({ message: "You can only delete your own account" });
    }

    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Delete user account
    await UserModel.findByIdAndDelete(userId);

    res.json({
      success: true,
      message: "Account deleted successfully"
    });
  } catch (error) {
    console.error("Delete user error:", error);
    res.status(500).json({ message: "Failed to delete account" });
  }
}

export async function updateUserPreferences(req: Request, res: Response) {
  try {
    // Get userId from authenticated user (set by requireAuth middleware)
    const authUserId = (req as any).userId || (req as any).user?.id;
    const paramUserId = req.params.id;
    
    if (!authUserId) {
      console.error('🔒 updateUserPreferences: No userId found in request');
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // Ensure user can only update their own preferences
    if (paramUserId && paramUserId !== authUserId) {
      return res.status(403).json({ error: 'You can only update your own preferences' });
    }

    const userId = authUserId;
    console.log('📊 updateUserPreferences: userId:', userId);
    
    const { selectedTags, nsfwEnabled, completedOnboarding } = req.body;

    // Validate selectedTags is an array of strings
    if (selectedTags && !Array.isArray(selectedTags)) {
      return res.status(400).json({ error: 'selectedTags must be an array' });
    }

    const updateData: any = {};
    if (selectedTags !== undefined) {
      updateData['preferences.selectedTags'] = selectedTags;
    }
    if (nsfwEnabled !== undefined) {
      updateData['preferences.nsfwEnabled'] = nsfwEnabled;
    }
    if (completedOnboarding !== undefined) {
      updateData['preferences.completedOnboarding'] = completedOnboarding;
    }

    console.log('📊 updateUserPreferences: updateData:', updateData);

    const user = await UserModel.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    console.log('✅ updateUserPreferences: success');
    res.json({ 
      message: 'Preferences updated successfully',
      preferences: user.preferences 
    });
  } catch (error) {
    console.error('❌ Error updating user preferences:', error);
    res.status(500).json({ error: 'Failed to update preferences' });
  }
}

export async function getLikedCharacters(req: Request, res: Response) {
  try {
    // For this endpoint, we can use either the param ID or the authenticated user ID
    const paramUserId = req.params.id;
    const authUserId = (req as any).userId || (req as any).user?.id;
    
    console.log('📊 getLikedCharacters: paramUserId:', paramUserId, 'authUserId:', authUserId);
    
    // Validate that the paramUserId is a valid MongoDB ObjectId
    if (paramUserId && !/^[0-9a-fA-F]{24}$/.test(paramUserId)) {
      console.log('❌ getLikedCharacters: Invalid MongoDB ObjectId format:', paramUserId);
      return res.status(400).json({ message: "Invalid user ID format" });
    }
    
    // Allow users to access their own liked characters or use the param if it matches
    const userId = paramUserId === authUserId ? authUserId : paramUserId;
    
    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }
    
    const user = await UserModel.findById(userId).select('likedCharacters');

    if (!user) {
      console.log('❌ getLikedCharacters: User not found for ID:', userId);
      return res.status(404).json({ message: "User not found" });
    }

    console.log('✅ getLikedCharacters: Found user with liked characters:', user.likedCharacters?.length || 0);
    res.json({ likedCharacters: user.likedCharacters || [] });
  } catch (err) {
    console.error("❌ getLikedCharacters error:", err);
    res.status(500).json({ message: "Failed to fetch liked characters" });
  }
}

export async function likeCharacter(req: Request, res: Response) {
  try {
    const userId = req.params.id;
    const { characterId } = req.body;

    if (!characterId) {
      return res.status(400).json({ message: "characterId is required" });
    }

    const user = await UserModel.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.likedCharacters.includes(characterId)) {
      return res.status(409).json({ message: "Character already liked" });
    }

    user.likedCharacters.push(characterId);
    await user.save();

    res.status(200).json({ message: "Character liked successfully" });
  } catch (err) {
    console.error("likeCharacter error:", err);
    res.status(500).json({ message: "Failed to like character" });
  }
}

export async function unlikeCharacter(req: Request, res: Response) {
  try {
    const userId = req.params.id;
    const { characterId } = req.body;

    if (!characterId) {
      return res.status(400).json({ message: "characterId is required" });
    }

    const user = await UserModel.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const characterIndex = user.likedCharacters.indexOf(characterId);

    if (characterIndex === -1) {
      return res.status(404).json({ message: "Character not liked" });
    }

    user.likedCharacters.splice(characterIndex, 1);
    await user.save();

    res.status(200).json({ message: "Character unliked successfully" });
  } catch (err) {
    console.error("unlikeCharacter error:", err);
    res.status(500).json({ message: "Failed to unlike character" });
  }
}

export async function cancelSubscription(req: Request, res: Response) {
  try {
    const userId = req.params.id;
    const authUserId = (req as any).userId || (req as any).user?.id;

    // Ensure user can only cancel their own subscription
    if (userId !== authUserId) {
      return res.status(403).json({ message: "You can only cancel your own subscription" });
    }

    const user = await UserModel.findByIdAndUpdate(
      userId,
      { 
        tier: 'free',
        subscriptionStatus: 'cancelled',
        subscriptionCancelledAt: new Date()
      },
      { new: true, runValidators: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ 
      message: "Subscription cancelled successfully",
      user: user
    });
  } catch (err) {
    console.error("cancelSubscription error:", err);
    res.status(500).json({ message: "Failed to cancel subscription" });
  }
}