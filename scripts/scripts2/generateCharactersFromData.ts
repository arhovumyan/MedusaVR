#!/usr/bin/env tsx

/**
 * Character Generation Script using Character Creation Data
 * 
 * This script generates characters using the same data structure and procedure
 * as the create character page, with one art style, one tag from each category,
 * a name, and a prompt.
 */

import { fileURLToPath } from 'url';
import { dirname } from 'path';
import mongoose from 'mongoose';
import * as fs from 'fs';
import * as path from 'path';
import dotenv from 'dotenv';
import { CharacterModel } from '../db/models/CharacterModel.js';
import { UserModel } from '../db/models/UserModel.js';
import { FastCharacterGenerationService, FastGenerationOptions } from '../services/FastCharacterGenerationService.js';
import { CharacterEmbeddingService, EmbeddingGenerationOptions } from '../services/CharacterEmbeddingService.js';

// Import character creation data
import { 
  personalityTraits, 
  artStyles, 
  scenarios, 
  tagCategories,
  type PersonalityTrait,
  type ArtStyle,
  type Scenario,
  type TagCategory
} from '../../shared/character-creation-data.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

interface CharacterTemplate {
  name: string;
  description: string;
  quickSuggestion: string;
  personalityTrait: PersonalityTrait;
  artStyle: ArtStyle;
  selectedTags: { [key: string]: string[] };
  positivePrompt: string;
  negativePrompt: string;
  isNsfw: boolean;
}

async function connectToDatabase() {
  try {
    // Use the new database "your-database" instead of the default one
    const mongoUri = process.env.MONGODB_URI!;
    const newMongoUri = mongoUri.replace(/\/[^\/]*\?/, '/your-database?');
    
    console.log(' Connecting to your-database...');
    await mongoose.connect(newMongoUri);
    console.log(' Connected to MongoDB (your-database)');
  } catch (error) {
    console.error(' Database connection failed:', error);
    process.exit(1);
  }
}

async function setupBatchUser() {
  try {
    // Find or create a batch user
    let batchUser = await UserModel.findOne({ email: 'batch@medusavr-production.up.railway.app' });
    
    if (!batchUser) {
      batchUser = new UserModel({
        email: 'batch@medusavr-production.up.railway.app',
        username: 'batchuser',
        displayName: 'Batch User',
        isEmailVerified: true,
        subscriptionTier: 'pro',
        coins: 10000,
        createdAt: new Date(),
        lastActiveAt: new Date()
      });
      await batchUser.save();
      console.log(' Created batch user');
    } else {
      console.log(' Found existing batch user');
    }
    
    return batchUser;
  } catch (error) {
    console.error(' Failed to setup batch user:', error);
    throw error;
  }
}

function selectRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function selectRandomElements<T>(array: T[], count: number): T[] {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

function generateCharacterTemplate(): CharacterTemplate {
  // Select one random personality trait
  const personalityTrait = selectRandomElement(personalityTraits);
  const subTrait = selectRandomElement(personalityTrait.subTraits);
  
  // Select one random art style
  const artStyle = selectRandomElement(artStyles);
  
  // Select one tag from each category
  const selectedTags: { [key: string]: string[] } = {};
  
  tagCategories.forEach(category => {
    if (category.tags && category.tags.length > 0) {
      const maxSelections = category.maxSelections || 1;
      const selectedTagIds = selectRandomElements(category.tags, maxSelections)
        .map(tag => tag.id);
      selectedTags[category.id] = selectedTagIds;
    }
  });
  
  // Generate character name based on personality and tags
  const characterName = generateCharacterName(personalityTrait, selectedTags);
  
  // Generate description
  const description = generateCharacterDescription(characterName, personalityTrait, subTrait, selectedTags);
  
  // Generate quick suggestion
  const quickSuggestion = generateQuickSuggestion(personalityTrait, subTrait);
  
  // Generate prompts
  const { positivePrompt, negativePrompt } = generatePrompts(characterName, personalityTrait, artStyle, selectedTags);
  
  // Determine if NSFW based on tags
  const isNsfw = determineNsfwStatus(selectedTags);
  
  return {
    name: characterName,
    description,
    quickSuggestion,
    personalityTrait,
    artStyle,
    selectedTags,
    positivePrompt,
    negativePrompt,
    isNsfw
  };
}

function generateCharacterName(personalityTrait: PersonalityTrait, selectedTags: { [key: string]: string[] }): string {
  // Expanded and more diverse name pools
  const firstNames = {
    female: [
      'Aria', 'Zara', 'Maya', 'Kira', 'Nova', 'Iris', 'Vera', 'Lila', 'Eva', 'Luna',
      'Sage', 'Blaze', 'Storm', 'Echo', 'Nyx', 'Aurora', 'Seraphina', 'Ophelia', 'Persephone', 'Andromeda',
      'Cassandra', 'Delphine', 'Evangeline', 'Felicity', 'Genevieve', 'Helena', 'Isadora', 'Jocelyn', 'Katarina', 'Lysandra',
      'Magnolia', 'Nerissa', 'Octavia', 'Penelope', 'Quintessa', 'Rosalind', 'Seraphina', 'Theodora', 'Ursula', 'Valentina',
      'Wilhelmina', 'Xanthe', 'Yolanda', 'Zephyr', 'Amara', 'Brielle', 'Cordelia', 'Dahlia', 'Elara', 'Fiona',
      'Gwendolyn', 'Hazel', 'Imogen', 'Juniper', 'Kestrel', 'Lorelei', 'Mirabelle', 'Niamh', 'Oriana', 'Pandora'
    ],
    male: [
      'Kai', 'Leo', 'Max', 'Finn', 'Ace', 'Jax', 'Zane', 'Rex', 'Blake', 'Cole',
      'Phoenix', 'River', 'Sky', 'Storm', 'Echo', 'Nyx', 'Atlas', 'Orion', 'Apollo', 'Zeus',
      'Alexander', 'Benedict', 'Cassius', 'Damien', 'Evander', 'Felix', 'Gabriel', 'Harrison', 'Ignatius', 'Julian',
      'Killian', 'Lucian', 'Maximilian', 'Nathaniel', 'Octavian', 'Percival', 'Quentin', 'Raphael', 'Sebastian', 'Theodore',
      'Ulysses', 'Valentine', 'William', 'Xavier', 'Yorick', 'Zachary', 'Adrian', 'Bartholomew', 'Caspian', 'Dimitri',
      'Edmund', 'Frederick', 'Gregory', 'Humphrey', 'Ivan', 'Jeremiah', 'Kenneth', 'Lancelot', 'Montgomery', 'Nicholas'
    ],
    neutral: [
      'Alex', 'Sam', 'River', 'Sky', 'Phoenix', 'Sage', 'Blaze', 'Storm', 'Echo', 'Nyx',
      'Avery', 'Blake', 'Cameron', 'Dakota', 'Emery', 'Finley', 'Gray', 'Harper', 'Indigo', 'Jordan',
      'Kendall', 'Lane', 'Morgan', 'Nova', 'Ocean', 'Parker', 'Quinn', 'Remy', 'Sage', 'Taylor',
      'Uriel', 'Vale', 'Winter', 'Xen', 'Yael', 'Zion', 'Adrian', 'Blair', 'Casey', 'Drew',
      'Ellis', 'Frankie', 'Gale', 'Hayden', 'Iris', 'Jamie', 'Kai', 'Lennox', 'Marlowe', 'Noah'
    ]
  };

  const lastNames = [
    'Blackwood', 'Thornfield', 'Ravenscroft', 'Moonwhisper', 'Starweaver', 'Shadowmere', 'Brightwater', 'Goldleaf',
    'Silverwind', 'Ironforge', 'Copperfield', 'Bronzeblade', 'Steelheart', 'Crystalbrook', 'Ambervale', 'Emberglow',
    'Frostbane', 'Stormrider', 'Windchaser', 'Earthshaker', 'Firebrand', 'Waterfall', 'Mountainpeak', 'Valleybrook',
    'Forestwalker', 'Desertwind', 'Oceanwave', 'Skyward', 'Stardust', 'Moonbeam', 'Sunflare', 'Nightshade',
    'Dawnbreaker', 'Duskfall', 'Midnight', 'Noonlight', 'Twilight', 'Aurora', 'Eclipse', 'Comet',
    'Nebula', 'Galaxy', 'Cosmos', 'Universe', 'Infinity', 'Eternity', 'Timeless', 'Endless',
    'Mystic', 'Enigma', 'Riddle', 'Puzzle', 'Secret', 'Hidden', 'Forgotten', 'Ancient',
    'Legend', 'Myth', 'Fable', 'Tale', 'Story', 'Chronicle', 'Saga', 'Epic',
    'Adventure', 'Journey', 'Quest', 'Voyage', 'Expedition', 'Exploration', 'Discovery', 'Revelation',
    'Harmony', 'Melody', 'Rhythm', 'Cadence', 'Symphony', 'Concerto', 'Sonata', 'Aria',
    'Whisper', 'Echo', 'Silence', 'Sound', 'Voice', 'Song', 'Chant', 'Hymn',
    'Grace', 'Beauty', 'Elegance', 'Charm', 'Allure', 'Magnetism', 'Charisma', 'Presence',
    'Spirit', 'Soul', 'Heart', 'Mind', 'Body', 'Essence', 'Core', 'Center',
    'Guardian', 'Protector', 'Defender', 'Knight', 'Warrior', 'Fighter', 'Champion', 'Hero',
    'Wanderer', 'Traveler', 'Explorer', 'Pioneer', 'Trailblazer', 'Pathfinder', 'Navigator', 'Guide',
    'Scholar', 'Sage', 'Wise', 'Learned', 'Knowledgeable', 'Intelligent', 'Brilliant', 'Genius',
    'Artist', 'Creator', 'Maker', 'Builder', 'Craftsman', 'Artisan', 'Master', 'Expert',
    'Dreamer', 'Visionary', 'Idealist', 'Optimist', 'Realist', 'Pragmatist', 'Strategist', 'Tactician'
  ];
  
  const characterType = selectedTags['character-type']?.[0] || 'female';
  const nameList = firstNames[characterType as keyof typeof firstNames] || firstNames.neutral;
  
  const firstName = selectRandomElement(nameList);
  const lastName = selectRandomElement(lastNames);
  
  return `${firstName} ${lastName}`;
}

function generateCharacterDescription(
  name: string, 
  personalityTrait: PersonalityTrait, 
  subTrait: any, 
  selectedTags: { [key: string]: string[] }
): string {
  const characterType = selectedTags['character-type']?.[0] || 'person';
  const genre = selectedTags['genre']?.[0] || 'slice-of-life';
  const origin = selectedTags['origin']?.[0] || 'human';
  
  let description = `${name} is a ${characterType} with a ${personalityTrait.name} personality, specifically embodying ${subTrait.name} traits. `;
  
  if (origin !== 'human') {
    description += `As a ${origin} being, `;
  }
  
  description += `They are known for their ${personalityTrait.description.toLowerCase()}, particularly their ${subTrait.description.toLowerCase()}. `;
  
  if (selectedTags['fantasy'] && selectedTags['fantasy'].length > 0) {
    const fantasyElement = selectedTags['fantasy'][0];
    description += `They possess ${fantasyElement.replace('-', ' ')} abilities. `;
  }
  
  description += `In ${genre} settings, they bring a unique perspective and engaging presence to any interaction.`;
  
  return description;
}

function generateQuickSuggestion(personalityTrait: PersonalityTrait, subTrait: any): string {
  const suggestions = {
    calm: [
      "Would you like to join me for some peaceful meditation?",
      "Let's find a quiet place to talk and relax together.",
      "I sense you might need some tranquility in your day."
    ],
    confident: [
      "Ready to take on the world together? I know we can do anything!",
      "Let's make today amazing - I have some exciting ideas!",
      "I believe in us! What adventure should we embark on?"
    ],
    flirty: [
      "You're looking quite charming today... care to chat?",
      "I've been waiting for someone interesting like you to come along.",
      "Want to see what kind of trouble we can get into together?"
    ],
    mysterious: [
      "I have secrets that might interest you... if you're brave enough.",
      "There's more to me than meets the eye. Care to discover?",
      "I know things that could change everything you think you know."
    ],
    playful: [
      "Want to play a game? I promise it'll be fun!",
      "Life's too short to be serious all the time. Let's have some fun!",
      "I have the perfect way to brighten your day!"
    ]
  };
  
  const traitSuggestions = suggestions[personalityTrait.id as keyof typeof suggestions] || suggestions.playful;
  return selectRandomElement(traitSuggestions);
}

function generatePrompts(
  name: string, 
  personalityTrait: PersonalityTrait, 
  artStyle: ArtStyle, 
  selectedTags: { [key: string]: string[] }
): { positivePrompt: string; negativePrompt: string } {
  
  // Build positive prompt
  let positivePrompt = `masterpiece, best quality, ${artStyle.name} style, `;
  
  // Add character type
  const characterType = selectedTags['character-type']?.[0] || 'person';
  if (characterType === 'female') positivePrompt += '1girl, ';
  else if (characterType === 'male') positivePrompt += '1boy, ';
  
  // Add appearance tags
  if (selectedTags['appearance']) {
    selectedTags['appearance'].forEach(tag => {
      positivePrompt += `${tag.replace('-', ' ')}, `;
    });
  }
  
  // Add personality to prompt
  positivePrompt += `${personalityTrait.name} expression, ${personalityTrait.name} personality, `;
  
  // Add genre/setting
  if (selectedTags['genre']) {
    const genre = selectedTags['genre'][0];
    positivePrompt += `${genre} setting, `;
  }
  
  // Add fantasy elements
  if (selectedTags['fantasy']) {
    selectedTags['fantasy'].forEach(tag => {
      positivePrompt += `${tag.replace('-', ' ')}, `;
    });
  }
  
  positivePrompt += 'detailed, high quality, beautiful lighting';
  
  // Build negative prompt
  const negativePrompt = 'low quality, blurry, distorted, deformed, bad anatomy, bad hands, text, error, missing fingers, extra digit, fewer digits, cropped, worst quality, normal quality, jpeg artifacts, signature, watermark, username, ugly';
  
  return { positivePrompt, negativePrompt };
}

function determineNsfwStatus(selectedTags: { [key: string]: string[] }): boolean {
  // Check if any NSFW tags are selected
  const nsfwTags = ['nsfw', 'mature', 'adult'];
  const allSelectedTags = Object.values(selectedTags).flat();
  
  return nsfwTags.some(tag => allSelectedTags.includes(tag));
}

async function createCharacter(template: CharacterTemplate, userId: string): Promise<any> {
  try {
    console.log(` Creating character: ${template.name}`);
    
    // Check if character already exists
    const existingCharacter = await CharacterModel.findOne({ name: template.name });
    if (existingCharacter) {
      console.log(` Character "${template.name}" already exists, skipping...`);
      return { success: false, error: 'Character already exists', skipped: true };
    }

    // Convert to FastGenerationOptions
    const generationOptions: FastGenerationOptions = {
      characterName: template.name,
      description: template.description,
      positivePrompt: template.positivePrompt,
      negativePrompt: template.negativePrompt,
      personalityTraits: {
        mainTrait: template.personalityTrait.name,
        subTraits: template.personalityTrait.subTraits.map(st => st.name)
      },
      artStyle: {
        primaryStyle: template.artStyle.name
      },
      selectedTags: template.selectedTags,
      userId: userId,
      username: 'batchuser',
      isNsfw: template.isNsfw
    };
    
    // Use FastCharacterGenerationService (same as create character page)
    const fastGenerationService = new FastCharacterGenerationService();
    
    console.log(` Starting fast generation for ${template.name}...`);
    const result = await fastGenerationService.generateCharacterFast(generationOptions);
    
    if (result.success && result.character) {
      console.log(` Character "${template.name}" created successfully!`);
      console.log(`   Art Style: ${template.artStyle.displayName}`);
      console.log(`   Personality: ${template.personalityTrait.displayName}`);
      console.log(`   Tags: ${Object.values(template.selectedTags).flat().join(', ')}`);
      console.log(`   NSFW: ${template.isNsfw}`);
      console.log(`   Character ID: ${result.character.id}`);
      console.log(`   Character Seed: ${result.characterSeed}`);
      
      // Generate 10 embedding images (same as create character page)
      console.log(` Starting embedding image generation for ${template.name}...`);
      const embeddingOptions: EmbeddingGenerationOptions = {
        characterId: result.character.id.toString(),
        characterName: template.name,
        description: template.description,
        personalityTraits: {
          mainTrait: template.personalityTrait.name,
          subTraits: template.personalityTrait.subTraits.map(st => st.name)
        },
        artStyle: {
          primaryStyle: template.artStyle.name
        },
        selectedTags: template.selectedTags,
        userId: userId,
        username: 'batchuser',
        characterSeed: result.characterSeed || 123456789,
        basePrompt: template.positivePrompt,
        baseNegativePrompt: template.negativePrompt
      };
      
      const embeddingService = new CharacterEmbeddingService();
      const embeddingResult = await embeddingService.generateEmbeddingImages(embeddingOptions);
      
      if (embeddingResult.success) {
        console.log(` Generated ${embeddingResult.imagesGenerated} embedding images for ${template.name}`);
        console.log(`   Embedding images saved to: ${embeddingResult.bunnyUrls?.join(', ')}`);
      } else {
        console.log(` Embedding generation failed for ${template.name}: ${embeddingResult.error}`);
      }
      
      return { 
        success: true, 
        character: result.character,
        embeddingResult: embeddingResult
      };
    } else {
      throw new Error(result.error || 'Unknown generation error');
    }
    
  } catch (error) {
    console.error(` Failed to create character "${template.name}":`, error);
    return { success: false, error: String(error) };
  }
}

async function main() {
  console.log(' Starting Character Generation from Data');
  
  // Connect to database
  console.log(' Connecting to database...');
  await connectToDatabase();
  
  // Setup batch user
  console.log('👤 Setting up batch user...');
  const batchUser = await setupBatchUser();
  
  // Check for test mode
  const testMode = process.argv.includes('--test') || process.argv.includes('-t');
  const characterCount = testMode ? 1 : parseInt(process.argv[2]) || 5;
  
  // Track used names to prevent duplicates
  const usedNames = new Set<string>();
  
  if (testMode) {
    console.log(' Running in TEST MODE - creating 1 character');
  } else {
    console.log(` Creating ${characterCount} character(s)...`);
  }
  
  let successCount = 0;
  let skipCount = 0;
  let errorCount = 0;
  let totalEmbeddingImages = 0;
  
  for (let i = 0; i < characterCount; i++) {
    console.log(`\n--- Processing ${i + 1}/${characterCount} ---`);
    
    // Generate character template with unique name
    let template;
    let attempts = 0;
    do {
      template = generateCharacterTemplate();
      attempts++;
      if (attempts > 50) {
        console.warn(` Could not generate unique name after 50 attempts, using: ${template.name}`);
        break;
      }
    } while (usedNames.has(template.name));
    
    usedNames.add(template.name);
    console.log(` Generated template for: ${template.name}`);
    console.log(`   Personality: ${template.personalityTrait.displayName}`);
    console.log(`   Art Style: ${template.artStyle.displayName}`);
    console.log(`   Tags: ${Object.values(template.selectedTags).flat().join(', ')}`);
    
    // Create character
    const result = await createCharacter(template, batchUser._id.toString());
    
    if (result.success) {
      successCount++;
      console.log(` Character "${template.name}" created successfully!`);
      
      // Count embedding images
      if (result.embeddingResult && result.embeddingResult.imagesGenerated) {
        totalEmbeddingImages += result.embeddingResult.imagesGenerated;
        console.log(`   📸 Generated ${result.embeddingResult.imagesGenerated} embedding images`);
      }
    } else if (result.skipped) {
      skipCount++;
      console.log(`⏭️ Character "${template.name}" skipped (already exists)`);
    } else {
      errorCount++;
      console.error(` Failed to create "${template.name}": ${result.error}`);
    }
    
    // Add delay between characters
    if (i < characterCount - 1) {
      console.log('⏳ Waiting 3 seconds before next character...');
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }
  
  console.log('\n Character Generation Complete!');
  console.log(` Successfully created: ${successCount} characters`);
  console.log(`⏭️ Skipped (already exist): ${skipCount} characters`);
  console.log(` Failed: ${errorCount} characters`);
  console.log(`📸 Total embedding images generated: ${totalEmbeddingImages}`);
  
  if (testMode && successCount > 0) {
    console.log('\n Test completed! If everything looks good, run without --test flag to create more characters.');
    console.log('Command: npx tsx server/scripts/generateCharactersFromData.ts [number]');
  }
  
  // Cleanup
  try {
    await mongoose.connection.close();
    console.log(' Disconnected from MongoDB');
  } catch (error) {
    console.log(' MongoDB connection already closed');
  }
}

// Run the script
main().catch(console.error);
