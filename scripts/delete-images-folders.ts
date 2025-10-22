#!/usr/bin/env tsx

import { CloudinaryImagesFolderDeletionService } from '../server/services/CloudinaryImagesFolderDeletionService';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const args = process.argv.slice(2);

async function showConfiguration() {
  console.log(' Cloudinary Images Folder Deletion Tool');
  console.log('==========================================\n');
  
  try {
    // Validate configuration by trying to get folders
    const folders = await CloudinaryImagesFolderDeletionService.getAllCloudinaryFolders();
    if (folders.length >= 0) { // Even 0 folders is valid if configured correctly
      console.log(' Configuration validated');
      return true;
    } else {
      throw new Error('Invalid configuration response');
    }
  } catch (error) {
    console.error(' Configuration error:', error);
    console.log('\nPlease ensure your .env file contains:');
    console.log('CLOUDINARY_CLOUD_NAME=your_cloud_name');
    console.log('CLOUDINARY_API_KEY=your_api_key');
    console.log('CLOUDINARY_API_SECRET=your_api_secret');
    return false;
  }
}

async function listImagesFolders() {
  if (!await showConfiguration()) return;
  
  console.log(' Scanning all folders for "images" folders...\n');
  
  try {
    const userFolders = await CloudinaryImagesFolderDeletionService.getAllCloudinaryFolders();
    console.log(`Found ${userFolders.length} user folders to scan\n`);
    
    const allImagesFolders: string[] = [];
    
    for (const userFolder of userFolders) {
      console.log(` Scanning: ${userFolder}`);
      const imagesFolders = await CloudinaryImagesFolderDeletionService.findImagesFoldersInFolder(userFolder);
      
      if (imagesFolders.length > 0) {
        imagesFolders.forEach(folder => {
          console.log(`  📸 Found images folder: ${folder}`);
          allImagesFolders.push(folder);
        });
      } else {
        console.log(`  (no images folders found)`);
      }
    }
    
    console.log(`\n Summary:`);
    console.log(`    User folders scanned: ${userFolders.length}`);
    console.log(`   📸 Images folders found: ${allImagesFolders.length}`);
    
    if (allImagesFolders.length > 0) {
      console.log(`\nUse 'npm run delete-images test <folder-path>' to test deletion for a specific images folder`);
      console.log(`Use 'npm run delete-images delete' to delete ALL images folders (use with caution!)`);
    }
    
  } catch (error) {
    console.error(' Failed to list images folders:', error);
    process.exit(1);
  }
}

async function testDeletion(folderPath: string) {
  if (!await showConfiguration()) return;
  
  console.log(` Testing deletion for images folder: ${folderPath}\n`);
  
  try {
    const result = await CloudinaryImagesFolderDeletionService.deleteImagesFolderByPath(folderPath, true);
    
    if (result.success) {
      console.log(`\n Test deletion successful for ${folderPath}!`);
      console.log('You can now run full deletion for this folder or all folders.');
      console.log(`\nTo delete this folder: npm run delete-images delete-folder ${folderPath}`);
      console.log('To delete all images folders: npm run delete-images delete');
    } else {
      console.log(`\n Test deletion failed for ${folderPath}`);
      if (result.error) {
        console.error('Error:', result.error);
      }
      
      // Show failed deletions
      const failedDeletions = result.results.filter(r => !r.success);
      if (failedDeletions.length > 0) {
        console.log('\nFailed deletions:');
        failedDeletions.forEach(deletion => {
          console.log(`  - ${deletion.resource?.filename}: ${deletion.error}`);
        });
      }
    }
    
  } catch (error) {
    console.error(' Test deletion failed:', error);
    process.exit(1);
  }
}

