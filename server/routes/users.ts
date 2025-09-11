import { Router } from "express";
import { getUser, getUsers, updateUser, deleteUser, updateUserPreferences, getLikedCharacters, likeCharacter, unlikeCharacter, cancelSubscription } from "../controllers/users.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

// Debug route to test endpoint availability
router.get("/debug/:id", (req, res) => {
  res.json({ 
    message: "Debug endpoint working", 
    userId: req.params.id,
    timestamp: new Date().toISOString()
  });
});

// List users (protected)
router.get("/", requireAuth, getUsers);
router.get("/:id", getUser);

// Update user profile (protected)
router.put("/:id", requireAuth, updateUser);

// Delete user account (protected)
router.delete("/:id", requireAuth, deleteUser);

// Update user preferences
router.put("/:id/preferences", requireAuth, updateUserPreferences);

// Liked characters endpoints
router.get("/:id/likedCharacters", requireAuth, getLikedCharacters);
router.post("/:id/likedCharacters", requireAuth, likeCharacter);
router.delete("/:id/likedCharacters", requireAuth, unlikeCharacter);

// Cancel subscription endpoint
router.post("/:id/cancel-subscription", requireAuth, cancelSubscription);

// REMOVED DANGEROUS ENDPOINTS:
// - POST / (createUser) - Use /api/auth/register instead
// - PUT /:id (updateUser) - Use /api/auth/me for profile updates  
// - DELETE /:id (deleteUser) - No public user deletion allowed

export default router;