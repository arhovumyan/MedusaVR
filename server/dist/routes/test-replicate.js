import { Router } from "express";
import { replicateService } from "../services/ReplicateService.js";
const router = Router();
// Test endpoint to verify Replicate integration
router.post("/test-ai", async (req, res) => {
    try {
        const { message, characterName, characterDescription } = req.body;
        if (!message) {
            return res.status(400).json({ error: "Message is required" });
        }
        console.log("🧪 Testing Replicate with:", { message, characterName, characterDescription });
        const response = await replicateService.generateResponse(message, characterName || "TestBot", characterDescription || "You are a friendly AI assistant.");
        res.json({
            success: true,
            userMessage: message,
            aiResponse: response,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        console.error("❌ Test endpoint error:", error);
        res.status(500).json({
            error: "Failed to generate AI response",
            details: error instanceof Error ? error.message : "Unknown error"
        });
    }
});
// Health check for Replicate service
router.get("/health", async (req, res) => {
    try {
        const isHealthy = await replicateService.testConnection();
        res.json({
            status: isHealthy ? "healthy" : "unhealthy",
            service: "Replicate",
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        res.status(500).json({
            status: "error",
            service: "Replicate",
            error: error instanceof Error ? error.message : "Unknown error",
            timestamp: new Date().toISOString()
        });
    }
});
export default router;
