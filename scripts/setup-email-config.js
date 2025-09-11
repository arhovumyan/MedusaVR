#!/usr/bin/env node
/**
 * Email Configuration Setup Script
 * 
 * This script helps you quickly configure the email system for MedusaVR.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.join(__dirname, 'server/.env');

console.log('📧 MedusaVR Email Configuration Setup');
console.log('====================================\n');

// Check if .env exists
if (!fs.existsSync(envPath)) {
  console.log('❌ server/.env file not found!');
  console.log('Please create the .env file first.');
  process.exit(1);
}

// Read current .env content
let envContent = fs.readFileSync(envPath, 'utf8');

console.log('📝 Current email configuration in server/.env:');
console.log('===============================================');

// Check for existing email config
const hasEmailConfig = envContent.includes('SENDGRID_API_KEY') || 
                      envContent.includes('EMAIL_FROM') || 
                      envContent.includes('BASE_URL');

if (hasEmailConfig) {
  const lines = envContent.split('\n');
  lines.forEach(line => {
    if (line.includes('SENDGRID_API_KEY')) {
      const value = line.split('=')[1] || '';
      console.log(`SENDGRID_API_KEY: ${value.trim() ? '[CONFIGURED]' : '[NOT SET]'}`);
    }
    if (line.includes('EMAIL_FROM')) {
      console.log(`EMAIL_FROM: ${line.split('=')[1] || '[NOT SET]'}`);
    }
    if (line.includes('BASE_URL')) {
      console.log(`BASE_URL: ${line.split('=')[1] || '[NOT SET]'}`);
    }
  });
} else {
  console.log('❌ No email configuration found');
}

console.log('\n🔧 REQUIRED EMAIL CONFIGURATION:');
console.log('================================');

const emailConfigBlock = `
# Email Configuration (Add these lines to your server/.env file)
SENDGRID_API_KEY=your_sendgrid_api_key_here
EMAIL_FROM=noreply@medusavr.com
BASE_URL=http://localhost:5002`;

console.log(emailConfigBlock);

console.log('\n📋 SETUP INSTRUCTIONS:');
console.log('======================');
console.log('1. 🌐 Go to https://sendgrid.com/ and create a free account');
console.log('2. 🔑 Generate an API key with "Mail Send" permissions');
console.log('3. ✏️  Add the email configuration to your server/.env file');
console.log('4. 🧪 Test the configuration: node test-email-system.js');

console.log('\n💡 SENDGRID SETUP GUIDE:');
console.log('========================');
console.log('• Sign up at https://sendgrid.com/');
console.log('• Verify your account (check your email)');
console.log('• Go to Settings > API Keys');
console.log('• Create API Key > Restricted Access');
console.log('• Give it "Mail Send" permission only');
console.log('• Copy the API key and add it to your .env file');

console.log('\n🚀 TESTING COMMANDS:');
console.log('===================');
console.log('# Test configuration only:');
console.log('node test-email-system.js --connection-only');
console.log('');
console.log('# Test with your email:');
console.log('node test-email-system.js --test-email your@email.com');
console.log('');
console.log('# Test signup email flow:');
console.log('node test-email-system.js --signup-flow');

console.log('\n⚠️  IMPORTANT NOTES:');
console.log('===================');
console.log('• The free SendGrid plan allows 100 emails/day');
console.log('• Emails may go to spam folder initially');
console.log('• You may need to verify your sender email address');
console.log('• For production, use a custom domain email address');

// Auto-add configuration if not present
if (!hasEmailConfig) {
  console.log('\n🔄 AUTO-ADDING EMAIL CONFIGURATION TEMPLATE...');
  
  try {
    // Add email config to the end of the file
    const newContent = envContent.trim() + '\n' + emailConfigBlock + '\n';
    
    // Create backup
    fs.writeFileSync(envPath + '.backup', envContent);
    console.log('✅ Created backup: server/.env.backup');
    
    // Write new content
    fs.writeFileSync(envPath, newContent);
    console.log('✅ Added email configuration template to server/.env');
    console.log('⚠️  Please edit the SENDGRID_API_KEY value with your actual API key');
    
  } catch (error) {
    console.log('❌ Failed to auto-add configuration:', error.message);
    console.log('Please manually add the email configuration to server/.env');
  }
}

console.log('\n✨ Setup complete! Run the test script to verify your configuration.');
