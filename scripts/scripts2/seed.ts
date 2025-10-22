// scripts/seed.ts
import mongoose from "mongoose";
import * as dotenv from "dotenv";
import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

// ESM __dirname shim
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Utility to load JSON data without import assertions
async function loadJSON<T>(filename: string): Promise<T> {
  const filePath = path.resolve(__dirname, "../data", filename);
  const raw = await fs.readFile(filePath, "utf-8");
  return JSON.parse(raw) as T;
}

// Helper function to get random tags for a character
function getRandomTags(character?: any): string[] {
  const baseTags = [
    // Character types
    'female', 'male', 'non-human', 'non-binary',
    // Personalities  
    'shy', 'confident', 'flirty', 'mysterious', 'caring', 'playful', 'dominant', 'submissive',
    'tsundere', 'yandere', 'kuudere', 'deredere', 'dandere',
    // Appearance
    'blonde', 'brunette', 'redhead', 'black-hair', 'petite', 'tall', 'curvy', 'athletic',
    'blue-eyes', 'green-eyes',
    // Physical traits
    'elf', 'alien', 'robot', 'realistic', 'goth',
    // Genres
    'anime', 'sci-fi', 'fantasy', 'modern', 'romantic', 'wholesome', 'action', 'adventure',
    // Origins
    'original-character', 'game', 'movie', 'books',
    // Scenarios
    'school', 'office', 'slice-of-life',
    // Content
    'sfw', 'mature',
    // Relationships
    'friend', 'girlfriend', 'boyfriend', 'stranger'
  ];
  
  let tags = [...baseTags];
  
  // Add context-aware tags based on character description
  if (character) {
    const description = character.description.toLowerCase();
    const name = character.name.toLowerCase();
    
    // Add gender tags based on typical names/descriptions
    if (['mira', 'aria', 'luna', 'stella', 'nova', 'vera', 'elena', 'sasha'].some(n => name.includes(n))) {
      tags.unshift('female');
    } else if (['zephyr', 'kai', 'alex', 'storm', 'raven', 'phoenix', 'sage'].some(n => name.includes(n))) {
      tags.unshift('male');
    }
    
    // Add theme-based tags
    if (description.includes('space') || description.includes('star') || description.includes('planet') || description.includes('interstellar')) {
      tags.unshift('sci-fi', 'alien');
    }
    if (description.includes('magic') || description.includes('spell') || description.includes('wizard') || description.includes('enchant')) {
      tags.unshift('fantasy', 'magical');
    }
    if (description.includes('war') || description.includes('fight') || description.includes('battle') || description.includes('combat')) {
      tags.unshift('action', 'adventure');
    }
    if (description.includes('romance') || description.includes('love') || description.includes('heart')) {
      tags.unshift('romantic');
    }
    if (description.includes('nature') || description.includes('forest') || description.includes('wind') || description.includes('storm')) {
      tags.unshift('fantasy', 'adventure');
    }
    if (description.includes('teach') || description.includes('learn') || description.includes('student') || description.includes('school')) {
      tags.unshift('school');
    }
    if (description.includes('office') || description.includes('work') || description.includes('corporate')) {
      tags.unshift('office');
    }
    
    // Add content rating based on rating
    if (character.rating === 'PG' || character.rating === 'G') {
      tags.unshift('sfw', 'wholesome');
    } else if (character.rating === 'R' || character.rating === 'NC-17') {
      tags.unshift('nsfw', 'mature');
    } else {
      tags.unshift('sfw');
    }
  }
  
  // Remove duplicates and randomly select 4-8 tags
  const uniqueTags = Array.from(new Set(tags));
  const numTags = Math.floor(Math.random() * 5) + 4; // 4-8 tags
  const shuffled = uniqueTags.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, numTags);
}

// Mongoose model imports
import { CharacterModel }       from "../db/models/CharacterModel.js";
import { NavigationModel }      from "../db/models/NavigationModel.ts";
import { CreateItemModel }      from "../db/models/CreateItemModel.ts";
import { CategoryModel }        from "../db/models/CategoryModel.ts";
import { ChatItemModel }        from "../db/models/ChatItemModel.ts";
import { CharacterHeaderModel } from "../db/models/CharacterHeaderModel.ts";
import { ChatBubbleModel }      from "../db/models/ChatBubbleModel.ts";
import { TransactionModel }     from "../db/models/TransactionModel.ts";
import { CoinPackageModel }     from "../db/models/CoinPackageModel.ts";
import { TagModel }             from "../db/models/TagModel.js";
import { UsageItemModel }       from "../db/models/UsageItemsModel.ts";

