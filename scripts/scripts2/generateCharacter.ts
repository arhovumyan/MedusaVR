#!/usr/bin/env node

/**
 * Advanced Character Generation Script
 * 
 * This script creates characters with:
 * - Avatar generation using your RunPod infrastructure
 * - Cloudinary folder structure (username/characters/character-name/)
 * - Database storage with all metadata
 * - Character embeddings for search/recommendations
 * - Fast, scalable approach using existing services
 * 
 * Usage:
 * npm run generate-character -- --name "Character Name" --description "Description" --style anime --tags "tag1,tag2"
 * or run with predefined data for testing
 */

import 'dotenv/config';
import mongoose from 'mongoose';
import { CharacterModel } from '../db/models/CharacterModel.js';
import { UserModel } from '../db/models/UserModel.js';
import { CharacterImageService } from '../services/CharacterImageService.js';
import { CloudinaryFolderService } from '../services/CloudinaryFolderService.js';
import { v2 as cloudinary } from 'cloudinary';
import { nanoid } from 'nanoid';
import crypto from 'crypto';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

interface CharacterGenerationData {
  name: string;
  description: string;
  personalityTraits: {
    mainTrait: string;
    subTraits: string[];
  };
  artStyle: {
    primaryStyle: string;
  };
  selectedTags: {
    [key: string]: string[];
  };
  isNsfw?: boolean;
  userId: string;
  username: string;
}

interface GenerationOptions {
  name?: string;
  description?: string;
  style?: string;
  tags?: string[];
  nsfw?: boolean;
  userId?: string;
  username?: string;
  count?: number;
}

class CharacterGenerator {
  private userId: string;
  private username: string;

  constructor(userId: string = "system", username: string = "MedusaVR") {
    this.userId = userId;
    this.username = username;
  }

  /**
   * Connect to MongoDB database
   */
  async connectDatabase(): Promise<void> {
    try {
      await mongoose.connect(process.env.MONGODB_URI!, {
        dbName: "test",
      });
      console.log(" MongoDB connected successfully");
    } catch (error) {
      console.error(" MongoDB connection failed:", error);
      throw error;
    }
  }

  /**
   * Generate a unique character ID
   */
  async generateUniqueCharacterId(): Promise<number> {
    let characterId: number;
    let exists = true;
    
    while (exists) {
      characterId = Math.floor(Math.random() * 1000000) + 100000; // 6-digit ID
      const existingChar = await CharacterModel.findOne({ id: characterId });
      exists = !!existingChar;
    }
    
    return characterId!;
  }

  /**
   * Generate character seed for consistency
   */
  generateCharacterSeed(name: string, description: string): number {
    const combined = `${name.toLowerCase()}_${description.toLowerCase()}`;
    const hash = crypto.createHash('md5').update(combined).digest('hex');
    return parseInt(hash.substring(0, 8), 16);
  }

  /**
   * Create embeddings for character search and recommendations
   */
  async createCharacterEmbeddings(characterData: CharacterGenerationData): Promise<any> {
    try {
      // Combine character data for embedding generation
      const embeddingText = [
        characterData.name,
        characterData.description,
        characterData.personalityTraits.mainTrait,
        ...characterData.personalityTraits.subTraits,
        ...Object.values(characterData.selectedTags).flat()
      ].join(' ');

      // For now, create a simple hash-based embedding
      // In production, you'd use OpenAI embeddings or similar
      const hash = crypto.createHash('sha256').update(embeddingText).digest('hex');
      const embedding = Array.from({ length: 384 }, (_, i) => 
        parseInt(hash.slice(i % hash.length, (i % hash.length) + 2), 16) / 255
      );

      return {
        text: embeddingText,
        vector: embedding,
        dimension: 384,
        model: 'hash-based-v1'
      };
    } catch (error) {
      console.error(' Error creating embeddings:', error);
      return null;
    }
  }

  /**
   * Create Cloudinary folder structure for character
   */
  async createCharacterFolders(characterName: string): Promise<boolean> {
    try {
      const safeName = characterName.toLowerCase().replace(/[^a-z0-9]/g, '-');
      const characterFolder = `${this.username}/characters/${safeName}`;
      
      console.log(` Creating Cloudinary folders for: ${characterFolder}`);

      // Create folder structure by uploading placeholder
      const placeholder = Buffer.from('placeholder');
      
      // Create subfolders for character
      const folders = [
        `${characterFolder}/avatar`,
        `${characterFolder}/images`,
        `${characterFolder}/variations`,
        `${characterFolder}/embeddings`
      ];

      for (const folder of folders) {
        await cloudinary.uploader.upload(`data:text/plain;base64,${placeholder.toString('base64')}`, {
          folder: folder,
          public_id: ".placeholder",
          resource_type: "raw",
          overwrite: true,
        });
        console.log(` Created folder: ${folder}`);
      }

      return true;
    } catch (error) {
      console.error(' Error creating character folders:', error);
      return false;
    }
  }