async function deleteFolder(folderPath: string) {
  console.log(`  Starting complete deletion for images folder: ${folderPath}\n`);
  
  const startTime = Date.now();
  
  try {
    const result = await CloudinaryImagesFolderDeletionService.deleteImagesFolderByPath(folderPath, false);
    
    const totalTime = ((Date.now() - startTime) / 1000 / 60).toFixed(2);
    
    if (result.success) {
      console.log(`\n Deletion completed successfully for ${folderPath}!`);
      console.log(`⏱️  Total time: ${totalTime} minutes`);
    } else {
      console.log(`\n  Deletion completed with some failures for ${folderPath}`);
      console.log(`⏱️  Total time: ${totalTime} minutes`);
      
      if (result.error) {
        console.error('Error:', result.error);
      }
      
      // Show failed deletions
      const failedDeletions = result.results.filter(r => !r.success);
      if (failedDeletions.length > 0) {
        console.log(`\n ${failedDeletions.length} files failed to delete:`);
        failedDeletions.slice(0, 10).forEach(deletion => { // Show first 10 failures
          console.log(`  - ${deletion.resource?.filename}: ${deletion.error}`);
        });
        
        if (failedDeletions.length > 10) {
          console.log(`  ... and ${failedDeletions.length - 10} more files`);
        }
      }
    }
    
  } catch (error) {
    console.error(' Deletion failed:', error);
    process.exit(1);
  }
}

async function deleteSpecificFolders(folderPaths: string[]) {
  console.log(`🌍 Starting deletion of ${folderPaths.length} specified images folders\n`);
  console.log('  WARNING: This will delete ALL files in the specified images folders!');
  console.log('This action cannot be undone!\n');
  
  folderPaths.forEach((path, index) => {
    console.log(`  ${index + 1}. ${path}`);
  });
  console.log('');
  
  const startTime = Date.now();
  
  try {
    const result = await CloudinaryImagesFolderDeletionService.deleteSpecificImagesFolders(folderPaths);
    
    const totalTime = ((Date.now() - startTime) / 1000 / 60).toFixed(2);
    
    if (result.success) {
      console.log('\n Complete deletion finished successfully!');
      console.log(` Images folders: ${result.totalImagesFolders}`);
      console.log(` Files: ${result.overallSummary.totalFiles}`);
      console.log(` Successful: ${result.overallSummary.successful}`);
      console.log(` Failed: ${result.overallSummary.failed}`);
      console.log(` Total size: ${result.overallSummary.totalSizeMB.toFixed(2)} MB`);
      console.log(`⏱️  Total time: ${totalTime} minutes`);
    } else {
      console.log('\n  Complete deletion finished with some failures');
      console.log(` Images folders: ${result.totalImagesFolders}`);
      console.log(` Files: ${result.overallSummary.totalFiles}`);
      console.log(` Successful: ${result.overallSummary.successful}`);
      console.log(` Failed: ${result.overallSummary.failed}`);
      console.log(` Total size: ${result.overallSummary.totalSizeMB.toFixed(2)} MB`);
      console.log(`⏱️  Total time: ${totalTime} minutes`);
      
      if (result.error) {
        console.error('Error:', result.error);
      }
      
      // Show folders with failures
      const foldersWithFailures = result.folderResults.filter(r => r.summary.failed > 0);
      if (foldersWithFailures.length > 0) {
        console.log(`\n  Folders with failures:`);
        foldersWithFailures.forEach(folder => {
          console.log(`  - ${folder.folderPath}: ${folder.summary.failed} failures`);
        });
      }
    }
    
  } catch (error) {
    console.error(' Complete deletion failed:', error);
    process.exit(1);
  }
}

