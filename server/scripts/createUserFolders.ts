import * as dotenv from "dotenv";
import { CloudinaryFolderService } from '../services/CloudinaryFolderService';

// Load environment variables from .env file
dotenv.config();

/**
 * Simple script to create Cloudinary folders for a specific user
 */
async function createFoldersForUser() {
  try {
    // Your existing user's username
    const username = 'aro';
    
    console.log(`Creating Cloudinary folder structure for user: ${username}`);
    
    // Create folder structure
    const success = await CloudinaryFolderService.createUserFolders(username);
    
    if (success) {
      console.log('✅ Successfully created folders!');
      
      // Verify folders were created
      const verified = await CloudinaryFolderService.verifyUserFolders(username);
      console.log(`✅ Folders verified: ${verified}`);
      
      // Show folder paths
      const paths = CloudinaryFolderService.getUserFolderPaths(username);
      console.log('📁 Folder structure:');
      console.log(`   User folder: ${paths.userFolder}`);
      console.log(`   Avatar folder: ${paths.avatarFolder}`);
      console.log(`   Characters folder: ${paths.charactersFolder}`);
      
    } else {
      console.log('❌ Failed to create folders');
    }
    
    process.exit(0);
    
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

// Run the script
createFoldersForUser();