async function seed() {
  // 1) Connect to MongoDB
  await mongoose.connect(process.env.MONGODB_URI!);
  console.log(" Connected to MongoDB");

  // 2) Clear existing data
  await Promise.all([
    CharacterModel.deleteMany({}),
    NavigationModel.deleteMany({}),
    CreateItemModel.deleteMany({}),
    CategoryModel.deleteMany({}),
    ChatItemModel.deleteMany({}),
    CharacterHeaderModel.deleteMany({}),
    ChatBubbleModel.deleteMany({}),
    TransactionModel.deleteMany({}),
    CoinPackageModel.deleteMany({}),
    UsageItemModel.deleteMany({}),
  ]);
  console.log(" Cleared existing collections");

  // 3) Load JSON data
  const characters = await loadJSON<any[]>("characters.json");
  const navigation = await loadJSON<any[]>("navigation.json");
  const createItems = await loadJSON<any[]>("createItems.json");
  const categories = await loadJSON<any[]>("categories.json");
  const dummyChats = await loadJSON<any[]>("chats.json");
  const characterHeader = await loadJSON<any>("characterHeader.json");
  const chatBubbles = await loadJSON<any[]>("chatBubbles.json");
  const recentTransactions = await loadJSON<any[]>("recentTransactions.json");
  const coinPackages = await loadJSON<any[]>("coinPackages.json");
  const usageItems = await loadJSON<any[]>("usageItems.json");

  // 4) Seed characters with random tags
  const charactersWithTags = characters.map(c => {
    const randomTags = getRandomTags(c);
    return {
      id:         c.id,
      avatar:     c.avatar,
      name:       c.name,
      description:c.description,
      rating:     c.rating,
      nsfw:       c.nsfw,
      chatCount:  c.chatCount,
      tagNames:   randomTags, // Add context-aware random tags
    };
  });
  
  await CharacterModel.insertMany(charactersWithTags);
  console.log(`→ Inserted ${characters.length} characters with random tags`);

  // 5) Seed navigation
  await NavigationModel.insertMany(
    navigation.map(n => ({
      name: n.name,
      href: n.href,
      icon: n.icon
    }))
  );
  console.log(`→ Inserted ${navigation.length} navigation items`);

  // 6) Seed create items
  await CreateItemModel.insertMany(
    createItems.map(i => ({ name: i.name, href: i.href, icon: i.icon }))
  );
  console.log(`→ Inserted ${createItems.length} create items`);

  // 7) Seed categories
  await CategoryModel.insertMany(
    categories.map(c => ({ name: c.name, emoji: c.emoji }))
  );
  console.log(`→ Inserted ${categories.length} categories`);

  // 8) Seed dummy chats
  await ChatItemModel.insertMany(
    dummyChats.map(d => ({
      id:          d.id,
      name:        d.name,
      avatarUrl:   d.avatarUrl,
      snippet:     d.snippet,
      unreadCount: d.unreadCount,
      lastTime:    d.lastTime,
    }))
  );
  console.log(`→ Inserted ${dummyChats.length} dummy chats`);

  // 9) Seed character header
  await CharacterHeaderModel.create(characterHeader);
  console.log(`→ Inserted character header`);

  // 10) Seed chat bubbles
  await ChatBubbleModel.insertMany(
    chatBubbles.map(b => ({ avatarUrl: b.avatarUrl, speakerName: b.speakerName, message: b.message }))
  );
  console.log(`→ Inserted ${chatBubbles.length} chat bubbles`);

  // 11) Seed transactions
  await TransactionModel.insertMany(
    recentTransactions.map(t => ({ icon: t.icon, description: t.description, amount: t.amount, time: t.time, color: t.color }))
  );
  console.log(`→ Inserted ${recentTransactions.length} transactions`);

  // 12) Seed coin packages
  await CoinPackageModel.insertMany(
    coinPackages.map(p => ({ name: p.name, coins: p.coins, price: p.price, popular: p.popular, savings: p.savings }))
  );
  console.log(`→ Inserted ${coinPackages.length} coin packages`);

  // 13) Seed usage items
  await UsageItemModel.insertMany(
    usageItems.map(u => ({ icon: u.icon, name: u.name, cost: u.cost, color: u.color }))
  );
  console.log(`→ Inserted ${usageItems.length} usage items`);

  console.log(" Seed complete");

  // 14) Disconnect
  await mongoose.disconnect();
}

seed().catch(err => {
  console.error(" Seed failed:", err);
  process.exit(1);
});