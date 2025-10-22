import mongoose from 'mongoose';
import { TagModel } from '../db/models/TagModel';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as dotenv from 'dotenv';

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from the parent directory
dotenv.config({ path: path.join(__dirname, '../../.env') });

async function seedTagsFromJson() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI!, {
      dbName: "test",
    });
    console.log('Connected to MongoDB');

    // Read tags from JSON file
    const tagsJsonPath = path.join(__dirname, '../data/tags.json');
    const tagsData = JSON.parse(fs.readFileSync(tagsJsonPath, 'utf8'));

    // Convert category display names to internal names
    const categoryMapping: Record<string, string> = {
      'Character Type': 'character-type',
      'Genre': 'genre',
      'Personality': 'personality',
      'Physical Traits': 'physical-traits',
      'Appearance': 'appearance',
      'Origin': 'origin',
      'Sexuality': 'sexuality',
      'Fantasy': 'fantasy-kink',
      'Content Rating': 'content-rating',
      'Relationship': 'relationship',
      'Ethnicity': 'ethnicity',
      'Scenario': 'scenario'
    };

    // Flatten and transform the tags
    const allTags = [];
    for (const categoryData of tagsData) {
      const categoryName = categoryMapping[categoryData.category] || categoryData.category.toLowerCase().replace(/\s+/g, '-');
      
      for (const tag of categoryData.tags) {
        allTags.push({
          name: tag.name,
          displayName: tag.displayName,
          category: categoryName,
          color: tag.color,
          emoji: tag.emoji,
          isNSFW: tag.isNSFW,
          description: `${tag.displayName} tag`,
          usageCount: 0
        });
      }
    }

    console.log(`Found ${allTags.length} tags to seed`);

    // Clear existing tags
    await TagModel.deleteMany({});
    console.log('Cleared existing tags');

    // Insert new tags
    await TagModel.insertMany(allTags);
    console.log(`Seeded ${allTags.length} tags successfully`);

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error seeding tags:', error);
    process.exit(1);
  }
}

seedTagsFromJson();
