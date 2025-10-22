import { CharacterModel } from '../db/models/CharacterModel';
import { TagModel } from '../db/models/TagModel';
import { connect, disconnect } from 'mongoose';
import { v2 as cloudinary } from 'cloudinary';
import * as dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

// Configure Cloudinary with highest quality settings
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const CREATOR_ID = "675b5b3b123456789abcdef0"; // Same creator ID as requested

// 100 unique female names
const femaleNames = [
  "Aria Shadowbane", "Luna Nightwhisper", "Seraphina Bloodrose", "Raven Moonfire", "Isabella Darkheart",
  "Scarlett Voidwalker", "Violet Stormcaller", "Aurora Nightshade", "Celeste Shadowmere", "Ember Blackthorn",
  "Maya Silvermoon", "Jade Whisperwind", "Ruby Nightfall", "Sapphire Darkblade", "Amethyst Shadowdancer",
  "Crystal Moonbeam", "Diamond Starlight", "Pearl Nightglow", "Opal Dreamweaver", "Garnet Soulfire",
  "Lilith Darkrose", "Morgana Shadowcaster", "Pandora Voidheart", "Nyx Nightbringer", "Hecate Moonspell",
  "Medusa Serpentine", "Circe Enchantress", "Persephone Underworld", "Athena Warmaiden", "Artemis Huntress",
  "Aphrodite Loveborn", "Hera Queenfire", "Demeter Earthmother", "Hestia Hearthhome", "Nemesis Vengeance",
  "Tiamat Chaosborn", "Ishtar Starlust", "Inanna Lovequeen", "Freya Battleheart", "Sif Goldenhair",
  "Skadi Frostbane", "Hel Deathwhisper", "Valkyrie Battlecry", "Brunhilde Shieldmaiden", "Sigrid Ironwill",
  "Astrid Stormborn", "Ingrid Frostfire", "Solveig Sunblade", "Thora Thunderstrike", "Kenna Wildfire",
  "Bridget Flameheart", "Maeve Spiritcaller", "Niamh Dreamwalker", "Siobhan Shadowseer", "Caoimhe Starweaver",
  "Aoife Battleborn", "Deirdre Songstress", "Grainne Seaqueen", "Brigid Forgeheart", "Orla Goldensong",
  "Sakura Blossomfall", "Yuki Snowpetal", "Akira Brightfire", "Rei Moonspirit", "Ami Crystalheart",
  "Mika Stardust", "Nana Sweetwhisper", "Yui Silktouch", "Rin Bellsong", "Kei Shadowblossom",
  "Mei Springbreeze", "Lin Bamboowind", "Wei Jadefire", "Xia Summerflame", "Ying Moonlight",
  "Zara Desertstorm", "Amara Sunfire", "Zuri Nightbloom", "Kaia Oceanwave", "Nia Starborn",
  "Ava Shadowmist", "Mia Lightdancer", "Eva Dreamcatcher", "Zoe Lifebringer", "Cora Heartstring",
  "Vera Truthseeker", "Dora Pathfinder", "Nora Lightbearer", "Flora Bloomheart", "Celia Skywhisper",
  "Stella Starfire", "Bella Roseheart", "Ella Moonbeam", "Mila Goldenglow", "Lila Violetdream",
  "Tessa Stormsinger", "Jessa Wildrose", "Vanessa Nightbloom", "Melissa Honeysong", "Clarissa Crystalfrost"
];

// Personality traits for descriptions
const traits = [
  "mystical warrior", "seductive sorceress", "fierce huntress", "elegant enchantress", "mysterious assassin",
  "passionate lover", "cunning spy", "gentle healer", "wild barbarian", "noble princess",
  "dark witch", "celestial being", "fallen angel", "demon queen", "nature goddess"
];

const features = [
  "hypnotic gaze", "silken hair", "perfect curves", "enchanting smile", "deadly beauty",
  "graceful movements", "captivating voice", "alluring presence", "magnetic charm", "irresistible allure"
];

const skills = [
  "ancient seduction arts", "forbidden magic", "deadly combat skills", "mind control powers", "healing touch",
  "shadow manipulation", "elemental magic", "celestial powers", "dark sorcery", "divine blessings"
];

// Generate random description
function generateDescription(name: string): string {
  const trait = traits[Math.floor(Math.random() * traits.length)];
  const feature = features[Math.floor(Math.random() * features.length)];
  const skill = skills[Math.floor(Math.random() * skills.length)];
  
  return `${name} is a captivating ${trait} known for her ${feature} and mastery of ${skill}. Her presence commands attention wherever she goes, drawing admirers with her mysterious aura and irresistible charm. Those who encounter her find themselves spellbound by her beauty and power, unable to resist her magnetic pull.`;
}

// Upload image to Cloudinary with best quality (no cropping, original dimensions)
async function uploadImageToCloudinary(imagePath: string, publicId: string): Promise<string> {
  try {
    console.log(` Uploading ${path.basename(imagePath)} to Cloudinary...`);
    
    const result = await cloudinary.uploader.upload(imagePath, {
      public_id: publicId,
      folder: 'medusavr/characters',
      resource_type: 'image',
      quality: 'auto:best', // Best possible quality
      // No width, height, crop, or gravity - keep original dimensions
    });
    
    console.log(` Uploaded successfully: ${result.secure_url}`);
    return result.secure_url;
  } catch (error) {
    console.error(' Error uploading to Cloudinary:', error);
    throw error;
  }
}

