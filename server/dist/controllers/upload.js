import { UserModel } from "../db/models/UserModel.js";
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { BunnyStorageService } from '../services/BunnyStorageService.js';
// Configure Cloudinary (keeping for backward compatibility if needed)
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});
// Configure multer for memory storage (we'll upload directly to Bunny CDN)
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
export const avatarUpload = (req, res, next) => {
    console.log('🔍 AVATAR UPLOAD MIDDLEWARE - Called');
    console.log('🔍 AVATAR UPLOAD MIDDLEWARE - Content-Type:', req.headers['content-type']);
    console.log('🔍 AVATAR UPLOAD MIDDLEWARE - Content-Length:', req.headers['content-length']);
    const singleUpload = upload.single('avatar');
    singleUpload(req, res, (err) => {
        if (err) {
            console.error('❌ AVATAR UPLOAD MIDDLEWARE - Error:', err);
            return res.status(400).json({ message: err.message });
        }
        console.log('✅ AVATAR UPLOAD MIDDLEWARE - Success');
        console.log('🔍 AVATAR UPLOAD MIDDLEWARE - File:', req.file ? {
            originalname: req.file.originalname,
            mimetype: req.file.mimetype,
            size: req.file.size
        } : 'null');
        next();
    });
};
export const characterImageUpload = upload.single('characterImage');
// Handle avatar upload with file
export async function uploadAvatar(req, res) {
    try {
        console.log('🔍 AVATAR UPLOAD DEBUG - Request received');
        console.log('🔍 AVATAR UPLOAD DEBUG - Headers:', req.headers['content-type']);
        console.log('🔍 AVATAR UPLOAD DEBUG - Body keys:', Object.keys(req.body));
        const userId = req.userId; // Set by auth middleware
        const file = req.file;
        console.log('🔍 AVATAR UPLOAD DEBUG - File object:', file ? {
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
        const uploadResult = await BunnyStorageService.uploadFile(filePath, file.buffer, file.mimetype);
        if (!uploadResult.success) {
            console.error('Bunny CDN upload error:', uploadResult.error);
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
        res.json({
            url: avatarUrl,
            public_id: filePath, // Use file path as public ID for Bunny CDN
            message: "Avatar uploaded successfully to Bunny CDN"
        });
    }
    catch (error) {
        console.error("Avatar upload error:", error);
        res.status(500).json({
            message: "Failed to upload avatar",
            error: error instanceof Error ? error.message : "Unknown error"
        });
    }
}
// Handle character image upload with file
export async function uploadCharacterImage(req, res) {
    try {
        const userId = req.userId; // Set by auth middleware
        const file = req.file;
        const { characterId } = req.body; // Optional: for updating existing character
        if (!file) {
            return res.status(400).json({ message: "No file uploaded" });
        }
        // Get user to access username for folder structure
        const user = await UserModel.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        // Upload to Bunny CDN using buffer with username-based character folder
        const timestamp = Date.now();
        const fileName = characterId ? `character_${characterId}_${timestamp}.jpg` : `character_${timestamp}.jpg`;
        // Upload to userName/characters/general/images/ structure
        const filePath = `${user.username}/characters/general/images/${fileName}`;
        const uploadResult = await BunnyStorageService.uploadFile(filePath, file.buffer, file.mimetype);
        if (!uploadResult.success) {
            console.error('Bunny CDN character upload error:', uploadResult.error);
            return res.status(500).json({
                message: "Failed to upload character image to Bunny CDN",
                error: uploadResult.error
            });
        }
        const characterImageUrl = uploadResult.url;
        // If characterId is provided, update the existing character
        if (characterId) {
            const { CharacterModel } = await import('../db/models/CharacterModel');
            const updatedCharacter = await CharacterModel.findByIdAndUpdate(characterId, {
                avatar: characterImageUrl,
                imageMetadata: {
                    bunnyPublicId: filePath, // Use file path as public ID for Bunny CDN
                    uploadedAt: new Date(),
                    originalFilename: file.originalname
                }
            }, { new: true });
            if (!updatedCharacter) {
                return res.status(404).json({ message: "Character not found" });
            }
            res.json({
                url: characterImageUrl,
                public_id: filePath, // Use file path as public ID for Bunny CDN
                character: updatedCharacter,
                message: "Character image updated successfully"
            });
        }
        else {
            // Just return the uploaded image URL for new character creation
            res.json({
                url: characterImageUrl,
                public_id: filePath, // Use file path as public ID for Bunny CDN
                metadata: {
                    bunnyPublicId: filePath, // Use file path as public ID for Bunny CDN
                    uploadedAt: new Date(),
                    originalFilename: file.originalname
                },
                message: "Character image uploaded successfully"
            });
        }
    }
    catch (error) {
        console.error("Character image upload error:", error);
        res.status(500).json({
            message: "Failed to upload character image",
            error: error instanceof Error ? error.message : "Unknown error"
        });
    }
}
// Simple base64 avatar upload for demo purposes (alternative endpoint)
export async function uploadAvatarBase64(req, res) {
    try {
        const userId = req.userId; // Set by auth middleware
        // For now, we'll accept the image as base64 data URL from the frontend
        const { imageData } = req.body;
        if (!imageData) {
            return res.status(400).json({ message: "No image data provided" });
        }
        // Validate that it's a valid data URL
        if (!imageData.startsWith('data:image/')) {
            return res.status(400).json({ message: "Invalid image data format" });
        }
        // For demo purposes, we'll store the data URL directly
        // In production, you'd upload to a proper storage service and store the URL
        const updatedUser = await UserModel.findByIdAndUpdate(userId, { avatar: imageData }, { new: true }).select("-password");
        if (!updatedUser) {
            return res.status(404).json({ message: "User not found" });
        }
        res.json({
            url: imageData,
            message: "Avatar uploaded successfully"
        });
    }
    catch (error) {
        console.error("Avatar upload error:", error);
        res.status(500).json({ message: "Failed to upload avatar" });
    }
}
// For production use with actual file uploads using multer:
/*
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const upload = multer({ dest: 'uploads/' });

export async function uploadAvatarFile(req: Request, res: Response) {
  try {
    const userId = (req as any).userId;
    const file = req.file;
    
    if (!file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(file.path, {
      folder: 'avatars',
      width: 400,
      height: 400,
      crop: 'fill',
      format: 'jpg'
    });

    // Update user profile with new avatar URL
    const updatedUser = await UserModel.findByIdAndUpdate(
      userId,
      { avatar: result.secure_url },
      { new: true }
    ).select("-password");

    res.json({
      url: result.secure_url,
      message: "Avatar uploaded successfully"
    });
  } catch (error) {
    console.error("Avatar upload error:", error);
    res.status(500).json({ message: "Failed to upload avatar" });
  }
}
*/
