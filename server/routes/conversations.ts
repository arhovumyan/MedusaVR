import { Router } from "express";
import { getConversation, getUserConversations, deleteConversation } from "../controllers/conversations.js";
import { requireAuth } from "../middleware/requireAuth.js";

const router = Router();

router.get("/:characterId", requireAuth, getConversation);
router.get("/", requireAuth, getUserConversations);
router.delete("/:conversationId", requireAuth, deleteConversation);

export default router;
