import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import {
  followUser,
  unfollowUser,
  getFollowers,
  getFollowing,
  checkFollowStatus,
  getMutualFollowers
} from "../controllers/follows.js";

const router = Router();

// Public routes
router.get("/users/:userId/followers", getFollowers);
router.get("/users/:userId/following", getFollowing);
router.get("/users/:userId/mutual", requireAuth, getMutualFollowers);

// Protected routes
router.post("/users/:userId/follow", requireAuth, followUser);
router.delete("/users/:userId/follow", requireAuth, unfollowUser);
router.get("/users/:userId/follow-status", requireAuth, checkFollowStatus);

export default router;