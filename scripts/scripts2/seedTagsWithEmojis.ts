import mongoose from 'mongoose';
import { TagModel } from '../db/models/TagModel';
import * as dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function seedTags() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/aicompanion');
    console.log('Connected to MongoDB');

    // Load tags from JSON file
    const tagsPath = path.join(__dirname, '../data/tags.json');
    const tagsData = JSON.parse(fs.readFileSync(tagsPath, 'utf-8'));
    
    // Flatten the tags from categories
    const allTags: any[] = [];
    tagsData.forEach((category: any) => {
      category.tags.forEach((tag: any) => {
        allTags.push({
          name: tag.name,
          displayName: tag.displayName,
          description: tag.description || `${tag.displayName} tag`,
          category: category.category.toLowerCase().replace(/[^a-z0-9]/g, '-'),
          color: tag.color,
          emoji: tag.emoji,
          isNSFW: tag.isNSFW || false
        });
      });
    });

    // Clear existing tags
    await TagModel.deleteMany({});
    console.log('Cleared existing tags');

    // Insert tags from JSON
    await TagModel.insertMany(allTags);
    console.log(`Inserted ${allTags.length} tags`);

    console.log('Tag seeding completed successfully!');
  } catch (error) {
    console.error('Error seeding tags:', error);
  } finally {
    await mongoose.disconnect();
  }
}

// Run the seed function
seedTags();
