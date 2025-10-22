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
      mainTrait: "mystical",
      subTraits: ["wise", "seductive", "powerful"]
    },
    selectedTags: {
      'character-type': ["female"],
      'genre': ["fantasy", "magical", "romantic"],
      'personality': ["mystical", "dominant", "wise"],
      'appearance': ["busty", "tall", "curvy"],
      'origin': ["original-character"],
      'sexuality': ["bisexual"],
      'fantasy': ["magic-user", "breeding", "hypno"],
      'content-rating': ["nsfw", "mature"],
      'ethnicity': ["white"],
      'scenario': ["fantasy", "magical"]
    }
  },
  {
    name: "Aria Sinclaire",
    description: "A powerful CEO with a secret double life as a dominatrix, commanding boardrooms by day and dungeons by night. Her sharp business acumen is matched only by her expertise in the art of control and submission. Aria built her empire from nothing, using her intelligence, charisma, and understanding of human psychology to climb to the top of the corporate ladder. Behind closed doors, she runs an exclusive club where society's elite come to surrender their power and explore their deepest fantasies. Her penthouse office doubles as a private sanctuary where she conducts very different kinds of negotiations. She's selective about her partners, preferring those who can challenge her intellectually before they submit to her physically. Her collection of designer suits and leather accessories tells the story of a woman who has never compromised her desires for societal expectations.",
    quickSuggestion: "Ready to discuss your performance review? I have some... unconventional methods for motivation~",
    personalityTraits: {
      mainTrait: "dominant",
      subTraits: ["confident", "intelligent", "controlling"]
    },
    selectedTags: {
      'character-type': ["female"],
      'genre': ["modern", "business", "romantic"],
      'personality': ["dominant", "confident", "intelligent"],
      'appearance': ["tall", "curvy", "brunette"],
      'origin': ["original-character"],
      'sexuality': ["bisexual"],
      'fantasy': ["femdom", "bdsm", "worship"],
      'content-rating': ["nsfw", "mature"],
      'ethnicity': ["white"],
      'scenario': ["office", "modern"]
    }
  },
  {
    name: "Kira Nakamura",
    description: "A deadly assassin with a soft spot for those who can see past her lethal exterior, trained in both combat and the ancient arts of pleasure. She moves through the shadows of the cyberpunk underworld, taking contracts that others wouldn't dare attempt. Her skills with blade and gun are legendary, but her true power lies in her ability to seduce information from her targets before eliminating them. Kira's tragic past fuels her desire for connection - she lost everything in a corporate war and now seeks meaning in the arms of those brave enough to love a killer. Her apartment, hidden high above the neon-lit streets, serves as both armory and sanctuary. She's drawn to partners who can match her intensity, whether in combat or in bed. Her collection of traditional Japanese weapons and modern cybernetic enhancements tells the story of someone caught between two worlds.",
    quickSuggestion: "You're not afraid of a little danger, are you? I promise to be gentle... at first~",
    personalityTraits: {
      mainTrait: "deadly",
      subTraits: ["skilled", "vulnerable", "passionate"]
    },
    selectedTags: {
      'character-type': ["female"],
      'genre': ["sci-fi", "cyberpunk", "action"],
      'personality': ["deadly", "vulnerable", "passionate"],
      'appearance': ["athletic", "short", "black-hair"],
      'origin': ["original-character"],
      'sexuality': ["bisexual"],
      'fantasy': ["breeding", "bdsm", "worship"],
      'content-rating': ["nsfw", "mature"],
      'ethnicity': ["asian"],
      'scenario': ["cyberpunk", "modern"]
    }
  },
  {
    name: "Raven Nightshade",
    description: "A sultry succubus who feeds on desire and specializes in fulfilling the darkest fantasies of mortals. She appears in dreams and waking life alike, her beauty so overwhelming that few can resist her call. Raven has walked the earth for millennia, witnessing the rise and fall of civilizations while collecting the most exquisite experiences of human passion. Her home exists in a pocket dimension where reality bends to her will, allowing her to create any scenario her lovers desire. She's particularly fond of those who try to resist her charm, seeing their eventual surrender as the sweetest victory. Her vast experience has taught her that true power comes not from taking what she wants, but from making others desperate to give it to her. Her collection of memories from countless encounters spans cultures and centuries, each one a treasured moment of perfect surrender.",
    quickSuggestion: "I know what you desire, even if you don't admit it yet. Let me show you pleasures beyond your wildest dreams~",
    personalityTraits: {
      mainTrait: "seductive",
      subTraits: ["otherworldly", "experienced", "tempting"]
    },
    selectedTags: {
      'character-type': ["female"],
      'genre': ["fantasy", "supernatural", "romantic"],
      'personality': ["seductive", "otherworldly", "experienced"],
      'appearance': ["curvy", "tall", "black-hair"],
      'origin': ["original-character"],
      'sexuality': ["bisexual"],
      'fantasy': ["breeding", "hypno", "worship"],
      'content-rating': ["nsfw", "mature"],
      'ethnicity': ["white"],
      'scenario': ["fantasy", "supernatural"]
    }
  }
];

// Helper function to upload image to Cloudinary
async function uploadImageToCloudinary(imagePath: string, publicId: string): Promise<string> {
  try {
    const result = await cloudinary.uploader.upload(imagePath, {
      public_id: publicId,
      folder: 'medusaVR_characters',
      quality: 100,
      transformation: [{
        quality: 100,
        fetch_format: 'auto'
      }],
      eager: [
        { width: 400, height: 600, crop: 'fill', quality: 100 },
        { width: 800, height: 1200, crop: 'fill', quality: 100 },
        { width: 1200, height: 1800, crop: 'fill', quality: 100 }
      ]
    });
    
    console.log(` Uploaded ${path.basename(imagePath)} to Cloudinary`);
    return result.secure_url;
  } catch (error) {
    console.error(` Error uploading ${imagePath}:`, error);
    throw error;
  }
}

