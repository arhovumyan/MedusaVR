#!/usr/bin/env tsx

import { CloudinaryToBunnyMigrationService } from '../server/services/CloudinaryToBunnyMigrationService';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function testSkipFunctionality() {
  console.log('🧪 Testing folder skip functionality...\n');
  
  try {
    // Test with just a few folders to see the skip behavior
    const folders = await CloudinaryToBunnyMigrationService.getAllCloudinaryFolders();
    console.log(`Found ${folders.length} total folders\n`);
    
    // Test first 5 folders
    const testFolders = folders.slice(0, 5);
    console.log('Testing skip functionality on first 5 folders:');
    testFolders.forEach((folder, index) => {
      console.log(`  ${index + 1}. ${folder}`);
    });
    console.log('');
    
    let skippedCount = 0;
    let migratedCount = 0;
    
    for (const folder of testFolders) {
      console.log(`🔍 Testing folder: ${folder}`);
      const result = await CloudinaryToBunnyMigrationService.migrateFolderCompletely(folder);
      
      if (result.skipped) {
        console.log(`  ⏭️  SKIPPED - already exists`);
        skippedCount++;
      } else {
        console.log(`  ✅ MIGRATED - ${result.summary.successful} files, ${result.summary.failed} failed`);
        migratedCount++;
      }
      console.log('');
    }
    
    console.log('📊 Test Results:');
    console.log(`   ⏭️  Skipped: ${skippedCount}`);
    console.log(`   🚀 Migrated: ${migratedCount}`);
    console.log(`   📁 Total tested: ${testFolders.length}`);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testSkipFunctionality();
