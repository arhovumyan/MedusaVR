#!/usr/bin/env tsx

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

async function sampleFolderStructure() {
  console.log(' Sampling folder structures in Cloudinary...\n');
  
  try {
    const result = await cloudinary.search
      .max_results(50)
      .with_field('tags')
      .with_field('context')
      .execute();
    
    console.log(` Found ${result.resources.length} resources. Analyzing folder paths:\n`);
    
    const folderCounts: { [key: string]: number } = {};
    const samplePaths: string[] = [];
    
    for (const resource of result.resources) {
      const folderPath = resource.folder || 'ROOT';
      folderCounts[folderPath] = (folderCounts[folderPath] || 0) + 1;
      
      if (samplePaths.length < 20) {
        samplePaths.push(`${resource.public_id} -> folder: "${folderPath}"`);
      }
    }
    
    console.log(' Sample file paths:');
    console.log('===================');
    for (const path of samplePaths) {
      console.log(path);
    }
    
    console.log('\n Top folders by file count:');
    console.log('=============================');
    const sortedFolders = Object.entries(folderCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10);
    
    for (const [folder, count] of sortedFolders) {
      console.log(`${folder}: ${count} files`);
      
      // Check if this folder path contains "images"
      if (folder.includes('images') || folder.includes('Images')) {
        console.log(`   CONTAINS "images"!`);
      }
    }
    
    console.log('\n Looking specifically for paths containing "images":');
    console.log('======================================================');
    let foundImagesFolder = false;
    
    for (const resource of result.resources) {
      const folderPath = resource.folder || '';
      const publicId = resource.public_id || '';
      
      if (folderPath.includes('images') || folderPath.includes('Images') || publicId.includes('images') || publicId.includes('Images')) {
        console.log(` ${publicId} -> folder: "${folderPath}"`);
        foundImagesFolder = true;
      }
    }
    
    if (!foundImagesFolder) {
      console.log(' No files found with "images" in folder path or public_id in this sample');
      console.log('   This might mean:');
      console.log('   - Images folders were already deleted');
      console.log('   - Files are in different folder structures');
      console.log('   - Need to check more samples');
    }
    
  } catch (error) {
    console.error(' Error sampling folder structure:', error);
  }
}

sampleFolderStructure();
