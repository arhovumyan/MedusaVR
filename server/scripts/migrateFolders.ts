import mongoose from 'mongoose';
import { v2 as cloudinary } from 'cloudinary';
import { UserModel } from '../db/models/UserModel';
import { CloudinaryFolderService } from '../services/CloudinaryFolderService';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Migration script to create Cloudinary folder structure for existing users
 */
async function migrateExistingUsers() {
  try {
    console.log('Starting migration: Creating Cloudinary folders for existing users...');
    
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/aicompanion');
    
    // Get all users
    const users = await UserModel.find({}, { _id: 1, username: 1, email: 1 });
    console.log(`Found ${users.length} users to migrate`);
    
    let successCount = 0;
    let failureCount = 0;
    
    for (const user of users) {
      try {
        console.log(`Creating folders for user: ${user.username} (${user._id})`);
        
        // Check if folders already exist
        const foldersExist = await CloudinaryFolderService.verifyUserFolders(user.username);
        
        if (foldersExist) {
          console.log(`Folders already exist for user ${user.username}, skipping...`);
          successCount++;
          continue;
        }
        
        // Create folder structure
        const success = await CloudinaryFolderService.createUserFolders(user.username);
        
        if (success) {
          console.log(`✅ Successfully created folders for user: ${user.username}`);
          successCount++;
        } else {
          console.log(`❌ Failed to create folders for user: ${user.username}`);
          failureCount++;
        }
        
        // Add a small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error(`Error processing user ${user.username}:`, error);
        failureCount++;
      }
    }
    
    console.log('\n=== Migration Complete ===');
    console.log(`Total users: ${users.length}`);
    console.log(`Successful: ${successCount}`);
    console.log(`Failed: ${failureCount}`);
    
    if (failureCount > 0) {
      console.log('\n⚠️  Some users failed migration. Check the logs above for details.');
      process.exit(1);
    } else {
      console.log('\n🎉 All users migrated successfully!');
      process.exit(0);
    }
    
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

// Run migration if this script is called directly
const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  migrateExistingUsers();
}

export { migrateExistingUsers };
