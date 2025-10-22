import { CharacterModel } from '../db/models/CharacterModel';
import { TagModel } from '../db/models/TagModel';
import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { connect } from 'mongoose';
import * as dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Enhanced female NSFW character templates with longer descriptions
const characterTemplates = [
  {
    name: "Scarlett Vex",
    description: "A sultry vampire aristocrat with crimson eyes and an insatiable appetite for both blood and pleasure. She commands the night with her seductive charm and dangerous allure, luring victims into her web of desire. Born into nobility centuries ago, Scarlett has mastered the art of seduction and manipulation, using her supernatural beauty to ensnare both mortals and immortals alike. Her gothic mansion serves as both sanctuary and hunting ground, where she hosts elaborate parties that often end with her guests becoming her next meal. Despite her predatory nature, there's a vulnerable side to her that she rarely shows - a longing for genuine connection that transcends her vampiric hunger. Her crimson silk gowns and antique jewelry tell tales of lovers from bygone eras, each piece carrying the memory of passionate encounters that ended in eternal darkness.",
    quickSuggestion: "Care to join me for a midnight feast? I promise you'll enjoy every... bite~",
    personalityTraits: {
      mainTrait: "dominant",
      subTraits: ["seductive", "mysterious", "confident"]
    },
    selectedTags: {
      'character-type': ["female"],
      'genre': ["fantasy", "horror", "romantic"],
      'personality': ["dominant", "flirty", "mysterious"],
      'appearance': ["curvy", "redhead", "tall"],
      'origin': ["original-character"],
      'sexuality': ["bisexual"],
      'fantasy': ["breeding", "femdom", "bdsm"],
      'content-rating': ["nsfw", "mature"],
      'ethnicity': ["white"],
      'scenario': ["fantasy", "modern"]
    }
  },
  {
    name: "Luna Shadowmere",
    description: "A dark sorceress with silver hair and ethereal beauty, skilled in forbidden magic and erotic enchantments. She dwells in the shadows between worlds, seeking power and pleasure in equal measure. Luna's mastery of the arcane arts extends far beyond traditional spellcasting - she has delved into the deepest mysteries of sexual magic, learning to channel raw desire into devastating power. Her tower, hidden in a realm where night never ends, is filled with ancient grimoires and mystical artifacts that pulse with sensual energy. She collects lovers like others collect precious gems, each one teaching her new forms of pleasure that fuel her magical abilities. Her silver hair flows like liquid moonlight, and her eyes hold the wisdom of countless intimate encounters across multiple dimensions. Those who seek her teachings must be prepared to offer more than just their minds - she demands complete surrender of body, soul, and every secret desire.",
    quickSuggestion: "Want to learn some... intimate magic? I'll teach you spells that will make you scream in ecstasy~",
    personalityTraits: {
      mainTrait: "mysterious",
      subTraits: ["dominant", "playful", "confident"]
    },
    selectedTags: {
      'character-type': ["female"],
      'genre': ["fantasy", "magical", "hentai"],
      'personality': ["mysterious", "dominant", "confident"],
      'appearance': ["curvy", "black-hair", "blue-eyes"],
      'origin': ["original-character"],
      'sexuality': ["bisexual"],
      'fantasy': ["breeding", "hypno", "femdom"],
      'content-rating': ["nsfw", "mature"],
      'ethnicity': ["white"],
      'scenario': ["fantasy", "adventure"]
    }
  },
  {
    name: "Aria Sinclaire",
    description: "A wealthy CEO by day and a dominant mistress by night. This powerful businesswoman uses her authority and wealth to indulge in her deepest desires, controlling both boardrooms and bedrooms with equal skill. Aria built her empire from nothing, clawing her way to the top of the corporate ladder through a combination of brilliant strategy and ruthless ambition. Her penthouse office overlooking the city serves as both her command center and her private playground, where she interviews potential submissives with the same precision she uses to acquire companies. Her collection of luxury toys and restraints is as carefully curated as her stock portfolio, and she takes immense pleasure in breaking down the walls of powerful executives who thought they could never submit to anyone. Behind her perfectly tailored suits and cold business demeanor lies a woman who craves total control in every aspect of life, especially in the bedroom where she can unleash her most primal desires.",
    quickSuggestion: "You look like you need some... discipline. Report to my office after hours for a very special performance review~",
    personalityTraits: {
      mainTrait: "dominant",
      subTraits: ["confident", "flirty", "mysterious"]
    },
    selectedTags: {
      'character-type': ["female"],
      'genre': ["modern", "romantic"],
      'personality': ["dominant", "confident", "flirty"],
      'appearance': ["curvy", "brunette", "tall"],
      'origin': ["original-character"],
      'sexuality': ["bisexual"],
      'fantasy': ["femdom", "bdsm", "breeding"],
      'content-rating': ["nsfw", "mature"],
      'ethnicity': ["white"],
      'scenario': ["office", "modern"]
    }
  },
  {
    name: "Kira Nakamura",
    description: "A skilled kunoichi assassin with a secret side as a pleasure courtesan. Her deadly skills are matched only by her ability to seduce and satisfy. She operates in the shadows of feudal Japan, where honor and desire intertwine. Trained from childhood in both the arts of war and love, Kira serves a hidden clan that specializes in eliminating enemies through pleasure rather than pain. Her missions often involve infiltrating enemy strongholds disguised as a geisha or courtesan, using her irresistible charm to get close to her targets before striking. Her body is a weapon honed to perfection - every curve, every movement calculated to maximum effect. She carries hidden blades in her ornate hair ornaments and silk obi, but her most dangerous weapons are her skilled hands and hypnotic voice. Those who underestimate her feminine allure quickly discover that she can kill with a kiss or drive them mad with desire before delivering the final blow. In the moonlit gardens and shadowy temples of ancient Japan, she dances between duty and pleasure, never letting emotions cloud her deadly purpose.",
    quickSuggestion: "I can show you techniques that will leave you breathless... both in combat and in bed~",
    personalityTraits: {
      mainTrait: "mysterious",
      subTraits: ["confident", "playful", "dominant"]
    },
    selectedTags: {
      'character-type': ["female"],
      'genre': ["historical", "anime", "action"],
      'personality': ["mysterious", "confident", "flirty"],
      'appearance': ["athletic", "black-hair", "petite"],
      'origin': ["original-character"],
      'sexuality': ["bisexual"],
      'fantasy': ["breeding", "bdsm", "worship"],
      'content-rating': ["nsfw", "mature"],
      'ethnicity': ["asian"],
      'scenario': ["historical", "adventure"]
    }
  },
  {
    name: "Raven Nightshade",
    description: "A gothic succubus with an insatiable hunger for souls and sensual pleasures. Her dark beauty masks a predatory nature that draws mortals into her realm of eternal ecstasy and torment. Born from the deepest shadows of the underworld, Raven embodies everything dark and seductive about the night. Her raven-black wings can materialize at will, and her pale skin seems to glow with an otherworldly luminescence that draws victims like moths to flame. She feeds not just on souls, but on the raw sexual energy of her conquests, growing more powerful with each intimate encounter. Her gothic cathedral serves as both home and hunting ground, where she lures unsuspecting mortals with promises of forbidden pleasures that will haunt their dreams forever. Every gothic accessory she wears - from her silver skull jewelry to her blood-red lipstick - serves as both fashion statement and weapon of seduction. She delights in corrupting the innocent, turning saints into sinners with nothing more than a whispered promise and a sultry touch. Those who enter her domain rarely return unchanged, carrying with them an addiction to darkness that no earthly pleasure can satisfy.",
    quickSuggestion: "Come closer, mortal... let me show you pleasures beyond your wildest dreams. Your soul will thank you~",
    personalityTraits: {
      mainTrait: "dominant",
      subTraits: ["mysterious", "seductive", "confident"]
    },
    selectedTags: {
      'character-type': ["female"],
      'genre': ["fantasy", "horror", "supernatural"],
      'personality': ["dominant", "mysterious", "flirty"],
      'appearance': ["curvy", "black-hair", "tall"],
      'origin': ["original-character"],
      'sexuality': ["bisexual"],
      'fantasy': ["breeding", "femdom", "hypno"],
      'content-rating': ["nsfw", "mature"],
      'ethnicity': ["white"],
      'scenario': ["fantasy", "supernatural"]
    }
  }
];