async function deleteAll() {
  console.log('🌍 Starting deletion of ALL images folders from Cloudinary\n');
  console.log('  WARNING: This will delete ALL files in ALL images folders!');
  console.log('This action cannot be undone!\n');
  
  const startTime = Date.now();
  
  try {
    const result = await CloudinaryImagesFolderDeletionService.deleteAllImagesFolders();
    
    const totalTime = ((Date.now() - startTime) / 1000 / 60).toFixed(2);
    
    if (result.success) {
      console.log('\n Complete deletion finished successfully!');
      console.log(` Images folders: ${result.totalImagesFolders}`);
      console.log(` Files: ${result.overallSummary.totalFiles}`);
      console.log(` Successful: ${result.overallSummary.successful}`);
      console.log(` Failed: ${result.overallSummary.failed}`);
      console.log(` Total size: ${result.overallSummary.totalSizeMB.toFixed(2)} MB`);
      console.log(`⏱️  Total time: ${totalTime} minutes`);
    } else {
      console.log('\n  Complete deletion finished with some failures');
      console.log(` Images folders: ${result.totalImagesFolders}`);
      console.log(` Files: ${result.overallSummary.totalFiles}`);
      console.log(` Successful: ${result.overallSummary.successful}`);
      console.log(` Failed: ${result.overallSummary.failed}`);
      console.log(` Total size: ${result.overallSummary.totalSizeMB.toFixed(2)} MB`);
      console.log(`⏱️  Total time: ${totalTime} minutes`);
      
      if (result.error) {
        console.error('Error:', result.error);
      }
      
      // Show folders with failures
      const foldersWithFailures = result.folderResults.filter(r => r.summary.failed > 0);
      if (foldersWithFailures.length > 0) {
        console.log(`\n  Folders with failures:`);
        foldersWithFailures.forEach(folder => {
          console.log(`  - ${folder.folderPath}: ${folder.summary.failed} failures`);
        });
      }
    }
    
  } catch (error) {
    console.error(' Complete deletion failed:', error);
    process.exit(1);
  }
}

function showHelp() {
  console.log('Cloudinary Images Folders Deletion Tool');
  console.log('=======================================\n');
  console.log('Usage:');
  console.log('  npm run delete-images list                       - List all images folders in Cloudinary');
  console.log('  npm run delete-images test <folder-path>         - Test deletion for a specific images folder (first 5 files)');
  console.log('  npm run delete-images delete-folder <folder-path> - Delete a specific images folder completely');
  console.log('  npm run delete-images delete-known               - Delete known images folders (bypasses rate limits)');
  console.log('  npm run delete-images delete                     - Delete ALL images folders (requires folder scanning)');
  console.log('\nExamples:');
  console.log('  npm run delete-images list');
  console.log('  npm run delete-images test "BatchCreator/characters/zara-haze/images"');
  console.log('  npm run delete-images delete-folder "BatchCreator/characters/zara-haze/images"');
  console.log('  npm run delete-images delete-known');
  console.log('  npm run delete-images delete');
  console.log('\nNote: delete-known works even with API rate limits since it uses specific folder paths.');
}

// Main execution
async function main() {
  const command = args[0];
  
  switch (command) {
    case 'list':
      await listImagesFolders();
      break;
      
    case 'test':
      if (args.length < 2) {
        console.error(' Error: Please provide a folder path');
        console.log('Usage: npm run delete-images test <folder-path>');
        process.exit(1);
      }
      await testDeletion(args[1]);
      break;
      
    case 'delete-folder':
      if (args.length < 2) {
        console.error(' Error: Please provide a folder path');
        console.log('Usage: npm run delete-images delete-folder <folder-path>');
        process.exit(1);
      }
      await deleteFolder(args[1]);
      break;
      
    case 'delete-known':
      // Delete known images folders from the attachment
      const knownImagesFolders = [
        'BatchCreator/characters/zara-haze/images',
        'BatchCreator/characters/hale-quill/images',
        'BatchCreator/characters/dara-frost/images'
        // Add more paths as needed
      ];
      await deleteSpecificFolders(knownImagesFolders);
      break;
      
    case 'delete':
      await deleteAll();
      break;
      
    case 'help':
    case '--help':
    case '-h':
      showHelp();
      break;
      
    default:
      console.error(' Error: Unknown command');
      showHelp();
      process.exit(1);
  }
}

main().catch(error => {
  console.error(' Unexpected error:', error);
  process.exit(1);
});
