import dotenv from 'dotenv';
import { CloudinaryToBunnyMigrationService } from '../server/services/CloudinaryToBunnyMigrationService.js';
import { BunnyStorageService } from '../server/services/BunnyStorageService.js';
import { v2 as cloudinary } from 'cloudinary';

// Load environment variables
dotenv.config();

async function quickTest() {
  console.log('🧪 Quick Migration Test');
  console.log('=======================\n');

  try {
    // Debug environment variables
    console.log('Environment check:');
    console.log('CLOUDINARY_CLOUD_NAME:', process.env.CLOUDINARY_CLOUD_NAME ? '✓' : '✗');
    console.log('CLOUDINARY_API_KEY:', process.env.CLOUDINARY_API_KEY ? '✓' : '✗');
    console.log('CLOUDINARY_API_SECRET:', process.env.CLOUDINARY_API_SECRET ? '✓' : '✗');
    console.log('BUNNY_ACCESS_KEY:', process.env.BUNNY_ACCESS_KEY ? '✓' : '✗');
    console.log('BUNNY_STORAGE_ZONE_NAME:', process.env.BUNNY_STORAGE_ZONE_NAME ? '✓' : '✗');

    // Test individual services
    console.log('\nTesting individual services:');
    console.log('BUNNY_ACCESS_KEY value:', process.env.BUNNY_ACCESS_KEY ? process.env.BUNNY_ACCESS_KEY.substring(0, 10) + '...' : 'null');
    console.log('BUNNY_STORAGE_ZONE_NAME value:', process.env.BUNNY_STORAGE_ZONE_NAME);
    console.log('BunnyStorageService.isConfigured():', BunnyStorageService.isConfigured());
    
    const cloudinaryConfigured = !!(
      process.env.CLOUDINARY_CLOUD_NAME && 
      process.env.CLOUDINARY_API_KEY && 
      process.env.CLOUDINARY_API_SECRET
    );
    console.log('Cloudinary configured:', cloudinaryConfigured);

    // Check if services are configured
    if (!CloudinaryToBunnyMigrationService.isConfigured()) {
      console.error('❌ Services not configured properly');
      console.error('Please check your environment variables');
      return;
    }

    console.log('✅ Services configured successfully');

    // List all folders
    console.log('\n📁 Fetching Cloudinary folders...');
    const folders = await CloudinaryToBunnyMigrationService.getAllCloudinaryFolders();
    console.log(`Found ${folders.length} folders:`);
    
    folders.slice(0, 10).forEach((folder, index) => {
      console.log(`  ${index + 1}. ${folder}`);
    });
    
    if (folders.length > 10) {
      console.log(`  ... and ${folders.length - 10} more folders`);
    }

    if (folders.length === 0) {
      console.log('No folders found to migrate');
      return;
    }

    // Look for folders that might have content - try usernames that look more realistic
    const candidateFolders = folders.filter(f => f.length > 5 && !f.match(/^[0-9]+$/));
    console.log(`\nLooking for content in ${candidateFolders.length} realistic folders (skipping number-only folders):`);
    candidateFolders.slice(0, 10).forEach((folder, index) => {
      console.log(`  ${index + 1}. ${folder}`);
    });

    // Test with folders that might have content
    let testFolder: string | null = null;
    const foldersToCheck = candidateFolders.length > 0 ? candidateFolders.slice(0, 10) : folders.slice(0, 10);
    
    for (const folder of foldersToCheck) {
      console.log(`\n🔍 Checking folder: ${folder}`);
      const resources = await CloudinaryToBunnyMigrationService.getCloudinaryResourcesInFolder(folder);
      console.log(`Found ${resources.length} resources in ${folder}`);
      
      if (resources.length > 0) {
        testFolder = folder;
        break;
      }
    }

    if (!testFolder) {
      console.log('No folders with content found in first 5 folders. The migration tool is ready but no test data available.');
      return;
    }

    console.log(`\n🧪 Testing migration with folder: ${testFolder}`);
    
    const testResult = await CloudinaryToBunnyMigrationService.testMigrationForFolder(testFolder);
    
    if (testResult.success) {
      console.log('✅ Test migration successful!');
      console.log('\nNext steps:');
      console.log(`1. To migrate just this folder: npm run migrate migrate ${testFolder}`);
      console.log('2. To migrate all folders: npm run migrate migrate');
      console.log('3. To list all commands: npm run migrate help');
    } else {
      console.log('❌ Test migration failed');
      if (testResult.error) {
        console.log('Error:', testResult.error);
      }
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

quickTest();