// Generate random stats
function generateRandomChatCount(): number {
  return Math.floor(Math.random() * (350000 - 90000 + 1)) + 90000;
}

function generateRandomLikes(): number {
  return Math.floor(Math.random() * (756 - 230 + 1)) + 230;
}

async function recreateAllCharacters() {
  try {
    console.log(' Starting character recreation process...');
    
    // Connect to MongoDB test database
    const baseUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/test';
    const testDbUri = baseUri.replace(/\/[^/]*(\?|$)/, '/test$1');
    await connect(testDbUri);
    console.log(' Connected to MongoDB');

    // Delete all existing characters
    console.log(' Deleting all existing characters...');
    const deleteResult = await CharacterModel.deleteMany({});
    console.log(` Deleted ${deleteResult.deletedCount} existing characters`);

    // Get all available tags
    const allTags = await TagModel.find({});
    console.log(` Found ${allTags.length} available tags`);
    
    // Filter out female and nsfw tags to add separately
    const otherTags = allTags.filter(tag => 
      tag.name !== 'female' && tag.name !== 'nsfw'
    );

    // Get photos directory
    const photosDir = path.join(__dirname, '../../medusaVR_Photos');
    if (!fs.existsSync(photosDir)) {
      throw new Error(`Photos directory not found: ${photosDir}`);
    }

    // Get all image files
    const allImages = fs.readdirSync(photosDir).filter(file => {
      const filePath = path.join(photosDir, file);
      const isFile = fs.statSync(filePath).isFile();
      const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(file);
      const isNotDSStore = file !== '.DS_Store';
      
      return isFile && isImage && isNotDSStore;
    });

    console.log(`📸 Found ${allImages.length} images to process`);
    
    let successCount = 0;
    let errorCount = 0;

    // Process each image
    for (let i = 0; i < Math.min(allImages.length, femaleNames.length); i++) {
      const imageName = allImages[i];
      const characterName = femaleNames[i];
      
      console.log(`\n📷 Processing ${i + 1}/${Math.min(allImages.length, femaleNames.length)}: ${imageName} -> ${characterName}`);
      
      try {
        // Generate unique ID
        const characterId = Date.now() + i;
        
        // Upload image to Cloudinary
        const imagePath = path.join(photosDir, imageName);
        const publicId = `character_${characterId}_${characterName.toLowerCase().replace(/\s+/g, '_')}`;
        const cloudinaryUrl = await uploadImageToCloudinary(imagePath, publicId);
        
        // Generate random tag selection (3-14 random tags + female + nsfw)
        const numRandomTags = Math.floor(Math.random() * 12) + 3; // 3-14 tags
        const shuffledTags = [...otherTags].sort(() => 0.5 - Math.random());
        const selectedTags = shuffledTags.slice(0, numRandomTags);
        
        // Add female and nsfw tags
        const femaleTag = allTags.find(tag => tag.name === 'female');
        const nsfwTag = allTags.find(tag => tag.name === 'nsfw');
        
        const finalTags = [];
        const tagNames = [];
        
        if (femaleTag) {
          finalTags.push(femaleTag._id);
          tagNames.push('female');
        }
        if (nsfwTag) {
          finalTags.push(nsfwTag._id);
          tagNames.push('nsfw');
        }
        
        selectedTags.forEach(tag => {
          finalTags.push(tag._id);
          tagNames.push(tag.name);
        });

        // Create character data
        const characterData = {
          id: characterId,
          avatar: cloudinaryUrl,
          name: characterName,
          description: generateDescription(characterName),
          rating: "4.5",
          nsfw: true,
          chatCount: generateRandomChatCount(),
          likes: generateRandomLikes(),
          commentsCount: 0,
          creatorId: CREATOR_ID,
          tags: finalTags,
          tagNames: tagNames,
          
          personalityTraits: {
            mainTrait: "seductive",
            subTraits: ["confident", "mysterious", "playful"]
          },
          
          artStyle: {
            primaryStyle: "realistic",
            secondaryStyle: "photography"
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
        
        console.log(` Created: ${character.name} (ID: ${character.id})`);
        console.log(`   Tags: ${tagNames.join(', ')}`);
        console.log(`   Chat Count: ${character.chatCount}`);
        console.log(`   Likes: ${character.likes}`);
        
        successCount++;
        
        // Add delay to avoid overwhelming services
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (error) {
        console.error(` Error processing ${imageName}:`, error);
        errorCount++;
      }
    }

    // Final summary
    console.log('\n Character recreation completed!');
    console.log(` Successfully created: ${successCount} characters`);
    console.log(` Errors: ${errorCount}`);
    
    if (successCount > 0) {
      console.log('\n Sample of created characters:');
      const sampleCharacters = await CharacterModel.find({}).limit(5).select('name chatCount likes tagNames');
      sampleCharacters.forEach((char, index) => {
        console.log(`${index + 1}. ${char.name} - ${char.chatCount} chats, ${char.likes} likes`);
        console.log(`   Tags: ${char.tagNames.join(', ')}`);
      });
    }

  } catch (error) {
    console.error('💥 Character recreation failed:', error);
  } finally {
    await disconnect();
    console.log(' Disconnected from MongoDB');
  }
}

// Run the script
if (import.meta.url === `file://${process.argv[1]}`) {
  recreateAllCharacters().catch(console.error);
} 