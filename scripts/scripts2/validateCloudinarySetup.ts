import * as dotenv from "dotenv";
import { CloudinaryFolderService } from '../services/CloudinaryFolderService';

// Load environment variables from .env file
dotenv.config();

/**
 * Validates Cloudinary configuration and folder service functionality
 */
async function validateSetup() {
  console.log(' Validating Cloudinary Folder Setup...\n');
  
  // 1. Check configuration
  console.log('1. Checking Cloudinary configuration...');
  const isConfigured = CloudinaryFolderService.isConfigured();
  
  if (isConfigured) {
    console.log(' Cloudinary configuration found');
  } else {
    console.log(' Cloudinary configuration missing');
    console.log('   Please set the following environment variables:');
    console.log('   - CLOUDINARY_CLOUD_NAME');
    console.log('   - CLOUDINARY_API_KEY');
    console.log('   - CLOUDINARY_API_SECRET');
    console.log('\n   Example .env file:');
    console.log('   CLOUDINARY_CLOUD_NAME=your_cloud_name');
    console.log('   CLOUDINARY_API_KEY=your_api_key');
    console.log('   CLOUDINARY_API_SECRET=your_api_secret\n');
  }
  
  // 2. Test folder path generation
  console.log('2. Testing folder path generation...');
  const testUsername = 'aro';
  const paths = CloudinaryFolderService.getUserFolderPaths(testUsername);
  
  console.log(` User folder: ${paths.userFolder}`);
  console.log(` Avatar folder: ${paths.avatarFolder}`);
  console.log(` Characters folder: ${paths.charactersFolder}`);
  
  // 3. Test folder creation (only if configured)
  if (isConfigured) {
    console.log('\n3. Testing folder creation...');
    try {
      const success = await CloudinaryFolderService.createUserFolders(testUsername);
      if (success) {
        console.log(' Folder creation test successful');
        
        // Verify folders
        const verified = await CloudinaryFolderService.verifyUserFolders(testUsername);
        console.log(` Folder verification: ${verified ? 'PASSED' : 'FAILED'}`);
        
        // Cleanup test folders
        console.log(' Cleaning up test folders...');
        await CloudinaryFolderService.cleanupUserFolders(testUsername);
        console.log(' Cleanup completed');
      } else {
        console.log(' Folder creation test failed');
      }
    } catch (error) {
      console.log(' Folder creation test error:', error);
    }
  } else {
    console.log('\n3. Skipping folder creation test (configuration missing)');
  }
  
  console.log('\n Setup Validation Complete!');
  
  if (isConfigured) {
    console.log('\n Your Cloudinary folder system is ready to use!');
    console.log('   - New users will automatically get folder structure created');
    console.log('   - Run migration script for existing users if needed');
  } else {
    console.log('\n  Setup incomplete. Please configure Cloudinary environment variables.');
  }
  
  process.exit(0);
}

// Run validation
validateSetup().catch(error => {
  console.error('Validation failed:', error);
  process.exit(1);
});
