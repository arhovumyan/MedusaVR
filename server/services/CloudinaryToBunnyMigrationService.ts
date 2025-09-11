import { v2 as cloudinary } from 'cloudinary';
import { BunnyStorageService } from './BunnyStorageService.js';
import { BunnyFolderService } from './BunnyFolderService.js';
import fetch from 'node-fetch';

/**
 * Migration service to transfer all data from Cloudinary to Bunny.net CDN
 */
export class CloudinaryToBunnyMigrationService {
  
  private static progressCallback?: (progress: MigrationProgress) => void;
  
  /**
   * Configure both services
   */
  private static ensureConfigured() {
    // Configure Cloudinary
    if (!cloudinary.config().cloud_name) {
      cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
      });
    }
    
    // Ensure Bunny is configured
    BunnyStorageService.ensureConfigured();
  }

  /**
   * Check if both services are properly configured
   */
  static isConfigured(): boolean {
    const cloudinaryConfigured = !!(
      process.env.CLOUDINARY_CLOUD_NAME && 
      process.env.CLOUDINARY_API_KEY && 
      process.env.CLOUDINARY_API_SECRET
    );
    
    const bunnyConfigured = BunnyStorageService.isConfigured();
    
    return cloudinaryConfigured && bunnyConfigured;
  }

  /**
   * Get all folders (users) from Cloudinary
   */
  static async getAllCloudinaryFolders(): Promise<string[]> {
    try {
      this.ensureConfigured();
      
      // Get root level folders (these should be usernames)
      const result = await cloudinary.api.root_folders();
      return result.folders.map((folder: any) => folder.name);
    } catch (error) {
      console.error('Failed to get Cloudinary folders:', error);
      return [];
    }
  }

  /**
   * Get all resources in a specific folder recursively
   */
  static async getCloudinaryResourcesInFolder(folderPath: string): Promise<CloudinaryResource[]> {
    try {
      this.ensureConfigured();
      
      const allResources: CloudinaryResource[] = [];
      let nextCursor: string | undefined = undefined;
      
      do {
        const searchOptions: any = {
          expression: `folder:${folderPath}/*`,
          max_results: 500,
          resource_type: 'image'
        };
        
        if (nextCursor) {
          searchOptions.next_cursor = nextCursor;
        }
        
        const result = await cloudinary.search.expression(searchOptions.expression)
          .max_results(searchOptions.max_results)
          .with_field('tags')
          .with_field('context')
          .execute();
        
        for (const resource of result.resources) {
          const resourceData = {
            public_id: resource.public_id,
            format: resource.format,
            folder: resource.folder || resource.public_id.substring(0, resource.public_id.lastIndexOf('/')) || '',
            bytes: resource.bytes,
            url: resource.secure_url || resource.url,
            filename: resource.public_id.split('/').pop() + '.' + resource.format
          };
          
          // Skip .png files from "embeddings" and "images" folders
          if (resource.format === 'png') {
            const pathParts = resource.public_id.split('/');
            const containsEmbeddings = pathParts.some(part => part.toLowerCase() === 'embeddings');
            const containsImages = pathParts.some(part => part.toLowerCase() === 'images');
            
            if (containsEmbeddings || containsImages) {
              console.log(`⏭️  Skipping PNG file from ${containsEmbeddings ? 'embeddings' : 'images'} folder: ${resource.public_id}`);
              continue; // Skip this file
            }
          }
          
          allResources.push(resourceData);
        }
        
        nextCursor = result.next_cursor;
      } while (nextCursor);
      
      return allResources;
    } catch (error) {
      console.error(`Failed to get resources for folder ${folderPath}:`, error);
      return [];
    }
  }

  /**
   * Download a file from Cloudinary
   */
  static async downloadCloudinaryFile(url: string): Promise<Buffer | null> {
    try {
      const response = await fetch(url, {
        timeout: 30000 // 30 second timeout
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return Buffer.from(await response.arrayBuffer());
    } catch (error) {
      console.error(`Failed to download file from ${url}:`, error);
      return null;
    }
  }

  /**
   * Migrate a single file from Cloudinary to Bunny
   */
  static async migrateFile(resource: CloudinaryResource): Promise<MigrationResult> {
    try {
      // Download file from Cloudinary
      const fileBuffer = await this.downloadCloudinaryFile(resource.url);
      if (!fileBuffer) {
        return {
          success: false,
          resource: resource,
          error: 'Failed to download file from Cloudinary'
        };
      }
      
      // Construct Bunny path (maintain same folder structure)
      const bunnyPath = resource.public_id + '.' + resource.format;
      
      // Determine content type
      const contentType = this.getContentType(resource.format);
      
      // Upload to Bunny
      const uploadResult = await BunnyStorageService.uploadFile(
        bunnyPath,
        fileBuffer,
        contentType
      );
      
      if (uploadResult.success) {
        return {
          success: true,
          resource: resource,
          bunnyUrl: uploadResult.url,
          originalSize: resource.bytes,
          bunnyPath: bunnyPath
        };
      } else {
        return {
          success: false,
          resource: resource,
          error: uploadResult.error || 'Unknown upload error'
        };
      }
      
    } catch (error) {
      return {
        success: false,
        resource: resource,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get content type based on file extension
   */
  private static getContentType(format: string): string {
    const contentTypes: { [key: string]: string } = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'webp': 'image/webp',
      'svg': 'image/svg+xml',
      'bmp': 'image/bmp',
      'tiff': 'image/tiff',
      'ico': 'image/x-icon'
    };
    
    return contentTypes[format.toLowerCase()] || 'application/octet-stream';
  }

  /**
   * Test migration with a single folder (dry run)
   */
  static async testMigrationForFolder(folderName: string): Promise<TestMigrationResult> {
    try {
      console.log(`🧪 Starting test migration for folder: ${folderName}`);
      
      if (!this.isConfigured()) {
        throw new Error('Both Cloudinary and Bunny CDN must be configured');
      }
      
      // Get all resources in the test folder
      const resources = await this.getCloudinaryResourcesInFolder(folderName);
      console.log(`Found ${resources.length} resources in ${folderName}`);
      
      if (resources.length === 0) {
        return {
          success: true,
          folderName,
          totalFiles: 0,
          results: [],
          summary: {
            successful: 0,
            failed: 0,
            totalSizeMB: 0,
            duration: 0
          }
        };
      }
      
      const startTime = Date.now();
      const results: MigrationResult[] = [];
      
      // Test with first 5 files only
      const testResources = resources.slice(0, Math.min(5, resources.length));
      console.log(`Testing migration for ${testResources.length} files...`);
      
      for (const resource of testResources) {
        console.log(`Migrating: ${resource.public_id}`);
        const result = await this.migrateFile(resource);
        results.push(result);
        
        if (result.success) {
          console.log(`✅ Success: ${resource.filename} -> ${result.bunnyPath}`);
        } else {
          console.log(`❌ Failed: ${resource.filename} - ${result.error}`);
        }
      }
      
      const duration = Date.now() - startTime;
      const successful = results.filter(r => r.success).length;
      const failed = results.filter(r => !r.success).length;
      const totalSizeMB = testResources.reduce((sum, r) => sum + (r.bytes || 0), 0) / (1024 * 1024);
      
      console.log(`\n🧪 Test Migration Complete for ${folderName}:`);
      console.log(`   ✅ Successful: ${successful}/${testResources.length}`);
      console.log(`   ❌ Failed: ${failed}/${testResources.length}`);
      console.log(`   📁 Total size: ${totalSizeMB.toFixed(2)} MB`);
      console.log(`   ⏱️  Duration: ${(duration/1000).toFixed(2)}s`);
      
      return {
        success: failed === 0,
        folderName,
        totalFiles: testResources.length,
        results,
        summary: {
          successful,
          failed,
          totalSizeMB,
          duration
        }
      };
      
    } catch (error) {
      console.error(`Test migration failed for ${folderName}:`, error);
      return {
        success: false,
        folderName,
        totalFiles: 0,
        results: [],
        error: error instanceof Error ? error.message : 'Unknown error',
        summary: {
          successful: 0,
          failed: 0,
          totalSizeMB: 0,
          duration: 0
        }
      };
    }
  }

  /**
   * Migrate a complete folder
   */
  static async migrateFolderCompletely(folderName: string): Promise<TestMigrationResult> {
    try {
      console.log(`🚀 Starting complete migration for folder: ${folderName}`);
      
      if (!this.isConfigured()) {
        throw new Error('Both Cloudinary and Bunny CDN must be configured');
      }
      
      // Get all resources in the folder
      const resources = await this.getCloudinaryResourcesInFolder(folderName);
      console.log(`Found ${resources.length} resources in ${folderName}`);
      
      if (resources.length === 0) {
        return {
          success: true,
          folderName,
          totalFiles: 0,
          results: [],
          summary: {
            successful: 0,
            failed: 0,
            totalSizeMB: 0,
            duration: 0
          }
        };
      }
      
      // Create user folder structure in Bunny first
      await BunnyFolderService.createUserFolders(folderName);
      
      const startTime = Date.now();
      const results: MigrationResult[] = [];
      let processed = 0;
      
      console.log(`Migrating all ${resources.length} files...`);
      
      // Process files with limited concurrency to avoid overwhelming the services
      const batchSize = 5;
      for (let i = 0; i < resources.length; i += batchSize) {
        const batch = resources.slice(i, i + batchSize);
        
        const batchPromises = batch.map(async (resource) => {
          const result = await this.migrateFile(resource);
          processed++;
          
          if (this.progressCallback) {
            this.progressCallback({
              folderName,
              processed,
              total: resources.length,
              currentFile: resource.filename,
              successful: results.filter(r => r.success).length,
              failed: results.filter(r => !r.success).length
            });
          }
          
          if (result.success) {
            console.log(`✅ [${processed}/${resources.length}] ${resource.filename}`);
          } else {
            console.log(`❌ [${processed}/${resources.length}] ${resource.filename} - ${result.error}`);
          }
          
          return result;
        });
        
        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);
        
        // Small delay between batches to be nice to the services
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      const duration = Date.now() - startTime;
      const successful = results.filter(r => r.success).length;
      const failed = results.filter(r => !r.success).length;
      const totalSizeMB = resources.reduce((sum, r) => sum + (r.bytes || 0), 0) / (1024 * 1024);
      
      console.log(`\n🚀 Complete Migration Finished for ${folderName}:`);
      console.log(`   ✅ Successful: ${successful}/${resources.length}`);
      console.log(`   ❌ Failed: ${failed}/${resources.length}`);
      console.log(`   📁 Total size: ${totalSizeMB.toFixed(2)} MB`);
      console.log(`   ⏱️  Duration: ${(duration/1000/60).toFixed(2)} minutes`);
      
      return {
        success: failed === 0,
        folderName,
        totalFiles: resources.length,
        results,
        summary: {
          successful,
          failed,
          totalSizeMB,
          duration
        }
      };
      
    } catch (error) {
      console.error(`Complete migration failed for ${folderName}:`, error);
      return {
        success: false,
        folderName,
        totalFiles: 0,
        results: [],
        error: error instanceof Error ? error.message : 'Unknown error',
        summary: {
          successful: 0,
          failed: 0,
          totalSizeMB: 0,
          duration: 0
        }
      };
    }
  }

  /**
   * Migrate all folders from Cloudinary to Bunny
   */
  static async migrateAllFolders(progressCallback?: (progress: MigrationProgress) => void): Promise<CompleteMigrationResult> {
    try {
      console.log('🌍 Starting complete migration from Cloudinary to Bunny.net...');
      
      this.progressCallback = progressCallback;
      
      if (!this.isConfigured()) {
        throw new Error('Both Cloudinary and Bunny CDN must be configured');
      }
      
      // Get all user folders
      const userFolders = await this.getAllCloudinaryFolders();
      console.log(`Found ${userFolders.length} user folders to migrate`);
      
      if (userFolders.length === 0) {
        return {
          success: true,
          totalFolders: 0,
          folderResults: [],
          overallSummary: {
            totalFiles: 0,
            successful: 0,
            failed: 0,
            totalSizeMB: 0,
            duration: 0
          }
        };
      }
      
      const startTime = Date.now();
      const folderResults: TestMigrationResult[] = [];
      
      // Migrate each folder
      for (const folderName of userFolders) {
        console.log(`\n📁 Processing folder: ${folderName}`);
        const result = await this.migrateFolderCompletely(folderName);
        folderResults.push(result);
      }
      
      // Calculate overall summary
      const totalFiles = folderResults.reduce((sum, r) => sum + r.totalFiles, 0);
      const successful = folderResults.reduce((sum, r) => sum + r.summary.successful, 0);
      const failed = folderResults.reduce((sum, r) => sum + r.summary.failed, 0);
      const totalSizeMB = folderResults.reduce((sum, r) => sum + r.summary.totalSizeMB, 0);
      const duration = Date.now() - startTime;
      
      console.log(`\n🌍 Complete Migration Summary:`);
      console.log(`   📁 Folders processed: ${userFolders.length}`);
      console.log(`   📄 Total files: ${totalFiles}`);
      console.log(`   ✅ Successful: ${successful}`);
      console.log(`   ❌ Failed: ${failed}`);
      console.log(`   📁 Total size: ${totalSizeMB.toFixed(2)} MB`);
      console.log(`   ⏱️  Total duration: ${(duration/1000/60).toFixed(2)} minutes`);
      
      return {
        success: failed === 0,
        totalFolders: userFolders.length,
        folderResults,
        overallSummary: {
          totalFiles,
          successful,
          failed,
          totalSizeMB,
          duration
        }
      };
      
    } catch (error) {
      console.error('Complete migration failed:', error);
      return {
        success: false,
        totalFolders: 0,
        folderResults: [],
        error: error instanceof Error ? error.message : 'Unknown error',
        overallSummary: {
          totalFiles: 0,
          successful: 0,
          failed: 0,
          totalSizeMB: 0,
          duration: 0
        }
      };
    }
  }
}

// Type definitions
interface CloudinaryResource {
  public_id: string;
  format: string;
  folder: string;
  bytes: number;
  url: string;
  filename: string;
}

interface MigrationResult {
  success: boolean;
  resource: CloudinaryResource;
  bunnyUrl?: string;
  bunnyPath?: string;
  originalSize?: number;
  error?: string;
}

interface MigrationProgress {
  folderName: string;
  processed: number;
  total: number;
  currentFile: string;
  successful: number;
  failed: number;
}

interface TestMigrationResult {
  success: boolean;
  folderName: string;
  totalFiles: number;
  results: MigrationResult[];
  error?: string;
  summary: {
    successful: number;
    failed: number;
    totalSizeMB: number;
    duration: number;
  };
}

interface CompleteMigrationResult {
  success: boolean;
  totalFolders: number;
  folderResults: TestMigrationResult[];
  error?: string;
  overallSummary: {
    totalFiles: number;
    successful: number;
    failed: number;
    totalSizeMB: number;
    duration: number;
  };
}