  /**
   * Upload character embeddings to Cloudinary
   */
  async uploadEmbeddings(characterName: string, embeddings: any): Promise<string | null> {
    try {
      const safeName = characterName.toLowerCase().replace(/[^a-z0-9]/g, '-');
      const embeddingsJson = JSON.stringify(embeddings, null, 2);
      
      const result = await cloudinary.uploader.upload(
        `data:application/json;base64,${Buffer.from(embeddingsJson).toString('base64')}`,
        {
          folder: `${this.username}/characters/${safeName}/embeddings`,
          public_id: `${safeName}-embeddings`,
          resource_type: "raw",
          overwrite: true,
        }
      );

      console.log(` Uploaded embeddings to: ${result.secure_url}`);
      return result.secure_url;
    } catch (error) {
      console.error(' Error uploading embeddings:', error);
      return null;
    }
  }

  /**
   * Generate and save a complete character
   */
  async generateCharacter(data: CharacterGenerationData): Promise<any> {
    try {
      console.log(` Generating character: ${data.name}`);
      console.log(` Description: ${data.description}`);
      console.log(` Art Style: ${data.artStyle.primaryStyle}`);
      console.log(`🏷️ Tags: ${JSON.stringify(data.selectedTags, null, 2)}`);

      // 1. Generate unique character ID
      const characterId = await this.generateUniqueCharacterId();
      console.log(`🆔 Generated character ID: ${characterId}`);

      // 2. Create character seed for consistency
      const characterSeed = this.generateCharacterSeed(data.name, data.description);
      console.log(`🌱 Character seed: ${characterSeed}`);

      // 3. Create Cloudinary folder structure
      await this.createCharacterFolders(data.name);

      // 4. Generate character avatar using existing service
      console.log(` Generating character avatar...`);
      const imageResult = await CharacterImageService.generateCharacterAvatar(
        {
          name: data.name,
          description: data.description,
          personalityTraits: data.personalityTraits,
          artStyle: data.artStyle,
          selectedTags: data.selectedTags
        },
        this.userId,
        this.username
      );

      if (!imageResult.success) {
        throw new Error(`Avatar generation failed: ${imageResult.error}`);
      }

      console.log(` Avatar generated: ${imageResult.imageUrl}`);

      // 5. Create character embeddings
      console.log(`🧠 Creating character embeddings...`);
      const embeddings = await this.createCharacterEmbeddings(data);
      let embeddingsUrl = null;
      
      if (embeddings) {
        embeddingsUrl = await this.uploadEmbeddings(data.name, embeddings);
      }

      // 6. Prepare character document for database
      const characterDocumentData = {
        id: characterId,
        avatar: imageResult.imageUrl!,
        name: data.name,
        description: data.description,
        quickSuggestion: `Chat with ${data.name}, ${data.personalityTraits.mainTrait} character`,
        rating: data.isNsfw ? 'R' : 'PG',
        nsfw: data.isNsfw || false,
        chatCount: 0,
        likes: 0,
        commentsCount: 0,
        creatorId: this.userId,
        
        // Enhanced character creation fields
        personalityTraits: data.personalityTraits,
        artStyle: data.artStyle,
        selectedTags: data.selectedTags,
        
        // Image generation data
        imageGeneration: {
          prompt: imageResult.generationData?.prompt || '',
          negativePrompt: imageResult.generationData?.negativePrompt || '',
          seed: imageResult.generationData?.generationSeed || characterSeed,
          characterSeed: characterSeed,
          steps: imageResult.generationData?.steps || 20,
          cfgScale: imageResult.generationData?.cfgScale || 8,
          width: imageResult.generationData?.width || 512,
          height: imageResult.generationData?.height || 768,
          model: imageResult.generationData?.model || 'stable-diffusion',
          generationTime: new Date()
        },
        
        // Image metadata
        imageMetadata: {
          cloudinaryPublicId: imageResult.generationData?.cloudinaryPublicId,
          uploadedAt: new Date(),
          originalFilename: `${data.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-avatar`,
          generationType: 'generated',
          originalImageUrl: imageResult.generationData?.originalGeneratedUrl,
          thumbnailUrl: imageResult.imageUrl,
          altVersions: []
        },
        
        // Creation metadata
        creationProcess: {
          stepCompleted: 5,
          totalSteps: 5,
          isDraft: false,
          lastSavedAt: new Date(),
          timeSpent: 0
        },

        // Embeddings metadata
        embeddings: embeddings ? {
          url: embeddingsUrl,
          dimension: embeddings.dimension,
          model: embeddings.model,
          createdAt: new Date()
        } : undefined
      };

      // 7. Save character to database
      console.log(` Saving character to database...`);
      const newCharacter = await CharacterModel.create(characterDocumentData);
      console.log(` Character saved with database ID: ${newCharacter._id}`);

      // 8. Return success result
      const result = {
        success: true,
        character: {
          id: newCharacter.id,
          _id: newCharacter._id,
          name: newCharacter.name,
          avatar: newCharacter.avatar,
          description: newCharacter.description,
          characterSeed: characterSeed,
          embeddingsUrl: embeddingsUrl,
          cloudinaryFolders: [
            `${this.username}/characters/${data.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}/avatar`,
            `${this.username}/characters/${data.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}/images`,
            `${this.username}/characters/${data.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}/variations`,
            `${this.username}/characters/${data.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}/embeddings`
          ]
        },
        message: 'Character generated and saved successfully!'
      };

      console.log(` Character generation completed successfully!`);
      console.log(` Summary:`, JSON.stringify(result, null, 2));
      
      return result;

    } catch (error) {
      console.error(` Character generation failed:`, error);
      throw error;
    }
  }