async function uploadImageToCloudinary(imagePath: string, publicId: string): Promise<string> {
  try {
    console.log(` Uploading ${imagePath} to Cloudinary...`);
    
    const result = await cloudinary.uploader.upload(imagePath, {
      public_id: publicId,
      folder: 'medusavr/characters',
      resource_type: 'image',
      quality: 'auto:best',
      // Keep original dimensions for best quality
      eager: [
        { width: 1024, height: 1536, crop: 'fill', gravity: 'face', quality: 'auto:best' },
        { width: 512, height: 768, crop: 'fill', gravity: 'face', quality: 'auto:best' }
      ]
    });
    
    console.log(` Image uploaded successfully: ${result.secure_url}`);
    return result.secure_url;
  } catch (error) {
    console.error(' Error uploading to Cloudinary:', error);
    throw error;
  }
}

async function getRandomImageFromPhotos(): Promise<string> {
  const photosDir = path.join(__dirname, '../../medusaVR_Photos');
  
  // Get all image files (excluding directories and DS_Store)
  const files = fs.readdirSync(photosDir).filter(file => {
    const filePath = path.join(photosDir, file);
    const isFile = fs.statSync(filePath).isFile();
    const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(file);
    const isNotDSStore = file !== '.DS_Store';
    const isNotRunpodGen = !file.includes('runpodGen');
    
    return isFile && isImage && isNotDSStore && isNotRunpodGen;
  });
  
  if (files.length === 0) {
    throw new Error('No image files found in medusaVR_Photos directory');
  }
  
  // Select random image
  const randomImage = files[Math.floor(Math.random() * files.length)];
  const imagePath = path.join(photosDir, randomImage);
  
  console.log(`📸 Selected random image: ${randomImage}`);
  return imagePath;
}

