// src/db/models/CharacterModel.ts
import { Schema, model } from "mongoose";
import mongoose from "mongoose";
const CharacterSchema = new Schema({
    id: { type: Number, required: true, unique: true },
    avatar: { type: String, required: true }, // Cloudinary URL for character image
    name: { type: String, required: true },
    description: { type: String, required: true },
    age: { type: Number, required: true, min: 18, validate: {
            validator: function (value) {
                return value >= 18;
            },
            message: 'Character age must be 18 or above. All characters must be adults.'
        } }, // Character age - MUST be 18 or above
    quickSuggestion: { type: String, maxlength: 1000 }, // Quick character interaction suggestion
    rating: { type: String },
    nsfw: { type: Boolean, default: false },
    chatCount: { type: Number, default: 0 },
    likes: { type: Number, default: 0 },
    commentsCount: { type: Number, default: 0 },
    creatorId: { type: Schema.Types.ObjectId, ref: 'User' }, // Reference to user who created this character
    // Enhanced character creation fields
    personalityTraits: {
        mainTrait: { type: String }, // e.g., "calm"
        subTraits: [{ type: String }] // e.g., ["peaceful", "composed"]
    },
    artStyle: {
        primaryStyle: { type: String }, // e.g., "anime"
    },
    selectedTags: {
        'character-type': [{ type: String }], // e.g., ["female"]
        'genre': [{ type: String }], // e.g., ["sci-fi"]
        'personality': [{ type: String }], // e.g., ["confident"]
        'appearance': [{ type: String }], // e.g., ["long-hair"]
        'origin': [{ type: String }], // e.g., ["human"]
        'sexuality': [{ type: String }], // e.g., ["straight"]
        'fantasy': [{ type: String }], // e.g., ["magic-user"]
        'content-rating': [{ type: String }], // e.g., ["sfw"]
        'ethnicity': [{ type: String }], // e.g., ["asian"]
        'scenario': [{ type: String }] // e.g., ["school"]
    },
    // Image generation data
    imageGeneration: {
        prompt: { type: String }, // Generated prompt sent to Stable Diffusion
        negativePrompt: { type: String }, // Negative prompt for better results
        stylePrompt: { type: String }, // Style-specific prompt additions
        seed: { type: Number }, // For reproducible results
        characterSeed: { type: Number }, // Character-specific seed for consistent identity
        steps: { type: Number, default: 20 }, // Generation steps
        cfgScale: { type: Number, default: 7 }, // Guidance scale
        width: { type: Number, default: 512 },
        height: { type: Number, default: 768 },
        model: { type: String }, // Stable Diffusion model used
        generationTime: { type: Date }, // When the image was generated
        runpodJobId: { type: String } // RunPod job ID for tracking
    },
    // Character embeddings for search and similarity
    embeddings: {
        url: { type: String }, // Cloudinary URL for embeddings file
        dimension: { type: Number, default: 384 }, // Vector dimension
        model: { type: String, default: 'hash-based-v1' }, // Embedding model used
        text: { type: String }, // Text used for embedding generation
        vector: [{ type: Number }], // The actual embedding vector
        characterSeed: { type: Number }, // Seed used for embedding generation
        // Image embeddings for character consistency
        imageEmbeddings: {
            metadataUrl: { type: String }, // Cloudinary URL for embedding metadata JSON
            totalImages: { type: Number, default: 0 }, // Number of embedding images generated
            cloudinaryUrls: [{ type: String }], // Array of Cloudinary URLs for all embedding images
            version: { type: String, default: '1.0' }, // Embedding version for compatibility
            createdAt: { type: Date }, // When embedding images were generated
            status: { type: String, enum: ['pending', 'generating', 'completed', 'failed'], default: 'pending' },
            generationStartedAt: { type: Date },
            generationCompletedAt: { type: Date }
        }
    },
    // Image metadata (enhanced)
    imageMetadata: {
        cloudinaryPublicId: { type: String }, // For deletion/updates
        uploadedAt: { type: Date, default: Date.now },
        originalFilename: { type: String },
        generationType: { type: String, enum: ['uploaded', 'generated', 'placeholder'], default: 'uploaded' },
        originalImageUrl: { type: String }, // URL from generation service before Cloudinary
        thumbnailUrl: { type: String }, // Smaller version for previews
        altVersions: [{
                url: { type: String },
                cloudinaryPublicId: { type: String },
                prompt: { type: String },
                seed: { type: Number }
            }]
    },
    // Creation metadata
    creationProcess: {
        stepCompleted: { type: Number, default: 0 }, // For multi-step creation
        totalSteps: { type: Number, default: 5 },
        isDraft: { type: Boolean, default: false },
        lastSavedAt: { type: Date, default: Date.now },
        timeSpent: { type: Number, default: 0 } // Time spent creating (in seconds)
    }
}, {
    timestamps: true
});
// Indexes for tag-based queries
CharacterSchema.index({ name: 'text', description: 'text' });
// New indexes for enhanced search
CharacterSchema.index({ 'personalityTraits.mainTrait': 1 });
CharacterSchema.index({ 'artStyle.primaryStyle': 1 });
CharacterSchema.index({ 'artStyle.secondaryStyle': 1 });
CharacterSchema.index({ 'selectedTags.character-type': 1 });
CharacterSchema.index({ 'selectedTags.genre': 1 });
CharacterSchema.index({ 'selectedTags.scenario': 1 });
CharacterSchema.index({ 'creationProcess.isDraft': 1 });
export const CharacterModel = mongoose.models.Character || model("Character", CharacterSchema, "characters");
export const Character = CharacterModel;
