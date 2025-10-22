#!/usr/bin/env node

import dotenv from 'dotenv';
import { CloudinaryToBunnyMigrationService } from '../server/services/CloudinaryToBunnyMigrationService.js';

// Load environment variables
dotenv.config();

interface MigrationProgress {
  folderName: string;
  processed: number;
  total: number;
  currentFile: string;
  successful: number;
  failed: number;
}

async function main() {
  console.log(' Cloudinary to Bunny.net Migration Tool');
  console.log('=========================================\n');

  // Check configuration
  if (!CloudinaryToBunnyMigrationService.isConfigured()) {
    console.error(' Configuration Error:');
    console.error('Please ensure the following environment variables are set:');
    console.error('- CLOUDINARY_CLOUD_NAME');
    console.error('- CLOUDINARY_API_KEY');
    console.error('- CLOUDINARY_API_SECRET');
    console.error('- BUNNY_ACCESS_KEY');
    console.error('- BUNNY_STORAGE_ZONE_NAME');
    process.exit(1);
  }

  console.log(' Configuration validated');

  // Get command line arguments
  const args = process.argv.slice(2);
  const command = args[0] || 'help';
  const folderName = args[1];

  switch (command) {
    case 'list':
      await listFolders();
      break;
    
    case 'test':
      if (!folderName) {
        console.error(' Please provide a folder name to test');
        console.error('Usage: npm run migrate test <folder-name>');
        process.exit(1);
      }
      await testMigration(folderName);
      break;
    
    case 'migrate':
      if (folderName) {
        await migrateFolder(folderName);
      } else {
        await migrateAll();
      }
      break;
    
    case 'help':
    default:
      showHelp();
      break;
  }
}

async function listFolders() {
  console.log(' Fetching all Cloudinary folders...\n');
  
  try {
    const folders = await CloudinaryToBunnyMigrationService.getAllCloudinaryFolders();
    
    if (folders.length === 0) {
      console.log('No folders found in Cloudinary');
      return;
    }
    
    console.log(`Found ${folders.length} folders:`);
    folders.forEach((folder, index) => {
      console.log(`  ${index + 1}. ${folder}`);
    });
    
    console.log(`\nUse 'npm run migrate test <folder-name>' to test migration for a specific folder`);
    
  } catch (error) {
    console.error(' Failed to list folders:', error);
    process.exit(1);
  }
}

async function testMigration(folderName: string) {
  console.log(` Testing migration for folder: ${folderName}\n`);
  
  try {
    const result = await CloudinaryToBunnyMigrationService.testMigrationForFolder(folderName);
    
    if (result.success) {
      console.log(`\n Test migration successful for ${folderName}!`);
      console.log('You can now run full migration for this folder or all folders.');
      console.log(`\nTo migrate this folder: npm run migrate migrate ${folderName}`);
      console.log('To migrate all folders: npm run migrate migrate');
    } else {
      console.log(`\n Test migration failed for ${folderName}`);
      if (result.error) {
        console.error('Error:', result.error);
      }
      
      // Show failed files
      const failedFiles = result.results.filter(r => !r.success);
      if (failedFiles.length > 0) {
        console.log('\nFailed files:');
        failedFiles.forEach(file => {
          console.log(`  - ${file.resource.filename}: ${file.error}`);
        });
      }
    }
    
  } catch (error) {
    console.error(' Test migration failed:', error);
    process.exit(1);
  }
}

async function migrateFolder(folderName: string) {
  console.log(` Starting complete migration for folder: ${folderName}\n`);
  
  const startTime = Date.now();
  
  // Progress callback
  const progressCallback = (progress: MigrationProgress) => {
    const percentage = ((progress.processed / progress.total) * 100).toFixed(1);
    const successRate = progress.processed > 0 ? ((progress.successful / progress.processed) * 100).toFixed(1) : '0.0';
    
    console.log(` Progress: ${progress.processed}/${progress.total} (${percentage}%) | Success: ${successRate}% | Current: ${progress.currentFile}`);
  };
  
  try {
    const result = await CloudinaryToBunnyMigrationService.migrateFolderCompletely(folderName);
    
    const totalTime = ((Date.now() - startTime) / 1000 / 60).toFixed(2);
    
    if (result.success) {
      console.log(`\n Migration completed successfully for ${folderName}!`);
      console.log(`⏱️  Total time: ${totalTime} minutes`);
    } else {
      console.log(`\n  Migration completed with some failures for ${folderName}`);
      console.log(`⏱️  Total time: ${totalTime} minutes`);
      
      if (result.error) {
        console.error('Error:', result.error);
      }
      
      // Show failed files
      const failedFiles = result.results.filter(r => !r.success);
      if (failedFiles.length > 0) {
        console.log(`\n ${failedFiles.length} files failed to migrate:`);
        failedFiles.slice(0, 10).forEach(file => { // Show first 10 failures
          console.log(`  - ${file.resource.filename}: ${file.error}`);
        });
        
        if (failedFiles.length > 10) {
          console.log(`  ... and ${failedFiles.length - 10} more files`);
        }
      }
    }
    
  } catch (error) {
    console.error(' Migration failed:', error);
    process.exit(1);
  }
}