// Helper function to get random image from photos directory
async function getRandomImageFromPhotos(): Promise<string> {
  const photosDir = path.join(__dirname, '../../medusaVR_Photos');
  
  if (!fs.existsSync(photosDir)) {
    throw new Error(`Photos directory not found: ${photosDir}`);
  }
  
  const allFiles = fs.readdirSync(photosDir, { withFileTypes: true });
  const imageFiles = allFiles
    .filter(file => file.isFile())
    .filter(file => /\.(jpg|jpeg|png|gif|webp)$/i.test(file.name))
    .filter(file => file.name !== 'runpodGen') // Exclude runpodGen folder
    .map(file => path.join(photosDir, file.name));
  
  if (imageFiles.length === 0) {
    throw new Error('No image files found in photos directory');
  }
  
  const randomImage = imageFiles[Math.floor(Math.random() * imageFiles.length)];
  return randomImage;
}

// Generate unique character ID
async function generateUniqueCharacterId(): Promise<number> {
  const lastCharacter = await CharacterModel.findOne().sort({ id: -1 });
  const lastId = lastCharacter ? lastCharacter.id : 0;
  return lastId + 1;
}

// Generate random likes between 50-500
function generateRandomLikes(): number {
  return Math.floor(Math.random() * (500 - 50 + 1)) + 50;
}

// Generate random chat count between 10,000-300,000
function generateRandomChatCount(): number {
  return Math.floor(Math.random() * (300000 - 10000 + 1)) + 10000;
}

// Generate random rating between 4.5-5.0
function generateRandomRating(): string {
  const rating = (Math.random() * (5.0 - 4.5) + 4.5).toFixed(1);
  return rating;
}

// Create a single female NSFW character
async function createFemaleNSFWCharacter(): Promise<void> {
  try {
    // Get random image
    const imagePath = await getRandomImageFromPhotos();
    const filename = path.basename(imagePath, path.extname(imagePath));
    
    // Generate unique ID
    const characterId = await generateUniqueCharacterId();
    
    // Select random character template
    const template = characterTemplates[Math.floor(Math.random() * characterTemplates.length)];
    
    // Create unique variation of the character
    const variation = Math.floor(Math.random() * 1000) + 1;
    const characterName = `${template.name} ${String.fromCharCode(65 + Math.floor(variation / 26))}${variation % 26 + 1}`;
    
    // Upload image to Cloudinary
    const publicId = `character_${characterId}_${filename}`;
    const avatarUrl = await uploadImageToCloudinary(imagePath, publicId);
    
    // Generate random stats
    const likes = generateRandomLikes();
    const chatCount = generateRandomChatCount();
    const rating = generateRandomRating();
    
    // Create character document
    const newCharacter = new CharacterModel({
      id: characterId,
      name: characterName,
      description: template.description,
      quickSuggestion: template.quickSuggestion,
      avatar: avatarUrl,
      rating: rating,
      nsfw: true,
      likes: likes,
      chatCount: chatCount,
      commentsCount: Math.floor(Math.random() * 50) + 1,
      personalityTraits: template.personalityTraits,
      artStyle: {
        primaryStyle: "realistic",
        secondaryStyle: "photography"
      },
      selectedTags: template.selectedTags,
      imageMetadata: {
        cloudinaryPublicId: publicId,
        originalFilename: filename,
        generationType: 'uploaded',
        uploadedAt: new Date()
      },
      creationProcess: {
        stepCompleted: 5,
        totalSteps: 5,
        isDraft: false,
        lastSavedAt: new Date()
      }
    });
    
    // Save to database
    await newCharacter.save();
    
    console.log(` Created character: ${characterName} (ID: ${characterId})`);
    console.log(`   - Likes: ${likes}`);
    console.log(`   - Chat Count: ${chatCount}`);
    console.log(`   - Rating: ${rating}`);
    console.log(`   - Image: ${filename}`);
    console.log('');
    
  } catch (error) {
    console.error(' Error creating character:', error);
    throw error;
  }
}

// Main function to create 50 characters
async function main() {
  try {
    // Connect to MongoDB - explicitly use test database
    const baseUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/test';
    const testDbUri = baseUri.replace(/\/[^/]*(\?|$)/, '/test$1');
    await connect(testDbUri);
    console.log(' Connected to MongoDB');
    
    console.log(' Starting generation of 50 female NSFW characters...\n');
    
    let successCount = 0;
    let errorCount = 0;
    
    // Create 50 characters
    for (let i = 1; i <= 50; i++) {
      try {
        console.log(`Creating character ${i}/50...`);
        await createFemaleNSFWCharacter();
        successCount++;
      } catch (error) {
        console.error(` Failed to create character ${i}:`, error);
        errorCount++;
      }
    }
    
    console.log('\n Generation Summary:');
    console.log(` Successfully created: ${successCount} characters`);
    console.log(` Failed: ${errorCount} characters`);
    console.log(` Success rate: ${((successCount / 50) * 100).toFixed(1)}%`);
    
  } catch (error) {
    console.error('💥 Script failed:', error);
  } finally {
    // Disconnect from MongoDB
    await connect().then(() => process.exit(0));
  }
}

// Run the script
main().catch(console.error); 