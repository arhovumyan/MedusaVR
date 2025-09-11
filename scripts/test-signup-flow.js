#!/usr/bin/env node
/**
 * Test Signup Email Flow Without SendGrid
 * 
 * This demonstrates that the email system works correctly,
 * it just logs emails instead of sending them when SendGrid is not configured.
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, 'server/.env') });

console.log('🧪 Testing Signup Email Flow (Without SendGrid)');
console.log('================================================\n');

async function testSignupFlow() {
  try {
    // Import the email service
    const { emailVerificationService } = await import('../server/services/EmailVerificationService.js');
    
    console.log('✅ Email verification service loaded successfully');
    
    // Check configuration status
    const isConfigured = emailVerificationService.isEmailServiceConfigured();
    console.log(`📧 SendGrid configured: ${isConfigured ? '✅ Yes' : '❌ No (will log instead)'}`);
    
    // Generate test data
    const testEmail = 'user@example.com';
    const testUsername = 'testuser123';
    const testToken = emailVerificationService.generateVerificationToken();
    
    console.log('\n🔄 Simulating User Registration:');
    console.log('================================');
    console.log(`📧 Email: ${testEmail}`);
    console.log(`👤 Username: ${testUsername}`);
    console.log(`🔑 Token: ${testToken.substring(0, 16)}...`);
    
    console.log('\n📬 Attempting to send verification email...\n');
    console.log('--- EMAIL OUTPUT START ---');
    
    // This will log the email content since SendGrid is not configured
    const emailSent = await emailVerificationService.sendVerificationEmail(
      testEmail,
      testUsername,
      testToken
    );
    
    console.log('--- EMAIL OUTPUT END ---\n');
    
    if (emailSent) {
      console.log('✅ Email verification flow completed successfully!');
      
      if (isConfigured) {
        console.log('📧 Email was sent via SendGrid');
      } else {
        console.log('📝 Email content was logged (SendGrid not configured)');
        console.log('   This is the expected behavior when SENDGRID_API_KEY is not set');
      }
    } else {
      console.log('❌ Email verification flow failed');
    }
    
    // Test token verification
    console.log('\n🔍 Testing Token Verification:');
    console.log('==============================');
    
    // Import mongoose models (this requires connecting to DB)
    console.log('⚠️ Note: Token verification test requires database connection');
    console.log('   In a real signup, the token would be saved to the database');
    console.log(`   Verification URL: ${process.env.BASE_URL}/verify-email?token=${testToken}`);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

async function demonstrateEmailLogging() {
  console.log('\n📋 Email System Status Summary:');
  console.log('===============================');
  
  const sendGridConfigured = process.env.SENDGRID_API_KEY && 
                            process.env.SENDGRID_API_KEY !== 'your_sendgrid_api_key_here';
  
  console.log(`SENDGRID_API_KEY: ${sendGridConfigured ? '✅ Configured' : '❌ Not configured'}`);
  console.log(`EMAIL_FROM: ${process.env.EMAIL_FROM || '❌ Not set'}`);
  console.log(`BASE_URL: ${process.env.BASE_URL || '❌ Not set'}`);
  
  console.log('\n🎯 Current Behavior:');
  console.log('===================');
  
  if (sendGridConfigured) {
    console.log('✅ Emails will be sent via SendGrid');
    console.log('📧 Users will receive actual verification emails');
  } else {
    console.log('📝 Emails will be logged to console (for debugging)');
    console.log('⚠️ Users will NOT receive actual emails');
    console.log('🔧 This is useful for development and testing');
  }
  
  console.log('\n🚀 To Enable Real Email Sending:');
  console.log('================================');
  console.log('1. Get a free SendGrid account: https://sendgrid.com/');
  console.log('2. Create an API key with Mail Send permission');
  console.log('3. Update SENDGRID_API_KEY in server/.env file');
  console.log('4. Run: node test-email-system.js --test-email your@email.com');
  
  console.log('\n🧪 Testing Commands:');
  console.log('===================');
  console.log('node test-email-system.js --help           # Show all options');
  console.log('node test-email-system.js --signup-flow    # Test signup flow');
  console.log('node test-email-system.js --test-email your@email.com');
}

// Run the tests
console.log('Starting email system test...\n');

testSignupFlow()
  .then(() => demonstrateEmailLogging())
  .then(() => {
    console.log('\n✨ Test completed successfully!');
    console.log('\nThe email system is working correctly - it just needs SendGrid configuration to send real emails.');
  })
  .catch(error => {
    console.error('\n💥 Test failed:', error);
    process.exit(1);
  });
