import { Router } from 'express';
import { TagModel } from '../db/models/TagModel.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = Router();

router.post('/seed-tags', async (req, res) => {
  try {
    console.log('Starting tag seeding process...');
    
    // Read the tags.json file
    const tagsPath = path.join(__dirname, '../data/tags.json');
    const tagsData = JSON.parse(fs.readFileSync(tagsPath, 'utf8'));
    
    console.log(`Found ${tagsData.length} categories in tags.json`);
    
    // Clear existing tags
    await TagModel.deleteMany({});
    console.log('Cleared existing tags');
    
    // Prepare all tags for insertion
    const allTags = [];
    
    for (const category of tagsData) {
      for (const tag of category.tags) {
        allTags.push({
          name: tag.name,
          emoji: tag.emoji,
          color: tag.color,
          category: category.name,
          isNSFW: tag.isNSFW || false
        });
      }
    }
    
    console.log(`Prepared ${allTags.length} tags for insertion`);
    
    // Insert all tags
    const result = await TagModel.insertMany(allTags);
    console.log(`Successfully inserted ${result.length} tags`);
    
    res.json({
      success: true,
      message: `Successfully seeded ${result.length} tags`,
      categoriesProcessed: tagsData.length,
      tagsInserted: result.length
    });
    
  } catch (error) {
    console.error('Error seeding tags:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
});

export default router;
