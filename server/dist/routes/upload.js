import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import multer from 'multer';
import { UserModel } from "../db/models/UserModel.js";
import { BunnyStorageService } from '../services/BunnyStorageService.js';
const router = Router();
console.log('🔍 UPLOAD ROUTER - Loading upload routes');
// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
    },
    fileFilter: (req, file, cb) => {
        console.log('🔍 MULTER DEBUG - File filter called:', {
            originalname: file.originalname,
            mimetype: file.mimetype,
            size: file.size
        });
        // Check file type
        if (file.mimetype.startsWith('image/')) {
            console.log('✅ MULTER DEBUG - File type accepted');
            cb(null, true);
        }
        else {
            console.log('❌ MULTER DEBUG - File type rejected');
            cb(new Error('Only image files are allowed'));
        }
    }
});
// Simple test endpoint to debug upload flow (no auth required)
router.get("/test", (req, res) => {
    console.log('🔍 GET TEST UPLOAD ENDPOINT - Reached');
    res.json({ message: "GET test endpoint works" });
});
// Avatar upload endpoint with inline implementation
router.post("/avatar", (req, res, next) => {
    console.log('🔍 AVATAR UPLOAD - Pre-auth middleware hit');
    console.log('🔍 AVATAR UPLOAD - Headers:', req.headers['content-type']);
    console.log('🔍 AVATAR UPLOAD - Has files:', !!req.files);
    console.log('🔍 AVATAR UPLOAD - Body:', Object.keys(req.body || {}));
    next();
}, requireAuth, (req, res, next) => {
    console.log('🔍 AVATAR UPLOAD - Post-auth middleware hit');
    console.log('🔍 AVATAR UPLOAD - User ID:', req.userId);
    next();
}, upload.single('avatar'), async (req, res) => {
    try {
        console.log('🔍 AVATAR UPLOAD - Request received');
        console.log('🔍 AVATAR UPLOAD - Headers:', req.headers['content-type']);
        const userId = req.userId; // Set by auth middleware
        const file = req.file;
        console.log('🔍 AVATAR UPLOAD - File object:', file ? {
            originalname: file.originalname,
            mimetype: file.mimetype,
            size: file.size,
            buffer: file.buffer ? 'present' : 'missing'
        } : 'null');
        if (!file) {
            console.error('❌ AVATAR UPLOAD - No file uploaded');
            return res.status(400).json({ message: "No file uploaded" });
        }
        // Get user to access username for folder structure
        const user = await UserModel.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        // Upload to Bunny CDN using buffer with username-based folder structure
        const timestamp = Date.now();
        const fileName = `avatar.png`; // Use consistent filename as requested
        // Upload directly to userName/avatar/avatar.png structure
        const filePath = `${user.username}/avatar/${fileName}`;
        console.log('🔍 AVATAR UPLOAD - Uploading to Bunny CDN:', filePath);
        const uploadResult = await BunnyStorageService.uploadFile(filePath, file.buffer, file.mimetype);
        if (!uploadResult.success) {
            console.error('❌ Bunny CDN upload error:', uploadResult.error);
            return res.status(500).json({
                message: "Failed to upload avatar to Bunny CDN",
                error: uploadResult.error
            });
        }
        const avatarUrl = uploadResult.url;
        // Update user profile with new avatar URL
        const updatedUser = await UserModel.findByIdAndUpdate(userId, { avatarUrl: avatarUrl }, // Use avatarUrl field
        { new: true }).select("-password");
        if (!updatedUser) {
            return res.status(404).json({ message: "User not found" });
        }
        console.log('✅ AVATAR UPLOAD - Success:', avatarUrl);
        res.json({
            url: avatarUrl,
            public_id: filePath, // Use file path as public ID for Bunny CDN
            message: "Avatar uploaded successfully to Bunny CDN"
        });
    }
    catch (error) {
        console.error("❌ Avatar upload error:", error);
        res.status(500).json({
            message: "Failed to upload avatar",
            error: error instanceof Error ? error.message : "Unknown error"
        });
    }
});
// Simple test endpoint to debug upload flow
router.post("/avatar/test", requireAuth, (req, res) => {
    console.log('🔍 TEST UPLOAD ENDPOINT - Reached');
    console.log('🔍 TEST UPLOAD ENDPOINT - Headers:', req.headers['content-type']);
    console.log('🔍 TEST UPLOAD ENDPOINT - Body keys:', Object.keys(req.body));
    res.json({ message: "Test endpoint reached successfully" });
});
console.log('🔍 UPLOAD ROUTER - Upload routes loaded successfully');
export default router;
