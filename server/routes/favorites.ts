import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { 
  getFavorites, 
  addToFavorites, 
  removeFromFavorites, 
  toggleFavorite 
} from "../controllers/favorites.js";

const router = Router();

// Test endpoint to verify the router is working (no auth required)
router.get("/test", (_req, res) => {
  res.json({ message: "Favorites router is working!" });
});

// All other favorites routes require authentication
router.use(requireAuth);

// GET /api/favorites - Get user's favorites
router.get("/", getFavorites);

// POST /api/favorites - Add character to favorites
router.post("/", addToFavorites);

// DELETE /api/favorites/:characterId - Remove character from favorites
router.delete("/:characterId", removeFromFavorites);

// POST /api/favorites/toggle - Toggle favorite status
router.post("/toggle", toggleFavorite);

export default router;
