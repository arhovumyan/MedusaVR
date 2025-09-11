import fetch from 'node-fetch';
import { Buffer } from 'buffer';
/**
 * Bunny CDN Storage Service
 * Manages file uploads, downloads, and folder operations for Bunny CDN
 */
export class BunnyStorageService {
    static get accessKey() {
        return process.env.BUNNY_ACCESS_KEY;
    }
    static get storageApiHost() {
        return process.env.BUNNY_STORAGE_API_HOST || 'https://storage.bunnycdn.com';
    }
    static get storageZoneName() {
        return process.env.BUNNY_STORAGE_ZONE_NAME || 'medusavr';
    }
    static get publicDomain() {
        return `${this.storageZoneName}.b-cdn.net`;
    }
    /**
     * Check if Bunny CDN is properly configured
     */
    static isConfigured() {
        return !!(this.accessKey && this.storageZoneName);
    }
    /**
     * Ensure Bunny CDN is configured, throw error if not
     */
    static ensureConfigured() {
        if (!this.isConfigured()) {
            throw new Error('Bunny CDN is not configured. Please set BUNNY_ACCESS_KEY and BUNNY_STORAGE_ZONE_NAME environment variables.');
        }
    }
    /**
     * Generate the public URL for a file
     * @param filePath - The file path (e.g., "username/avatar/avatar_123.jpg")
     */
    static getPublicUrl(filePath) {
        return `https://${this.publicDomain}/${filePath}`;
    }
    /**
     * Upload a file to Bunny CDN with timeout and better error handling
     * @param filePath - The target path (e.g., "username/avatar/avatar_123.jpg")
     * @param fileBuffer - The file content as Buffer
     * @param contentType - The MIME type of the file
     */
    static async uploadFile(filePath, fileBuffer, contentType) {
        try {
            this.ensureConfigured();
            // Create an AbortController for timeout handling
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
            console.log(`📤 Uploading file to Bunny CDN: ${filePath} (${(fileBuffer.length / 1024).toFixed(1)}KB)`);
            const response = await fetch(`${this.storageApiHost}/${this.storageZoneName}/${filePath}`, {
                method: 'PUT',
                headers: {
                    'AccessKey': this.accessKey,
                    'Content-Type': contentType || 'application/octet-stream',
                },
                body: fileBuffer,
                signal: controller.signal,
            });
            clearTimeout(timeoutId);
            if (!response.ok) {
                const errorText = await response.text();
                console.error('Bunny CDN upload error:', response.status, errorText);
                // Provide more specific error messages
                let errorMessage = `Upload failed: ${response.status} ${response.statusText}`;
                if (response.status === 429) {
                    errorMessage = 'Upload failed: Rate limit exceeded. Please try again later.';
                }
                else if (response.status === 401 || response.status === 403) {
                    errorMessage = 'Upload failed: Invalid access key or insufficient permissions.';
                }
                else if (response.status >= 500) {
                    errorMessage = 'Upload failed: Server error. Please try again.';
                }
                return {
                    success: false,
                    error: errorMessage
                };
            }
            const publicUrl = this.getPublicUrl(filePath);
            console.log(`✅ Successfully uploaded to Bunny CDN: ${publicUrl}`);
            return {
                success: true,
                url: publicUrl
            };
        }
        catch (error) {
            console.error('Bunny CDN upload error:', error);
            let errorMessage = 'Unknown upload error';
            if (error instanceof Error) {
                if (error.name === 'AbortError') {
                    errorMessage = 'Upload timeout: File upload took too long';
                }
                else if (error.message.includes('ECONNRESET') || error.message.includes('ENOTFOUND')) {
                    errorMessage = 'Network error: Please check your connection and try again';
                }
                else {
                    errorMessage = error.message;
                }
            }
            return {
                success: false,
                error: errorMessage
            };
        }
    }
    /**
     * Upload a base64 data URL to Bunny CDN
     * @param filePath - The target path
     * @param dataUrl - Base64 data URL (data:image/png;base64,...)
     */
    static async uploadBase64(filePath, dataUrl) {
        try {
            // Extract content type and base64 data
            const matches = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
            if (!matches) {
                return {
                    success: false,
                    error: 'Invalid base64 data URL format'
                };
            }
            const contentType = matches[1];
            const base64Data = matches[2];
            const fileBuffer = Buffer.from(base64Data, 'base64');
            return await this.uploadFile(filePath, fileBuffer, contentType);
        }
        catch (error) {
            console.error('Base64 upload error:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Base64 upload error'
            };
        }
    }
    /**
     * Delete a file from Bunny CDN
     * @param filePath - The file path to delete
     */
    static async deleteFile(filePath) {
        try {
            this.ensureConfigured();
            const response = await fetch(`${this.storageApiHost}/${this.storageZoneName}/${filePath}`, {
                method: 'DELETE',
                headers: {
                    'AccessKey': this.accessKey,
                },
            });
            if (!response.ok && response.status !== 404) {
                return {
                    success: false,
                    error: `Delete failed: ${response.status} ${response.statusText}`
                };
            }
            console.log(`✅ Successfully deleted from Bunny CDN: ${filePath}`);
            return { success: true };
        }
        catch (error) {
            console.error('Bunny CDN delete error:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Delete error'
            };
        }
    }
    /**
     * Download/read a file from Bunny CDN
     * @param filePath - The file path to download
     */
    static async downloadFile(filePath) {
        try {
            this.ensureConfigured();
            const response = await fetch(`${this.storageApiHost}/${this.storageZoneName}/${filePath}`, {
                method: 'GET',
                headers: {
                    'AccessKey': this.accessKey,
                },
            });
            if (!response.ok) {
                if (response.status === 404) {
                    return {
                        success: false,
                        error: 'File not found'
                    };
                }
                return {
                    success: false,
                    error: `Download failed: ${response.status} ${response.statusText}`
                };
            }
            const arrayBuffer = await response.arrayBuffer();
            const data = Buffer.from(arrayBuffer);
            return {
                success: true,
                data
            };
        }
        catch (error) {
            console.error('Bunny CDN download error:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Download error'
            };
        }
    }
    /**
     * List files in a directory
     * @param directoryPath - The directory path to list
     */
    static async listFiles(directoryPath) {
        try {
            this.ensureConfigured();
            const response = await fetch(`${this.storageApiHost}/${this.storageZoneName}/${directoryPath}/`, {
                method: 'GET',
                headers: {
                    'AccessKey': this.accessKey,
                },
            });
            if (!response.ok) {
                if (response.status === 404) {
                    return { success: true, files: [] }; // Directory doesn't exist, return empty array
                }
                return {
                    success: false,
                    error: `List failed: ${response.status} ${response.statusText}`
                };
            }
            const data = await response.json();
            const files = Array.isArray(data) ? data.map((item) => item.ObjectName).filter((name) => name && !name.endsWith('/')) : [];
            return {
                success: true,
                files
            };
        }
        catch (error) {
            console.error('Bunny CDN list error:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'List error'
            };
        }
    }
    /**
     * Create a directory by uploading a placeholder file
     * @param directoryPath - The directory path to create
     */
    static async createDirectory(directoryPath) {
        try {
            const placeholderPath = `${directoryPath}/.placeholder`;
            const placeholderBuffer = Buffer.from('MedusaVR Directory Placeholder', 'utf-8');
            const result = await this.uploadFile(placeholderPath, placeholderBuffer, 'text/plain');
            if (!result.success) {
                return {
                    success: false,
                    error: result.error
                };
            }
            console.log(`✅ Created directory: ${directoryPath}`);
            return { success: true };
        }
        catch (error) {
            console.error('Directory creation error:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Directory creation error'
            };
        }
    }
    /**
     * Generate a unique filename with timestamp
     * @param baseName - Base filename without extension
     * @param extension - File extension (with dot, e.g., '.jpg')
     */
    static generateUniqueFilename(baseName, extension) {
        const timestamp = Date.now();
        const randomSuffix = Math.random().toString(36).substring(2, 8);
        return `${baseName}_${timestamp}_${randomSuffix}${extension}`;
    }
    /**
     * Get MIME type from file extension
     * @param filename - The filename or extension
     */
    static getMimeType(filename) {
        const ext = filename.toLowerCase().split('.').pop();
        const mimeTypes = {
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
            'png': 'image/png',
            'gif': 'image/gif',
            'webp': 'image/webp',
            'svg': 'image/svg+xml',
            'mp4': 'video/mp4',
            'webm': 'video/webm',
            'mov': 'video/quicktime',
            'txt': 'text/plain',
            'json': 'application/json',
            'pdf': 'application/pdf'
        };
        return mimeTypes[ext || ''] || 'application/octet-stream';
    }
}
