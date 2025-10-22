import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import { CharacterModel } from '../db/models/CharacterModel.js';
import { TagModel } from '../db/models/TagModel.js';

dotenv.config();

async function populateCharacterTagReferences() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/aicompanion');
    console.log('Connected to MongoDB');

    // Get all characters with tagNames but empty tags array
    const characters = await CharacterModel.find({
      tagNames: { $exists: true, $ne: [] },
      $or: [
        { tags: { $exists: false } },
        { tags: [] }
      ]
    });

    console.log(`Found ${characters.length} characters that need tag references populated`);

    // Get all tags to create a lookup map
    const allTags = await TagModel.find({});
    const tagMap = new Map();
    allTags.forEach(tag => {
      tagMap.set(tag.name, tag._id);
    });

    console.log(`Found ${allTags.length} tags in database`);

    let updatedCount = 0;
    let errorCount = 0;

    // Update each character
    for (const character of characters) {
      try {
        const tagObjectIds = [];
        const validTagNames = [];

        // Convert tagNames to ObjectIds
        for (const tagName of character.tagNames) {
          const tagId = tagMap.get(tagName);
          if (tagId) {
            tagObjectIds.push(tagId);
            validTagNames.push(tagName);
          } else {
            console.warn(`  Tag "${tagName}" not found in database for character ${character.name}`);
          }
        }

        // Update the character with tag ObjectIds
        await CharacterModel.findByIdAndUpdate(character._id, {
          tags: tagObjectIds,
          tagNames: validTagNames // Clean up any invalid tag names
        });

        console.log(` Updated ${character.name}: ${tagObjectIds.length} tag references added`);
        updatedCount++;

      } catch (error) {
        console.error(` Error updating ${character.name}:`, error);
        errorCount++;
      }
    }

    console.log('\n Summary:');
    console.log(` Successfully updated: ${updatedCount} characters`);
    console.log(` Errors: ${errorCount} characters`);

    // Verify the results
    console.log('\n Verification - First 3 updated characters:');
    const verifyCharacters = await CharacterModel.find({
      tags: { $ne: [] }
    }).limit(3).populate('tags', 'name displayName');

    verifyCharacters.forEach((char, index) => {
      console.log(`\n${index + 1}. ${char.name}`);
      console.log(`   TagNames: [${char.tagNames.join(', ')}]`);
      console.log(`   Tags: [${char.tags.map((tag: any) => tag.name).join(', ')}]`);
      console.log(`   Match: ${char.tagNames.length === char.tags.length ? '' : ''}`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n Disconnected from MongoDB');
  }
}

populateCharacterTagReferences();