  /**
   * Generate multiple characters with predefined templates
   */
  async generateBatchCharacters(count: number = 5): Promise<any[]> {
    const results = [];
    
    const templates = [
      {
        name: "Aria Moonwhisper",
        description: "A mysterious elven sorceress with silver hair and piercing blue eyes. She specializes in lunar magic and has a gentle but powerful presence.",
        personalityTraits: {
          mainTrait: "mysterious",
          subTraits: ["wise", "caring", "magical"]
        },
        artStyle: { primaryStyle: "fantasy" },
        selectedTags: {
          'character-type': ["female"],
          'genre': ["fantasy"],
          'personality': ["mysterious", "wise", "caring"],
          'appearance': ["long-hair", "blue-eyes"],
          'origin': ["magical"],
          'content-rating': ["sfw"]
        }
      },
      {
        name: "Zara Nightstrike",
        description: "A cyberpunk hacker with neon-colored hair and a rebellious attitude. She navigates the digital underground with skill and style.",
        personalityTraits: {
          mainTrait: "rebellious",
          subTraits: ["confident", "tech-savvy", "independent"]
        },
        artStyle: { primaryStyle: "anime" },
        selectedTags: {
          'character-type': ["female"],
          'genre': ["sci-fi", "cyberpunk"],
          'personality': ["rebellious", "confident"],
          'appearance': ["colorful-hair"],
          'origin': ["human"],
          'content-rating': ["sfw"]
        }
      },
      {
        name: "Captain Marina Cross",
        description: "A skilled pirate captain with a heart of gold. She leads her crew with wisdom and protects the innocent from corrupt nobles.",
        personalityTraits: {
          mainTrait: "leadership",
          subTraits: ["brave", "protective", "adventurous"]
        },
        artStyle: { primaryStyle: "realistic" },
        selectedTags: {
          'character-type': ["female"],
          'genre': ["adventure", "historical"],
          'personality': ["leadership", "brave", "protective"],
          'appearance': ["brown-hair"],
          'origin': ["human"],
          'content-rating': ["sfw"]
        }
      },
      {
        name: "Dr. Elena Vasquez",
        description: "A brilliant scientist working on cutting-edge medical research. She's dedicated to finding cures for rare diseases and improving human health.",
        personalityTraits: {
          mainTrait: "intellectual",
          subTraits: ["dedicated", "compassionate", "methodical"]
        },
        artStyle: { primaryStyle: "realistic" },
        selectedTags: {
          'character-type': ["female"],
          'genre': ["modern", "sci-fi"],
          'personality': ["intellectual", "dedicated", "compassionate"],
          'appearance': ["glasses", "brown-hair"],
          'origin': ["human"],
          'content-rating': ["sfw"]
        }
      },
      {
        name: "Sakura Heartblossom",
        description: "A gentle anime-style character who loves flowers and tea ceremonies. She has a warm personality and brings peace to everyone around her.",
        personalityTraits: {
          mainTrait: "gentle",
          subTraits: ["peaceful", "kind", "traditional"]
        },
        artStyle: { primaryStyle: "anime" },
        selectedTags: {
          'character-type': ["female"],
          'genre': ["slice-of-life", "anime"],
          'personality': ["gentle", "peaceful", "kind"],
          'appearance': ["pink-hair", "traditional-clothing"],
          'origin': ["human"],
          'content-rating': ["sfw"]
        }
      }
    ];

    for (let i = 0; i < Math.min(count, templates.length); i++) {
      try {
        console.log(`\n Generating character ${i + 1}/${count}...`);
        const characterData = {
          ...templates[i],
          userId: this.userId,
          username: this.username
        };
        
        const result = await this.generateCharacter(characterData);
        results.push(result);
        
        // Add delay between generations to avoid rate limiting
        console.log(`⏳ Waiting 2 seconds before next generation...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
        
      } catch (error) {
        console.error(` Failed to generate character ${i + 1}:`, error);
        results.push({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          characterName: templates[i]?.name || `Character ${i + 1}`
        });
      }
    }

    return results;
  }
}

/**
 * Parse command line arguments
 */
function parseArgs(): GenerationOptions {
  const args = process.argv.slice(2);
  const options: GenerationOptions = {};

  for (let i = 0; i < args.length; i += 2) {
    const key = args[i]?.replace('--', '');
    const value = args[i + 1];

    switch (key) {
      case 'name':
        options.name = value;
        break;
      case 'description':
        options.description = value;
        break;
      case 'style':
        options.style = value;
        break;
      case 'tags':
        options.tags = value?.split(',');
        break;
      case 'nsfw':
        options.nsfw = value === 'true';
        break;
      case 'count':
        options.count = parseInt(value) || 1;
        break;
      case 'userId':
        options.userId = value;
        break;
      case 'username':
        options.username = value;
        break;
    }
  }

  return options;
}

/**
 * Main execution function
 */
async function main() {
  console.log(' MedusaVR Character Generator Starting...\n');

  try {
    // Parse command line arguments
    const options = parseArgs();
    
    // Initialize generator
    const generator = new CharacterGenerator(
      options.userId || "675b5b3b123456789abcdef0", // Default system user ID
      options.username || "MedusaVR"
    );

    // Connect to database
    await generator.connectDatabase();

    if (options.name && options.description) {
      // Generate single character from command line args
      console.log(' Generating single character from provided arguments...');
      
      const characterData: CharacterGenerationData = {
        name: options.name,
        description: options.description,
        personalityTraits: {
          mainTrait: options.tags?.[0] || "friendly",
          subTraits: options.tags?.slice(1, 4) || ["kind", "helpful"]
        },
        artStyle: { primaryStyle: options.style || "anime" },
        selectedTags: {
          'character-type': ["female"],
          'personality': options.tags || ["friendly"],
          'content-rating': [options.nsfw ? "nsfw" : "sfw"]
        },
        isNsfw: options.nsfw || false,
        userId: options.userId || "675b5b3b123456789abcdef0",
        username: options.username || "MedusaVR"
      };

      const result = await generator.generateCharacter(characterData);
      console.log('\n Single character generation completed!');
      
    } else {
      // Generate batch characters with templates
      console.log(' Generating batch characters with predefined templates...');
      
      const count = options.count || 3;
      const results = await generator.generateBatchCharacters(count);
      
      console.log('\n Batch Generation Summary:');
      console.log(`Total: ${results.length}`);
      console.log(`Successful: ${results.filter(r => r.success).length}`);
      console.log(`Failed: ${results.filter(r => !r.success).length}`);
      
      results.forEach((result, index) => {
        if (result.success) {
          console.log(` ${index + 1}. ${result.character.name} - ID: ${result.character.id}`);
        } else {
          console.log(` ${index + 1}. ${result.characterName} - Error: ${result.error}`);
        }
      });
    }

    console.log('\n Character generation completed successfully!');
    
  } catch (error) {
    console.error(' Character generation failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log(' Database disconnected');
  }
}

// Run the script
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { CharacterGenerator };
