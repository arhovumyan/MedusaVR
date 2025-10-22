#!/usr/bin/env node

/**
 * Test Character Creation Setup
 * 
 * This script validates that all components are properly configured
 * for the character generation system.
 */

import 'dotenv/config';
import mongoose from 'mongoose';
import { v2 as cloudinary } from 'cloudinary';
import fetch from 'node-fetch';

class SetupValidator {
  private errors: string[] = [];
  private warnings: string[] = [];

  constructor() {
    // Properties initialized above
  }

  log(message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info'): void {
    const prefix = {
      'info': '',
      'success': '',
      'warning': '',
      'error': ''
    }[type] || '';
    
    console.log(`${prefix} ${message}`);
    
    if (type === 'error') this.errors.push(message);
    if (type === 'warning') this.warnings.push(message);
  }

  async validateEnvironmentVariables() {
    this.log('Checking environment variables...', 'info');
    
    const required = [
      'MONGODB_URI',
      'CLOUDINARY_CLOUD_NAME',
      'CLOUDINARY_API_KEY',
      'CLOUDINARY_API_SECRET'
    ];

    const optional = [
      'RUNPOD_WEBUI_URL',
      'RUNPOD_ANIME_CARTOON_FANTASY_URL',
      'RUNPOD_REALISTIC_URL'
    ];

    for (const key of required) {
      if (process.env[key]) {
        this.log(`${key}: ✓ Set`, 'success');
      } else {
        this.log(`${key}: ✗ Missing (required)`, 'error');
      }
    }

    for (const key of optional) {
      if (process.env[key]) {
        this.log(`${key}: ✓ Set`, 'success');
      } else {
        this.log(`${key}: - Not set (optional)`, 'warning');
      }
    }
  }

  async validateMongoConnection(): Promise<void> {
    this.log('Testing MongoDB connection...', 'info');
    
    try {
      if (!process.env.MONGODB_URI) {
        this.log('MongoDB connection: ✗ MONGODB_URI not set', 'error');
        return;
      }
      
      await mongoose.connect(process.env.MONGODB_URI, {
        dbName: "test",
        serverSelectionTimeoutMS: 5000
      });
      this.log('MongoDB connection: ✓ Success', 'success');
      await mongoose.disconnect();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.log(`MongoDB connection: ✗ Failed - ${errorMessage}`, 'error');
    }
  }

  async validateCloudinary(): Promise<void> {
    this.log('Testing Cloudinary configuration...', 'info');
    
    try {
      cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
      });

      // Test with a simple API call
      const result = await cloudinary.api.ping();
      this.log('Cloudinary connection: ✓ Success', 'success');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.log(`Cloudinary connection: ✗ Failed - ${errorMessage}`, 'error');
    }
  }

  async validateRunPod(): Promise<void> {
    this.log('Testing RunPod connection...', 'info');
    
    const runpodUrl = process.env.RUNPOD_WEBUI_URL || process.env.RUNPOD_ANIME_CARTOON_FANTASY_URL;
    
    if (!runpodUrl) {
      this.log('RunPod URL: ✗ Not configured', 'error');
      return;
    }

    try {
      // Test basic connectivity
      const response = await fetch(`${runpodUrl}/`, {
        method: 'GET'
      });
      
      if (response.ok) {
        this.log('RunPod connection: ✓ Success', 'success');
      } else {
        this.log(`RunPod connection:  Reachable but returned ${response.status}`, 'warning');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.log(`RunPod connection: ✗ Failed - ${errorMessage}`, 'error');
    }
  }

  async validatePromptFiles() {
    this.log('Checking prompt files...', 'info');
    
    const fs = await import('fs');
    const path = await import('path');
    
    const files = [
      { path: 'root/positive_prompt.txt', description: 'Positive prompt file' },
      { path: 'root/negative_prompt.txt', description: 'Negative prompt file' }
    ];

    for (const file of files) {
      const fullPath = path.join(process.cwd(), '..', file.path);
      if (fs.existsSync(fullPath)) {
        const content = fs.readFileSync(fullPath, 'utf-8').trim();
        if (content.length > 0) {
          this.log(`${file.description}: ✓ Found (${content.length} chars)`, 'success');
        } else {
          this.log(`${file.description}:  Empty file`, 'warning');
        }
      } else {
        this.log(`${file.description}: ✗ Not found at ${fullPath}`, 'error');
      }
    }
  }

  async validateDirectories() {
    this.log('Checking required directories...', 'info');
    
    const fs = await import('fs');
    const path = await import('path');
    
    const dirs = [
      'scripts',
      'services',
      'db/models'
    ];

    for (const dir of dirs) {
      const fullPath = path.join(process.cwd(), dir);
      if (fs.existsSync(fullPath)) {
        this.log(`Directory ${dir}: ✓ Exists`, 'success');
      } else {
        this.log(`Directory ${dir}: ✗ Missing`, 'error');
      }
    }
  }

  async validateDependencies() {
    this.log('Checking key dependencies...', 'info');
    
    const dependencies = [
      'mongoose',
      'cloudinary',
      'node-fetch',
      'nanoid',
      'crypto'
    ];

    for (const dep of dependencies) {
      try {
        await import(dep);
        this.log(`Dependency ${dep}: ✓ Available`, 'success');
      } catch (error) {
        this.log(`Dependency ${dep}: ✗ Missing`, 'error');
      }
    }
  }

  displaySummary() {
    console.log('\n' + '='.repeat(50));
    this.log('Setup Validation Summary', 'info');
    console.log('='.repeat(50));
    
    if (this.errors.length === 0 && this.warnings.length === 0) {
      this.log(' All checks passed! System is ready for character generation.', 'success');
    } else {
      if (this.errors.length > 0) {
        this.log(`Found ${this.errors.length} error(s) that must be fixed:`, 'error');
        this.errors.forEach((error: string, i: number) => {
          console.log(`   ${i + 1}. ${error}`);
        });
      }
      
      if (this.warnings.length > 0) {
        this.log(`Found ${this.warnings.length} warning(s):`, 'warning');
        this.warnings.forEach((warning: string, i: number) => {
          console.log(`   ${i + 1}. ${warning}`);
        });
      }
      
      if (this.errors.length === 0) {
        this.log(' System can run with warnings, but consider fixing them.', 'success');
      } else {
        this.log(' System cannot run until errors are fixed.', 'error');
      }
    }
    
    console.log('\n📚 Next steps:');
    console.log('1. Fix any errors shown above');
    console.log('2. Run: npm run fast-generate -- --batch-templates --count 1');
    console.log('3. Check the generated character in your database');
    console.log('4. View the Cloudinary folder structure');
    console.log('\n📖 For more info, see: CHARACTER_GENERATION_GUIDE.md');
  }

  async run() {
    console.log(' MedusaVR Character Generation Setup Validator\n');
    
    await this.validateEnvironmentVariables();
    console.log();
    
    await this.validateMongoConnection();
    console.log();
    
    await this.validateCloudinary();
    console.log();
    
    await this.validateRunPod();
    console.log();
    
    await this.validatePromptFiles();
    console.log();
    
    await this.validateDirectories();
    console.log();
    
    await this.validateDependencies();
    
    this.displaySummary();
  }
}

// Run the validator
const validator = new SetupValidator();
validator.run().catch(console.error);
