#!/usr/bin/env tsx

import { CloudinaryImagesFolderDeletionService } from '../server/services/CloudinaryImagesFolderDeletionService';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Known images folders from the migration output and attachments
const KNOWN_IMAGES_FOLDERS = [
  // BatchCreator folders (from attachment)
  'BatchCreator/characters/zara-haze/images',
  'BatchCreator/characters/hale-quill/images', 
  'BatchCreator/characters/dara-frost/images',
  'BatchCreator/characters/amara-locke/images',
  'BatchCreator/characters/aria-blaze/images',
  'BatchCreator/characters/aria-crow/images',
  'BatchCreator/characters/aria-gale/images',
  'BatchCreator/characters/generated-character-21/images',
  'BatchCreator/characters/generated-character-22/images',
  'BatchCreator/characters/generated-character-23/images',
  'BatchCreator/characters/generated-character-24/images',
  'BatchCreator/characters/generated-character-25/images',
  
  // User folders (from scan output)
  '685c4c4c60826d0b60cde7fd/characters/briar-drift/images',
  '685c4c4c60826d0b60cde7fd/characters/happy/images',
  '685c4c4c60826d0b60cde7fd/characters/jade-inferno/images',
  '685c4c4c60826d0b60cde7fd/characters/juniper-siren/images',
  '685c4c4c60826d0b60cde7fd/characters/opal-fever/images',
  
  // Other known folders
  '68658bf000952fc18d365209/characters/gemma-storm/images',
  '68658bf000952fc18d365209/characters/skank/images',
  '686d2b0e8bdef2d1dd1de4ff/characters/opal-fever/images',
  '687ae242599416ccea27839d/images',
  '687ae242599416ccea27839d/characters/briar-drift/images',
  
  // Areg folders (high quantity from scan)
  'Areg/characters/dfghj/images',
  'Areg/characters/jhok/images',
  'Areg/characters/lana-melana/images',
  'Areg/characters/tester/images',
  'Areg/premade_characters/astra-blaze/images',
  'Areg/premade_characters/blair-oracle/images',
  'Areg/premade_characters/cassia-rayne/images',
  'Areg/premade_characters/celeste-emberlight/images',
  'Areg/premade_characters/opal-fever/images',
  
  // vrfans folders (from migration tests)
  'vrfans/characters/tester/images',
  'vrfans/characters/mistress-topa/images',
  'vrfans/characters/mistress-diva/images', 
  'vrfans/characters/slutty-slut/images',
  'vrfans/premade_characters/nymophcyr-vale/images',
  'vrfans/premade_characters/indigo-ember/images',
  'vrfans/premade_characters/mistress-topa/images',
  'vrfans/premade_characters/isla-umber/images'
];

async function deleteKnownImagesFolders() {
  console.log('🎯 Direct Deletion of Known Images Folders');
  console.log('==========================================\n');
  
  console.log(`🗑️  Will delete ${KNOWN_IMAGES_FOLDERS.length} known images folders:`);
  KNOWN_IMAGES_FOLDERS.forEach((folder, index) => {
    console.log(`  ${index + 1}. ${folder}`);
  });
  
  console.log(`\n⚠️  WARNING: This will delete ALL files in these specific images folders!`);
  console.log('This action cannot be undone!\n');
  
  const startTime = Date.now();
  
  try {
    const result = await CloudinaryImagesFolderDeletionService.deleteSpecificImagesFolders(KNOWN_IMAGES_FOLDERS);
    
    const totalTime = ((Date.now() - startTime) / 1000 / 60).toFixed(2);
    
    if (result.success) {
      console.log('\n🎉 Complete deletion finished successfully!');
      console.log(`📁 Images folders: ${result.totalImagesFolders}`);
      console.log(`📄 Files: ${result.overallSummary.totalFiles}`);
      console.log(`✅ Successful: ${result.overallSummary.successful}`);
      console.log(`❌ Failed: ${result.overallSummary.failed}`);
      console.log(`📁 Total size: ${result.overallSummary.totalSizeMB.toFixed(2)} MB`);
      console.log(`⏱️  Total time: ${totalTime} minutes`);
    } else {
      console.log('\n⚠️  Complete deletion finished with some failures');
      console.log(`📁 Images folders: ${result.totalImagesFolders}`);
      console.log(`📄 Files: ${result.overallSummary.totalFiles}`);
      console.log(`✅ Successful: ${result.overallSummary.successful}`);
      console.log(`❌ Failed: ${result.overallSummary.failed}`);
      console.log(`📁 Total size: ${result.overallSummary.totalSizeMB.toFixed(2)} MB`);
      console.log(`⏱️  Total time: ${totalTime} minutes`);
      
      if (result.error) {
        console.error('Error:', result.error);
      }
      
      // Show folders with failures
      const foldersWithFailures = result.folderResults.filter(r => r.summary.failed > 0);
      if (foldersWithFailures.length > 0) {
        console.log(`\n⚠️  Folders with failures:`);
        foldersWithFailures.forEach(folder => {
          console.log(`  - ${folder.folderPath}: ${folder.summary.failed} failures`);
        });
      }
    }
    
  } catch (error) {
    console.error('❌ Complete deletion failed:', error);
    process.exit(1);
  }
}

// Run the deletion
deleteKnownImagesFolders();
