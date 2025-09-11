import { CharacterModel } from '../db/models/CharacterModel';
import { connect, disconnect } from 'mongoose';
import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

async function deleteAllCharacters() {
  try {
    // Connect to MongoDB - explicitly use test database
    const baseUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/test';
    const testDbUri = baseUri.replace(/\/[^/]*(\?|$)/, '/test$1');
    await connect(testDbUri);
    console.log('Connected to MongoDB');

    // Count existing characters before deletion
    const existingCount = await CharacterModel.countDocuments();
    console.log(`Found ${existingCount} characters in the database`);

    if (existingCount === 0) {
      console.log('No characters found to delete.');
      return;
    }

    // Confirm deletion
    console.log('Deleting all characters...');
    
    // Delete all characters
    const result = await CharacterModel.deleteMany({});
    console.log(`Successfully deleted ${result.deletedCount} characters`);

    // Verify deletion
    const remainingCount = await CharacterModel.countDocuments();
    console.log(`Remaining characters in database: ${remainingCount}`);

  } catch (error) {
    console.error('Error deleting characters:', error);
  } finally {
    // Disconnect from MongoDB
    await disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the deletion
deleteAllCharacters().catch(console.error); 