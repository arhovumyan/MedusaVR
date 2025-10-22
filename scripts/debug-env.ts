import dotenv from 'dotenv';
import { BunnyStorageService } from '../server/services/BunnyStorageService.js';

// Load environment variables
dotenv.config();

console.log(' Debug Environment Variables');
console.log('================================');

console.log('Raw environment variables:');
console.log('BUNNY_ACCESS_KEY:', process.env.BUNNY_ACCESS_KEY);
console.log('BUNNY_STORAGE_ZONE_NAME:', process.env.BUNNY_STORAGE_ZONE_NAME);

console.log('\nBunny Storage Service:');
console.log('BunnyStorageService.isConfigured():', BunnyStorageService.isConfigured());

// Try to access private static properties via a test
try {
  // Create a test instance to see what's happening
  const accessKey = process.env.BUNNY_ACCESS_KEY;
  const storageZoneName = process.env.BUNNY_STORAGE_ZONE_NAME;
  
  console.log('\nDirect checks:');
  console.log('accessKey truthy:', !!accessKey);
  console.log('storageZoneName truthy:', !!storageZoneName);
  console.log('both truthy:', !!(accessKey && storageZoneName));
  
} catch (error) {
  console.error('Error:', error);
}
