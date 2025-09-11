#!/usr/bin/env tsx

import { CloudinaryImagesFolderDeletionService } from '../server/services/CloudinaryImagesFolderDeletionService';
import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function deleteAllImagesFoldersDirect() {
  console.log('🎯 Direct Images Folder Mass Deletion');
  console.log('====================================\n');
  
  console.log('⚠️  This will search for and delete ALL resources in ANY folder named "images"');
  console.log('⚠️  Using direct resource search - no folder scanning needed!');
  console.log('This action cannot be undone!\n');
  
  const startTime = Date.now();
  let totalDeleted = 0;
  let totalFailed = 0;
  let totalSizeMB = 0;
  
  try {
    console.log('🔍 Searching for all resources and filtering for "images" folders...\n');
    
    // Get all resources and filter for ones in "images" folders
    // This avoids complex search expressions that might fail
    
    let nextCursor: string | undefined = undefined;
    let batchCount = 0;
    
    do {
      batchCount++;
      console.log(`📦 Processing batch ${batchCount}...`);
      
      const searchOptions: any = {
        max_results: 100,
        resource_type: 'image'
      };
      
      if (nextCursor) {
        searchOptions.next_cursor = nextCursor;
      }
      
      const result = await cloudinary.search
        .max_results(searchOptions.max_results)
        .with_field('tags')
        .with_field('context')
        .execute();
      
      // Filter for resources with "images" in their public_id path
      const imagesResources = result.resources.filter((resource: any) => {
        const publicId = resource.public_id || '';
        const pathParts = publicId.split('/');
        return pathParts.some((part: string) => part === 'images');
      });
      
      console.log(`Found ${result.resources.length} total files in batch ${batchCount}`);
      console.log(`Found ${imagesResources.length} files in "images" folders`);
      
      // Delete all files in images folders from this batch
      for (let i = 0; i < imagesResources.length; i++) {
        const resource = imagesResources[i];
        console.log(`Deleting ${i + 1}/${imagesResources.length}: ${resource.public_id}`);
        
        try {
          const deleteResult = await cloudinary.uploader.destroy(resource.public_id, {
            resource_type: 'image'
          });
          
          if (deleteResult.result === 'ok') {
            totalDeleted++;
            totalSizeMB += (resource.bytes || 0) / (1024 * 1024);
            console.log(`✅ Deleted: ${resource.public_id}`);
          } else {
            totalFailed++;
            console.log(`❌ Failed to delete: ${resource.public_id} (${deleteResult.result})`);
          }
        } catch (deleteError) {
          totalFailed++;
          console.log(`❌ Error deleting ${resource.public_id}:`, deleteError);
        }
        
        // Small delay to avoid overwhelming the API
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      nextCursor = result.next_cursor;
      
      if (nextCursor) {
        console.log(`📄 Batch ${batchCount} complete. Continuing to next batch...\n`);
        // Longer delay between batches
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
    } while (nextCursor);
    
    const duration = Date.now() - startTime;
    
    console.log(`\n🎉 Mass Deletion Complete!`);
    console.log(`📊 Results:`);
    console.log(`   📄 Total files processed: ${totalDeleted + totalFailed}`);
    console.log(`   ✅ Successfully deleted: ${totalDeleted}`);
    console.log(`   ❌ Failed: ${totalFailed}`);
    console.log(`   📁 Total size deleted: ${totalSizeMB.toFixed(2)} MB`);
    console.log(`   📦 Batches processed: ${batchCount}`);
    console.log(`   ⏱️  Total duration: ${(duration/1000/60).toFixed(2)} minutes`);
    
    if (totalFailed > 0) {
      console.log(`\n⚠️  ${totalFailed} files failed to delete. This may be due to:`);
      console.log('   - Files already deleted');
      console.log('   - Permission issues');
      console.log('   - Network timeouts');
    }
    
  } catch (error: any) {
    console.error('❌ Mass deletion failed:', error);
    
    if (error.message?.includes('Rate Limit')) {
      console.log('\n💡 Hit rate limit. Try again after the limit resets.');
      console.log('Current progress saved - deleted files won\'t be processed again.');
    }
    
    process.exit(1);
  }
}

// Run the mass deletion
deleteAllImagesFoldersDirect();