async function migrateAll() {
  console.log('🌍 Starting migration of ALL folders from Cloudinary to Bunny.net\n');
  console.log('  This will migrate all your Cloudinary data. Please ensure you have sufficient Bunny.net storage space.\n');
  
  // Add a 10 second countdown
  for (let i = 10; i > 0; i--) {
    console.log(`Starting in ${i} seconds... (Press Ctrl+C to cancel)`);
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n Migration started!\n');
  
  const startTime = Date.now();
  
  // Progress callback
  const progressCallback = (progress: MigrationProgress) => {
    const percentage = ((progress.processed / progress.total) * 100).toFixed(1);
    const successRate = progress.processed > 0 ? ((progress.successful / progress.processed) * 100).toFixed(1) : '0.0';
    
    console.log(` [${progress.folderName}] ${progress.processed}/${progress.total} (${percentage}%) | Success: ${successRate}% | ${progress.currentFile}`);
  };
  
  try {
    const result = await CloudinaryToBunnyMigrationService.migrateAllFolders(progressCallback);
    
    const totalTime = ((Date.now() - startTime) / 1000 / 60).toFixed(2);
    
    if (result.success) {
      console.log('\n Complete migration finished successfully!');
      console.log(` Folders: ${result.totalFolders}`);
      console.log(` Files: ${result.overallSummary.totalFiles}`);
      console.log(` Successful: ${result.overallSummary.successful}`);
      console.log(` Failed: ${result.overallSummary.failed}`);
      console.log(` Total size: ${result.overallSummary.totalSizeMB.toFixed(2)} MB`);
      console.log(`⏱️  Total time: ${totalTime} minutes`);
    } else {
      console.log('\n  Complete migration finished with some failures');
      console.log(` Folders: ${result.totalFolders}`);
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
          console.log(`  - ${folder.folderName}: ${folder.summary.failed} failures`);
        });
      }
    }
    
  } catch (error) {
    console.error(' Complete migration failed:', error);
    process.exit(1);
  }
}

function showHelp() {
  console.log('Cloudinary to Bunny.net Migration Tool');
  console.log('=====================================\n');
  console.log('Usage:');
  console.log('  npm run migrate list                    - List all folders in Cloudinary');
  console.log('  npm run migrate test <folder-name>      - Test migration for a specific folder (first 5 files)');
  console.log('  npm run migrate migrate <folder-name>   - Migrate a specific folder completely');
  console.log('  npm run migrate migrate                 - Migrate ALL folders (use with caution!)');
  console.log('  npm run migrate help                    - Show this help message\n');
  console.log('Examples:');
  console.log('  npm run migrate list');
  console.log('  npm run migrate test john_doe');
  console.log('  npm run migrate migrate john_doe');
  console.log('  npm run migrate migrate\n');
  console.log('Environment variables required:');
  console.log('  - CLOUDINARY_CLOUD_NAME');
  console.log('  - CLOUDINARY_API_KEY'); 
  console.log('  - CLOUDINARY_API_SECRET');
  console.log('  - BUNNY_ACCESS_KEY');
  console.log('  - BUNNY_STORAGE_ZONE_NAME');
}

// Handle process termination gracefully
process.on('SIGINT', () => {
  console.log('\n\n⏹️  Migration cancelled by user');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n\n⏹️  Migration terminated');
  process.exit(0);
});

// Run the main function
main().catch((error) => {
  console.error(' Unexpected error:', error);
  process.exit(1);
});
