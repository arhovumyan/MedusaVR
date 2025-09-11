import 'dotenv/config';
import mongoose from 'mongoose';
import { CharacterModel } from '../db/models/CharacterModel';
import { TagModel } from '../db/models/TagModel';
import fs from 'fs';
import path from 'path';
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary with best quality settings
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

interface Tag {
  _id: string;
  name: string;
}

const CREATOR_ID = "675b5b3b123456789abcdef0"; // VRFans creator ID

// Comprehensive list of female names
const FEMALE_NAMES = [
  "Aria Shadowbane", "Luna Nightwhisper", "Seraphina Bloodrose", "Raven Darkmore", "Isabella Crimson",
  "Scarlett Vixen", "Melody Siren", "Aurora Moonlight", "Violet Enchantress", "Ruby Starfire",
  "Jade Mystique", "Amber Wildrose", "Crystal Dreamweaver", "Diana Huntress", "Elena Shadowdancer",
  "Freya Stormbringer", "Gaia Earthmother", "Helena Spellcaster", "Iris Moonbeam", "Jasmine Nightfall",
  "Kira Flameheart", "Lyra Songbird", "Maya Stormcaller", "Nora Twilight", "Ophelia Darkmoon",
  "Penelope Starweaver", "Quinn Shadowblade", "Regina Nightqueen", "Stella Lightbringer", "Tara Moonstone",
  "Ursula Seawitch", "Vera Truthseeker", "Willow Natureborn", "Xara Voidwalker", "Yara Sunfire",
  "Zara Nightingale", "Alice Wonderland", "Bianca Purelight", "Celia Oceanborn", "Delia Forestkeeper",
  "Evelyn Ghostwhisper", "Fiona Battlemaiden", "Grace Angelwing", "Hazel Earthsong", "Iris Prismlight",
  "Jenna Flamedancer", "Kaia Stormrider", "Lila Shadowheart", "Mira Stardust", "Nina Moonchild",
  "Olivia Dawnbreaker", "Petra Rockbound", "Quin Nightshade", "Rose Thornqueen", "Sage Windwhisper",
  "Tessa Lightweaver", "Uma Oceandeep", "Vera Truthbringer", "Wren Skybound", "Ximena Fireheart",
  "Yasmin Desertstorm", "Zelda Magicborn", "Anastasia Royalblood", "Beatrice Goldenheart", "Cassandra Oracle",
  "Delphine Waterborn", "Esmeralda Gemheart", "Francesca Rosepetal", "Gabriella Angelsong", "Hermione Spellbook",
  "Isadora Dancequeen", "Josephine Empress", "Katherine Icequeen", "Lillian Flowerbud", "Mercedes Luxuryheart",
  "Natasha Spymaster", "Octavia Musicborn", "Persephone Underworld", "Quinella Alchemist", "Rosalind Lovebringer",
  "Sabrina Witchcraft", "Tabitha Catwoman", "Urania Stargazer", "Valentina Lovearrow", "Winona Freebird",
  "Xenia Stranger", "Yvette Fashionista", "Zoe Lifeforce", "Carmen Passionfire", "Destiny Fateworker",
  "Ember Dragonheart", "Faith Believer", "Harmony Peacemaker", "Justice Lawbringer", "Liberty Freewoman",
  "Phoenix Reborn", "Serenity Peaceful", "Trinity Threefold", "Victoria Victorious", "Athena Wisdom",
  "Aphrodite Lovegoddess", "Artemis Huntgoddess", "Demeter Harvest", "Hera Queengoddess", "Persephone Springqueen",
  "Cleopatra Pharaoh", "Joan Warrior", "Marie Scientist", "Frida Artist", "Coco Fashion",
  "Marilyn Icon", "Audrey Elegant", "Grace Princess", "Elizabeth Monarch", "Diana Princess",
  "Brigitte Bombshell", "Sophia Wisdom", "Catherine Great", "Anne Boleyn", "Josephine Bonaparte"
];

