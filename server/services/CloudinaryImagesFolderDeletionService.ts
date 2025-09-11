import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

interface CloudinaryResource {
  public_id: string;
  format: string;
  folder: string;
  bytes: number;
  url: string;
  filename: string;
}

interface DeletionResult {
  success: boolean;
  resource?: CloudinaryResource;
  error?: string;
  deletedPublicId?: string;
}

interface FolderDeletionResult {
  success: boolean;
  folderPath: string;
  totalFiles: number;
  results: DeletionResult[];
  error?: string;
  summary: {
    successful: number;
    failed: number;
    totalSizeMB: number;
    duration: number;
  };
}

interface CompleteDeletionResult {
  success: boolean;
  totalImagesFolders: number;
  folderResults: FolderDeletionResult[];
  error?: string;
  overallSummary: {
    totalFiles: number;
    successful: number;
    failed: number;
    totalSizeMB: number;
    duration: number;
  };
}

export class CloudinaryImagesFolderDeletionService {
  
  private static ensureConfigured() {
    // Configure Cloudinary
    if (!cloudinary.config().cloud_name) {
      cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
      });
    }
    
    if (!cloudinary.config().cloud_name || !cloudinary.config().api_key || !cloudinary.config().api_secret) {
      throw new Error('Cloudinary configuration missing. Please check CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET environment variables.');
    }
  }

  private static isConfigured(): boolean {
    try {
      this.ensureConfigured();
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get all folders from Cloudinary
   */
  static async getAllCloudinaryFolders(): Promise<string[]> {
    try {
      this.ensureConfigured();
      // Get root level folders (these should be usernames)
      const folders = await cloudinary.api.root_folders();
      return folders.folders.map((f: any) => f.name);
    } catch (error) {
      console.error('Failed to get Cloudinary folders:', error);
      return [];
    }
  }

  /**
   * Find all "images" folders recursively in a given folder
   */
  static async findImagesFoldersInFolder(folderPath: string): Promise<string[]> {
    try {
      this.ensureConfigured();
      
      const imagesFolders: string[] = [];
      const foldersToCheck = [folderPath];
      
      while (foldersToCheck.length > 0) {
        const currentFolder = foldersToCheck.shift()!;
        
        try {
          // Get subfolders in current folder
          const result = await cloudinary.api.sub_folders(currentFolder);
          
          for (const subfolder of result.folders) {
            const subfolderPath = `${currentFolder}/${subfolder.name}`;
            
            // If this is an "images" folder, add it to our list
            if (subfolder.name.toLowerCase() === 'images') {
              imagesFolders.push(subfolderPath);
              console.log(`📁 Found images folder: ${subfolderPath}`);
            } else {
              // Otherwise, add it to folders to check recursively
              foldersToCheck.push(subfolderPath);
            }
          }
        } catch (subError: any) {
          // If folder doesn't exist or has no subfolders, that's okay
          if (!subError.message?.includes('not found')) {
            console.warn(`Warning checking subfolders of ${currentFolder}:`, subError.message);
          }
        }
      }
      
      return imagesFolders;
    } catch (error) {
      console.error(`Failed to find images folders in ${folderPath}:`, error);
      return [];
    }
  }

  /**
   * Get all resources in a specific folder
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
          allResources.push({
            public_id: resource.public_id,
            format: resource.format,
            folder: resource.folder || resource.public_id.substring(0, resource.public_id.lastIndexOf('/')) || '',
            bytes: resource.bytes,
            url: resource.secure_url || resource.url,
            filename: resource.public_id.split('/').pop() + '.' + resource.format
          });
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
   * Delete a single file from Cloudinary
   */
  static async deleteFile(resource: CloudinaryResource): Promise<DeletionResult> {
    try {
      console.log(`🗑️  Deleting: ${resource.public_id}`);
      
      const result = await cloudinary.uploader.destroy(resource.public_id, {
        resource_type: 'image'
      });
      
      if (result.result === 'ok') {
        console.log(`✅ Successfully deleted: ${resource.public_id}`);
        return {
          success: true,
          resource: resource,
          deletedPublicId: resource.public_id
        };
      } else {
        return {
          success: false,
          resource: resource,
          error: `Deletion failed with result: ${result.result}`
        };
      }
    } catch (error) {
      console.error(`❌ Failed to delete ${resource.public_id}:`, error);
      return {
        success: false,
        resource: resource,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Delete files directly by folder path (bypasses folder discovery)
   * Useful when API rate limits prevent folder scanning
   */
  static async deleteImagesFolderByPath(folderPath: string, testMode: boolean = false): Promise<FolderDeletionResult> {
    try {
      console.log(`🗑️  Starting ${testMode ? 'test ' : ''}deletion for images folder: ${folderPath}`);
      
      if (!this.isConfigured()) {
        throw new Error('Cloudinary must be configured');
      }
      
      // Get all resources in the folder
      const resources = await this.getCloudinaryResourcesInFolder(folderPath);
      console.log(`Found ${resources.length} files in ${folderPath}`);
      
      if (resources.length === 0) {
        console.log(`✅ No files to delete in ${folderPath}`);
        return {
          success: true,
          folderPath,
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
      
      // In test mode, only process first 5 files
      const resourcesToProcess = testMode ? resources.slice(0, 5) : resources;
      console.log(`${testMode ? 'Testing' : 'Processing'} deletion for ${resourcesToProcess.length} files...`);
      
      const startTime = Date.now();
      const results: DeletionResult[] = [];
      
      // Delete files
      for (let i = 0; i < resourcesToProcess.length; i++) {
        const resource = resourcesToProcess[i];
        console.log(`Deleting ${i + 1}/${resourcesToProcess.length}: ${resource.filename}`);
        
        const result = await this.deleteFile(resource);
        results.push(result);
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      
      const duration = Date.now() - startTime;
      const successful = results.filter(r => r.success).length;
      const failed = results.filter(r => !r.success).length;
      const totalSizeMB = resourcesToProcess.reduce((sum, r) => sum + (r.bytes / (1024 * 1024)), 0);
      
      console.log(`\n🗑️  ${testMode ? 'Test ' : ''}Deletion Complete for ${folderPath}:`);
      console.log(`   ✅ Successful: ${successful}/${resourcesToProcess.length}`);
      console.log(`   ❌ Failed: ${failed}/${resourcesToProcess.length}`);
      console.log(`   📁 Total size: ${totalSizeMB.toFixed(2)} MB`);
      console.log(`   ⏱️  Duration: ${(duration/1000).toFixed(2)}s`);
      
      return {
        success: failed === 0,
        folderPath,
        totalFiles: resourcesToProcess.length,
        results,
        summary: {
          successful,
          failed,
          totalSizeMB,
          duration
        }
      };
      
    } catch (error) {
      console.error(`${testMode ? 'Test ' : ''}deletion failed for ${folderPath}:`, error);
      return {
        success: false,
        folderPath,
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
   * Delete multiple specific images folder paths
   */
  static async deleteSpecificImagesFolders(folderPaths: string[]): Promise<CompleteDeletionResult> {
    try {
      console.log(`🌍 Starting deletion of ${folderPaths.length} specified images folders...`);
      const startTime = Date.now();
      
      if (!this.isConfigured()) {
        throw new Error('Cloudinary must be configured');
      }
      
      const folderResults: FolderDeletionResult[] = [];
      
      for (let i = 0; i < folderPaths.length; i++) {
        const folderPath = folderPaths[i];
        console.log(`\n🗑️  Processing images folder ${i + 1}/${folderPaths.length}: ${folderPath}`);
        
        const result = await this.deleteImagesFolderByPath(folderPath, false);
        folderResults.push(result);
      }
      
      // Calculate overall summary
      const totalFiles = folderResults.reduce((sum, r) => sum + r.totalFiles, 0);
      const successful = folderResults.reduce((sum, r) => sum + r.summary.successful, 0);
      const failed = folderResults.reduce((sum, r) => sum + r.summary.failed, 0);
      const totalSizeMB = folderResults.reduce((sum, r) => sum + r.summary.totalSizeMB, 0);
      const duration = Date.now() - startTime;
      
      console.log(`\n🌍 Specified Images Folders Deletion Summary:`);
      console.log(`   📁 Images folders processed: ${folderPaths.length}`);
      console.log(`   📄 Total files deleted: ${totalFiles}`);
      console.log(`   ✅ Successful: ${successful}`);
      console.log(`   ❌ Failed: ${failed}`);
      console.log(`   📁 Total size: ${totalSizeMB.toFixed(2)} MB`);
      console.log(`   ⏱️  Total duration: ${(duration/1000/60).toFixed(2)} minutes`);
      
      return {
        success: failed === 0,
        totalImagesFolders: folderPaths.length,
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
      console.error('Specified images folders deletion failed:', error);
      return {
        success: false,
        totalImagesFolders: 0,
        folderResults: [],
        error: error instanceof Error ? error.message : 'Unknown error',
        overallSummary: {
          totalFiles: 0,
          successful: 0,
          failed: 0,
          totalSizeMB: 0,
          duration: Date.now() - Date.now()
        }
      };
    }
  }

  /**
   * Delete all images folders from all user folders
   */
  static async deleteAllImagesFolders(): Promise<CompleteDeletionResult> {
    try {
      console.log('🌍 Starting deletion of all images folders from Cloudinary...');
      const startTime = Date.now();
      
      if (!this.isConfigured()) {
        throw new Error('Cloudinary must be configured');
      }
      
      // Get all user folders
      const userFolders = await this.getAllCloudinaryFolders();
      console.log(`Found ${userFolders.length} user folders to check for images folders`);
      
      // Find all images folders across all user folders
      const allImagesFolders: string[] = [];
      
      for (const userFolder of userFolders) {
        console.log(`🔍 Searching for images folders in: ${userFolder}`);
        const imagesFolders = await this.findImagesFoldersInFolder(userFolder);
        allImagesFolders.push(...imagesFolders);
      }
      
      console.log(`\n📊 Found ${allImagesFolders.length} total images folders to delete`);
      
      if (allImagesFolders.length === 0) {
        return {
          success: true,
          totalImagesFolders: 0,
          folderResults: [],
          overallSummary: {
            totalFiles: 0,
            successful: 0,
            failed: 0,
            totalSizeMB: 0,
            duration: Date.now() - startTime
          }
        };
      }
      
      // Delete all images folders
      const folderResults: FolderDeletionResult[] = [];
      
      for (let i = 0; i < allImagesFolders.length; i++) {
        const imagesFolder = allImagesFolders[i];
        console.log(`\n🗑️  Processing images folder ${i + 1}/${allImagesFolders.length}: ${imagesFolder}`);
        
        const result = await this.deleteImagesFolderByPath(imagesFolder, false);
        folderResults.push(result);
      }
      
      // Calculate overall summary
      const totalFiles = folderResults.reduce((sum, r) => sum + r.totalFiles, 0);
      const successful = folderResults.reduce((sum, r) => sum + r.summary.successful, 0);
      const failed = folderResults.reduce((sum, r) => sum + r.summary.failed, 0);
      const totalSizeMB = folderResults.reduce((sum, r) => sum + r.summary.totalSizeMB, 0);
      const duration = Date.now() - startTime;
      
      console.log(`\n🌍 Complete Images Folder Deletion Summary:`);
      console.log(`   📁 Images folders processed: ${allImagesFolders.length}`);
      console.log(`   📄 Total files deleted: ${totalFiles}`);
      console.log(`   ✅ Successful: ${successful}`);
      console.log(`   ❌ Failed: ${failed}`);
      console.log(`   📁 Total size: ${totalSizeMB.toFixed(2)} MB`);
      console.log(`   ⏱️  Total duration: ${(duration/1000/60).toFixed(2)} minutes`);
      
      return {
        success: failed === 0,
        totalImagesFolders: allImagesFolders.length,
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
      console.error('Complete images folder deletion failed:', error);
      return {
        success: false,
        totalImagesFolders: 0,
        folderResults: [],
        error: error instanceof Error ? error.message : 'Unknown error',
        overallSummary: {
          totalFiles: 0,
          successful: 0,
          failed: 0,
          totalSizeMB: 0,
          duration: Date.now() - Date.now()
        }
      };
    }
  }
}