async function generateUniqueCharacterId(): Promise<number> {
  // Generate a random ID and ensure it's unique
  let characterId: number;
  let existingChar;
  
  do {
    characterId = Math.floor(Math.random() * 1000000) + Date.now();
    existingChar = await CharacterModel.findOne({ id: characterId });
  } while (existingChar);
  
  return characterId;
}

// Generate random likes between 30-500
function generateRandomLikes(): number {
  return Math.floor(Math.random() * (500 - 30 + 1)) + 30;
}

// Generate random chat count between 13000-12348518
function generateRandomChatCount(): number {
  return Math.floor(Math.random() * (12348518 - 13000 + 1)) + 13000;
}

async function createFemaleNSFWCharacter() {
  try {
    console.log(' Starting female NSFW character creation...');
    
    // Connect to MongoDB test database
    const mongoUri = process.env.MONGODB_URI?.replace('/vrfans_test', '/test') || 'mongodb://localhost:27017/test';
    await connect(mongoUri);
    console.log(' Connected to MongoDB');
    
    // Select random character template
    const template = characterTemplates[Math.floor(Math.random() * characterTemplates.length)];
    console.log(` Selected character template: ${template.name}`);
    
    // Get random image
    const imagePath = await getRandomImageFromPhotos();
    
    // Generate unique ID
    const characterId = await generateUniqueCharacterId();
    
    // Upload image to Cloudinary
    const publicId = `${template.name.toLowerCase().replace(/\s+/g, '_')}_${characterId}`;
    const cloudinaryUrl = await uploadImageToCloudinary(imagePath, publicId);
    
    // Create character data with random stats
    const characterData = {
      id: characterId,
      avatar: cloudinaryUrl,
      name: template.name,
      description: template.description,
      quickSuggestion: template.quickSuggestion,
      rating: "4.5",
      nsfw: true,
      chatCount: generateRandomChatCount(),
      likes: generateRandomLikes(),
      commentsCount: 0,
      creatorId: null, // System generated character
      
      // Enhanced character creation fields
      personalityTraits: template.personalityTraits,
      
      artStyle: {
        primaryStyle: "anime",
        secondaryStyle: "realistic"
      },
      
      selectedTags: template.selectedTags,
      
      // Image generation data (simulated since using existing image)
      imageGeneration: {
        prompt: `masterpiece, best quality, highly detailed, 1girl, ${template.personalityTraits?.mainTrait || 'attractive'}, ${template.selectedTags?.appearance?.join(', ') || 'beautiful'}, seductive pose, detailed face, high quality`,
        negativePrompt: "blurry, bad anatomy, extra limbs, low quality, worst quality, bad quality, jpeg artifacts",
        stylePrompt: "high detail anime style, professional artwork",
        seed: Math.floor(Math.random() * 1000000),
        steps: 20,
        cfgScale: 7,
        width: 512,
        height: 768,
        model: "Realistic.safetensors",
        generationTime: new Date(),
        runpodJobId: null
      },
      
      // Image metadata
      imageMetadata: {
        cloudinaryPublicId: publicId,
        uploadedAt: new Date(),
        originalFilename: path.basename(imagePath),
        generationType: 'uploaded' as const,
        originalImageUrl: cloudinaryUrl,
        thumbnailUrl: cloudinaryUrl,
        altVersions: []
      },
      
      // Creation metadata
      creationProcess: {
        stepCompleted: 5,
        totalSteps: 5,
        isDraft: false,
        lastSavedAt: new Date(),
        timeSpent: 0
      }
    };
    
    // Check if character with this ID already exists
    const existingCharacter = await CharacterModel.findOne({ id: characterData.id });
    if (existingCharacter) {
      throw new Error(`Character with ID ${characterData.id} already exists`);
    }
    
    // Create character in database
    console.log(' Creating character in database...');
    const character = await CharacterModel.create(characterData);
    
    console.log(' Character created successfully!');
    console.log(' Character Details:');
    console.log(`   ID: ${character.id}`);
    console.log(`   Name: ${character.name}`);
    console.log(`   Avatar: ${character.avatar}`);
    console.log(`   NSFW: ${character.nsfw}`);
    console.log(`   Description: ${character.description.substring(0, 100)}...`);
    console.log(`   Tags: ${JSON.stringify(character.selectedTags)}`);
        console.log(`   Personality: ${character.personalityTraits?.mainTrait || 'unknown'} (${character.personalityTraits?.subTraits?.join(', ') || 'none'})`);    
    
    return {
      success: true,
      character: {
        id: character.id,
        name: character.name,
        description: character.description,
        avatar: character.avatar,
        nsfw: character.nsfw,
        selectedTags: character.selectedTags,
        personalityTraits: character.personalityTraits,
        artStyle: character.artStyle
      }
    };
    
  } catch (error) {
    console.error(' Error creating character:', error);
    throw error;
  }
}