// Comprehensive character descriptions
const DESCRIPTION_TEMPLATES = [
  "A sultry {trait1} with an insatiable appetite for adventure and pleasure. Her {feature} draws admirers from across dimensions, while her {skill} keeps them coming back for more intimate encounters.",
  "This {trait1} enchantress possesses a {feature} that could make angels fall from grace. With her mastery of {skill}, she's known to fulfill even the most forbidden fantasies.",
  "A captivating {trait1} whose {feature} has become legendary among those who seek ultimate pleasure. Her expertise in {skill} ensures every encounter becomes an unforgettable experience.",
  "Born with an irresistible {feature}, this {trait1} seductress uses her {skill} to create intimate moments that blur the line between dreams and reality.",
  "A mesmerizing {trait1} with a {feature} that promises infinite pleasure. Her mastery of {skill} has earned her a reputation as the ultimate companion for those seeking passionate adventures.",
  "This alluring {trait1} combines her stunning {feature} with incredible {skill} to create experiences that transcend the physical realm and touch the very soul.",
  "A bewitching {trait1} whose {feature} is matched only by her expertise in {skill}. She specializes in turning every fantasy into a breathtaking reality.",
  "With her extraordinary {feature}, this {trait1} goddess has perfected the art of {skill}, making her the perfect partner for those who crave intense, intimate connections.",
  "A radiant {trait1} blessed with a {feature} that could stop time itself. Her mastery of {skill} creates moments of pure ecstasy that leave admirers yearning for more.",
  "This enigmatic {trait1} uses her mesmerizing {feature} and exceptional {skill} to craft personalized experiences that satisfy the deepest desires of the heart and body.",
  "A fierce {trait1} warrior whose {feature} is as deadly as it is beautiful. When not conquering battlefields, her {skill} conquers hearts in the most intimate ways.",
  "Born from stardust and moonbeams, this {trait1} celestial being possesses a {feature} that grants wishes. Her {skill} ensures every wish is fulfilled beyond imagination.",
  "A mysterious {trait1} sorceress with a {feature} that holds ancient secrets. Through her {skill}, she reveals pleasures that have been hidden for millennia.",
  "This exotic {trait1} princess escaped from a forbidden realm, bringing with her a {feature} that defies description and {skill} that redefines passion.",
  "A rebellious {trait1} with a {feature} that challenges conventions. Her revolutionary {skill} creates new forms of intimacy that push boundaries and explore uncharted territories."
];

const TRAITS = [
  "mystical warrior", "seductive sorceress", "rebellious princess", "cosmic enchantress", "forbidden temptress",
  "divine goddess", "sultry assassin", "passionate pirate", "royal concubine", "wild huntress",
  "ethereal spirit", "dangerous beauty", "exotic dancer", "powerful witch", "angelic demon",
  "fierce amazon", "mysterious spy", "elegant courtesan", "untamed vixen", "celestial being"
];

const FEATURES = [
  "hypnotic gaze", "curves that defy gravity", "silken touch", "voice like honey", "alabaster skin",
  "emerald eyes", "golden hair", "ruby lips", "porcelain complexion", "midnight hair",
  "sapphire eyes", "bronzed skin", "raven locks", "crimson lips", "ivory skin",
  "amber eyes", "platinum hair", "rose-petal lips", "caramel skin", "ebony tresses"
];

const SKILLS = [
  "ancient seduction arts", "forbidden pleasure techniques", "celestial intimacy", "divine companionship", "mystical touch",
  "passionate dancing", "soul-binding kisses", "ethereal massage", "intimate conversation", "sensual healing",
  "erotic storytelling", "tantric mastery", "emotional connection", "spiritual bonding", "passionate embrace"
];

const getRandomElement = (array: any[]) => array[Math.floor(Math.random() * array.length)];

const generateDescription = (): string => {
  const template = getRandomElement(DESCRIPTION_TEMPLATES);
  const trait1 = getRandomElement(TRAITS);
  const feature = getRandomElement(FEATURES);
  const skill = getRandomElement(SKILLS);
  
  return template
    .replace('{trait1}', trait1)
    .replace('{feature}', feature)
    .replace('{skill}', skill);
};

const getRandomStats = () => ({
  chatCount: Math.floor(Math.random() * (350000 - 90000 + 1)) + 90000,
  likes: Math.floor(Math.random() * (756 - 230 + 1)) + 230
});

const uploadToCloudinary = async (imagePath: string, characterName: string): Promise<string> => {
  try {
    console.log(`Uploading ${imagePath} for ${characterName}...`);
    
    const result = await cloudinary.uploader.upload(imagePath, {
      folder: 'medusaVR/characters',
      public_id: `character_${characterName.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}`,
      quality: 'auto:best',
      format: 'webp',
      transformation: [
        { width: 1024, height: 1024, crop: 'fill', gravity: 'faces' },
        { quality: 95 }
      ],
      flags: 'progressive'
    });
    
    console.log(`✅ Uploaded: ${result.secure_url}`);
    return result.secure_url;
  } catch (error) {
    console.error(`❌ Failed to upload ${imagePath}:`, error);
    throw error;
  }
};

