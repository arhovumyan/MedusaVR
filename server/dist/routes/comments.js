// src/routes/comments.ts
import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { getCharacterComments, createComment, likeComment, deleteComment, editComment } from "../controllers/comments.js";
const router = Router();
// Character comments routes
router.get("/characters/:characterId/comments", getCharacterComments);
router.post("/characters/:characterId/comments", requireAuth, createComment);
// Individual comment routes
router.post("/comments/:commentId/like", requireAuth, likeComment);
router.put("/comments/:commentId", requireAuth, editComment);
router.delete("/comments/:commentId", requireAuth, deleteComment);
export default router;