// Function to process all images in the medusaVR_Photos folder
async function createCharactersFromAllImages() {
  try {
    console.log(' Starting batch character creation for all images...');
    
    // Connect to MongoDB test database
    const mongoUri = process.env.MONGODB_URI?.replace('/vrfans_test', '/test') || 'mongodb://localhost:27017/test';
    await connect(mongoUri);
    console.log(' Connected to MongoDB');
    
    const photosDir = path.join(__dirname, '../../medusaVR_Photos');
    
    // Get all image files (excluding directories and DS_Store)
    const allImages = fs.readdirSync(photosDir).filter(file => {
      const filePath = path.join(photosDir, file);
      const isFile = fs.statSync(filePath).isFile();
      const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(file);
      const isNotDSStore = file !== '.DS_Store';
      const isNotRunpodGen = !file.includes('runpodGen');
      
      return isFile && isImage && isNotDSStore && isNotRunpodGen;
    });
    
    console.log(`📸 Found ${allImages.length} images to process`);
    
    const results = [];
    const errors = [];
    
    for (let i = 0; i < allImages.length; i++) {
      const imageName = allImages[i];
      console.log(`\n📷 Processing image ${i + 1}/${allImages.length}: ${imageName}`);
      
      try {
        // Select random character template
        const template = characterTemplates[Math.floor(Math.random() * characterTemplates.length)];
        
        // Generate unique ID
        const characterId = await generateUniqueCharacterId();
        
        // Create modified character name to ensure uniqueness
        const characterName = `${template.name} ${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${Math.floor(Math.random() * 100)}`;
        
        // Upload image to Cloudinary
        const imagePath = path.join(photosDir, imageName);
        const publicId = `${characterName.toLowerCase().replace(/\s+/g, '_')}_${characterId}`;
        const cloudinaryUrl = await uploadImageToCloudinary(imagePath, publicId);
        
        // Create character data with random stats
        const characterData = {
          id: characterId,
          avatar: cloudinaryUrl,
          name: characterName,
          description: template.description,
          quickSuggestion: template.quickSuggestion,
          rating: "4.5",
          nsfw: true,
          chatCount: generateRandomChatCount(),
          likes: generateRandomLikes(),
          commentsCount: 0,
          creatorId: null,
          personalityTraits: template.personalityTraits,
          artStyle: {
            primaryStyle: "anime",
            secondaryStyle: "realistic"
          },
          selectedTags: template.selectedTags,
          imageGeneration: {
            prompt: `masterpiece, best quality, highly detailed, 1girl, ${template.personalityTraits?.mainTrait || 'attractive'}, ${template.selectedTags?.appearance?.join(', ') || 'beautiful'}, seductive pose, detailed face, high quality`,
            negativePrompt: "blurry, bad anatomy, extra limbs, low quality, worst quality, bad quality, jpeg artifacts",
            stylePrompt: "high detail anime style, professional artwork",
            seed: Math.floor(Math.random() * 1000000),
            steps: 20,
            cfgScale: 7,
            width: 512,
            height: 768,
            model: "Realistic.safetensors",
            generationTime: new Date(),
            runpodJobId: null
          },
          imageMetadata: {
            cloudinaryPublicId: publicId,
            uploadedAt: new Date(),
            originalFilename: imageName,
            generationType: 'uploaded' as const,
            originalImageUrl: cloudinaryUrl,
            thumbnailUrl: cloudinaryUrl,
            altVersions: []
          },
          creationProcess: {
            stepCompleted: 5,
            totalSteps: 5,
            isDraft: false,
            lastSavedAt: new Date(),
            timeSpent: 0
          }
        };
        
        // Create character in database
        const character = await CharacterModel.create(characterData);
        
        console.log(` Character created: ${character.name} (ID: ${character.id})`);
        
        results.push({
          success: true,
          character: {
            id: character.id,
            name: character.name,
            avatar: character.avatar,
            originalImage: imageName
          }
        });
        
        // Add delay to avoid overwhelming services
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error(` Error processing ${imageName}:`, error);
        errors.push({
          imageName,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
    
    // Final summary
    console.log('\n Batch character creation completed!');
    console.log(` Successfully created: ${results.length} characters`);
    console.log(` Errors: ${errors.length}`);
    
    if (errors.length > 0) {
      console.log('\n Errors encountered:');
      errors.forEach(error => {
        console.log(`   - ${error.imageName}: ${error.error}`);
      });
    }
    
    console.log('\n Created characters:');
    results.forEach(result => {
      console.log(`   - ${result.character.name} (ID: ${result.character.id}) from ${result.character.originalImage}`);
    });
    
    return { results, errors };
    
  } catch (error) {
    console.error('💥 Batch character creation failed:', error);
    throw error;
  }
}

// Main execution
async function main() {
  try {
    // Check if we should process all images or just one
    const processAll = process.argv.includes('--all');
    
    if (processAll) {
      const result = await createCharactersFromAllImages();
      console.log('\n All characters created successfully!');
      process.exit(0);
    } else {
      const result = await createFemaleNSFWCharacter();
      console.log('\n Character creation completed successfully!');
      console.log(' Summary:', JSON.stringify(result, null, 2));
      process.exit(0);
    }
  } catch (error) {
    console.error('💥 Character creation failed:', error);
    process.exit(1);
  }
}

// Run if this script is executed directly
if (process.argv[1] === __filename) {
  main();
}

export { createFemaleNSFWCharacter }; 