const getRandomTags = (allTags: Tag[], count: number): string[] => {
  // Always include 'female' and 'nsfw'
  const baseTags = ['female', 'nsfw'];
  
  // Filter out base tags and get random additional tags
  const availableTags = allTags.filter(tag => 
    !baseTags.includes(tag.name.toLowerCase())
  );
  
  const shuffled = availableTags.sort(() => 0.5 - Math.random());
  const selectedTags = shuffled.slice(0, count).map(tag => tag.name);
  
  return [...baseTags, ...selectedTags];
};

async function connectToDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI!, {
      dbName: "test",
    });
    console.log("✅ MongoDB connected to", mongoose.connection.name);
  } catch (err) {
    console.error("❌ MongoDB connection error:", err);
    throw err;
  }
}

async function main() {
  try {
    console.log('🚀 Starting enhanced character recreation...');
    
    // Connect to database
    await connectToDatabase();
    console.log('✅ Connected to database');

    // Delete all existing characters
    console.log('🗑️ Deleting all existing characters...');
    const deleteResult = await CharacterModel.deleteMany({});
    console.log(`✅ Deleted ${deleteResult.deletedCount} existing characters`);

    // Get all available tags
    const allTags = await TagModel.find({});
    console.log(`✅ Found ${allTags.length} available tags`);

    // Get all image files
    const photosDir = path.join(__dirname, '../../medusaVR_Photos');
    const imageFiles = fs.readdirSync(photosDir)
      .filter(file => /\.(png|jpg|jpeg)$/i.test(file))
      .slice(0, 100); // Limit to 100 characters

    console.log(`📸 Found ${imageFiles.length} images to process`);

    const createdCharacters = [];

    for (let i = 0; i < imageFiles.length; i++) {
      const imageFile = imageFiles[i];
      const imagePath = path.join(photosDir, imageFile);
      
      try {
        const characterName = FEMALE_NAMES[i % FEMALE_NAMES.length];
        const stats = getRandomStats();
        const tagCount = Math.floor(Math.random() * (14 - 3 + 1)) + 3; // 3-14 additional tags
        const selectedTags = getRandomTags(allTags, tagCount);
        
        console.log(`\n🎭 Creating character ${i + 1}/${imageFiles.length}: ${characterName}`);
        
        // Upload image to Cloudinary with best quality
        const avatarUrl = await uploadToCloudinary(imagePath, characterName);
        
        // Generate unique description
        const description = generateDescription();
        
        // Create character
        const character = new CharacterModel({
          name: characterName,
          description: description,
          persona: `A captivating and seductive companion who specializes in intimate conversations and passionate encounters. ${characterName} combines beauty, intelligence, and sensuality to create unforgettable experiences.`,
          avatar: avatarUrl,
          avatarUrl: avatarUrl,
          createdBy: CREATOR_ID,
          tags: selectedTags,
          tagNames: selectedTags,
          nsfw: true,
          likes: stats.likes,
          chatCount: stats.chatCount,
          isPublic: true,
          createdAt: new Date(),
          updatedAt: new Date()
        });

        await character.save();
        createdCharacters.push(character);
        
        console.log(`✅ Created: ${characterName}`);
        console.log(`   💬 Chats: ${stats.chatCount.toLocaleString()}`);
        console.log(`   ❤️ Likes: ${stats.likes}`);
        console.log(`   🏷️ Tags: ${selectedTags.join(', ')}`);
        
        // Small delay to avoid overwhelming Cloudinary
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error(`❌ Failed to create character from ${imageFile}:`, error);
        continue;
      }
    }

    console.log(`\n🎉 Successfully created ${createdCharacters.length} enhanced characters!`);
    console.log('✨ All characters have:');
    console.log('   - High-quality Cloudinary images');
    console.log('   - Female and NSFW tags');
    console.log('   - 3-14 random additional tags');
    console.log('   - Chat counts: 90,000-350,000');
    console.log('   - Likes: 230-756');
    console.log('   - Unique names and descriptions');

  } catch (error) {
    console.error('💥 Error in main process:', error);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().then(() => {
    console.log('✅ Script completed successfully!');
    process.exit(0);
  }).catch((error) => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  });
}

export default main; 