#!/usr/bin/env node
/**
 * Email System Test and Configuration Tool
 * 
 * This script helps diagnose and test the email verification system.
 * Run this script to check email configuration and test sending emails.
 */

import dotenv from 'dotenv';
import sgMail from '@sendgrid/mail';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, 'server/.env') });

console.log('🔍 MedusaVR Email System Diagnostic Tool\n');

// Check environment variables
function checkEnvVars() {
  console.log('📋 Checking Email Configuration:');
  console.log('================================');
  
  const requiredVars = [
    'SENDGRID_API_KEY',
    'EMAIL_FROM', 
    'BASE_URL'
  ];
  
  const missing = [];
  const configured = [];
  
  requiredVars.forEach(varName => {
    const value = process.env[varName];
    if (!value || value === 'your_sendgrid_api_key_here') {
      missing.push(varName);
      console.log(`❌ ${varName}: Not configured`);
    } else {
      configured.push(varName);
      console.log(`✅ ${varName}: ${varName === 'SENDGRID_API_KEY' ? '[HIDDEN]' : value}`);
    }
  });
  
  console.log('');
  
  if (missing.length > 0) {
    console.log('🚨 MISSING CONFIGURATION:');
    console.log('=========================');
    missing.forEach(varName => {
      console.log(`❌ ${varName} is required but not configured`);
    });
    console.log('');
    
    console.log('🔧 HOW TO FIX:');
    console.log('=============');
    console.log('Add these lines to your server/.env file:');
    console.log('');
    if (missing.includes('SENDGRID_API_KEY')) {
      console.log('# Get a free SendGrid API key from https://sendgrid.com/');
      console.log('SENDGRID_API_KEY=SG.your_actual_sendgrid_api_key_here');
    }
    if (missing.includes('EMAIL_FROM')) {
      console.log('EMAIL_FROM=noreply@yourdomain.com');
    }
    if (missing.includes('BASE_URL')) {
      console.log('BASE_URL=http://localhost:5002  # or your production URL');
    }
    console.log('');
    return false;
  }
  
  return true;
}

// Test SendGrid connection
async function testSendGridConnection() {
  if (!process.env.SENDGRID_API_KEY || process.env.SENDGRID_API_KEY === 'your_sendgrid_api_key_here') {
    console.log('⚠️ Cannot test SendGrid - API key not configured');
    return false;
  }
  
  console.log('🔗 Testing SendGrid Connection:');
  console.log('===============================');
  
  try {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    
    // Test with a simple API call
    const request = {
      method: 'GET',
      url: '/v3/user/account',
    };
    
    await sgMail.request(request);
    console.log('✅ SendGrid connection successful!');
    return true;
  } catch (error) {
    console.log('❌ SendGrid connection failed:');
    console.log(`   Error: ${error.message}`);
    
    if (error.response) {
      console.log(`   HTTP Status: ${error.response.status}`);
      console.log(`   Response: ${JSON.stringify(error.response.body, null, 2)}`);
    }
    
    console.log('');
    console.log('🔧 COMMON ISSUES:');
    console.log('================');
    console.log('1. Invalid API key - check your SendGrid dashboard');
    console.log('2. API key permissions - ensure it has "Mail Send" permission');
    console.log('3. Account not verified - check your SendGrid account status');
    console.log('');
    
    return false;
  }
}

// Send test email
async function sendTestEmail(testEmail = 'test@example.com') {
  if (!process.env.SENDGRID_API_KEY || process.env.SENDGRID_API_KEY === 'your_sendgrid_api_key_here') {
    console.log('⚠️ Cannot send test email - SendGrid not configured');
    return false;
  }
  
  console.log(`📧 Sending Test Email to: ${testEmail}`);
  console.log('=========================================');
  
  const msg = {
    to: testEmail,
    from: {
      email: process.env.EMAIL_FROM || 'noreply@medusa-vrfriendly.vercel.app',
      name: 'MedusaVR Test'
    },
    subject: 'MedusaVR Email System Test',
    text: `
Hello!

This is a test email from the MedusaVR email system.

If you received this email, the email configuration is working correctly!

Configuration Details:
- From: ${process.env.EMAIL_FROM || 'noreply@medusa-vrfriendly.vercel.app'}
- Base URL: ${process.env.BASE_URL || 'http://localhost:5002'}
- Timestamp: ${new Date().toISOString()}

Best regards,
MedusaVR Email System Test
    `,
    html: `
<!DOCTYPE html>
<html>
<head>
  <title>MedusaVR Email Test</title>
  <style>
    body { font-family: Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #ff6b00, #ff8c42); color: white; padding: 20px; border-radius: 8px; text-align: center; margin-bottom: 20px; }
    .success { background: #d4edda; border: 1px solid #c3e6cb; color: #155724; padding: 15px; border-radius: 5px; margin: 20px 0; }
    .details { background: #f8f9fa; border: 1px solid #dee2e6; padding: 15px; border-radius: 5px; font-family: monospace; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 MedusaVR Email System Test</h1>
    </div>
    
    <div class="success">
      <strong>✅ Success!</strong> If you received this email, the email configuration is working correctly!
    </div>
    
    <p>This is a test email from the MedusaVR email verification system.</p>
    
    <div class="details">
      <strong>Configuration Details:</strong><br>
      From: ${process.env.EMAIL_FROM || 'noreply@medusa-vrfriendly.vercel.app'}<br>
      Base URL: ${process.env.BASE_URL || 'http://localhost:5002'}<br>
      Timestamp: ${new Date().toISOString()}
    </div>
    
    <p>Best regards,<br>MedusaVR Email System Test</p>
  </div>
</body>
</html>
    `
  };
  
  try {
    await sgMail.send(msg);
    console.log('✅ Test email sent successfully!');
    console.log(`   Check ${testEmail} for the test message`);
    return true;
  } catch (error) {
    console.log('❌ Failed to send test email:');
    console.log(`   Error: ${error.message}`);
    
    if (error.response) {
      console.log(`   HTTP Status: ${error.response.status}`);
      console.log(`   Response: ${JSON.stringify(error.response.body, null, 2)}`);
    }
    
    return false;
  }
}

// Test the complete signup email flow
async function testSignupEmailFlow() {
  console.log('🚀 Testing Complete Signup Email Flow:');
  console.log('=====================================');
  
  try {
    // Import the email verification service
    const emailServicePath = path.join(__dirname, 'server/services/EmailVerificationService.js');
    const { emailVerificationService } = await import(emailServicePath);
    
    console.log('✅ Email verification service loaded');
    
    // Check if service is configured
    const isConfigured = emailVerificationService.isEmailServiceConfigured();
    console.log(`📧 Email service configured: ${isConfigured ? '✅ Yes' : '❌ No'}`);
    
    if (!isConfigured) {
      console.log('⚠️ Email service not configured - emails will be logged instead of sent');
    }
    
    // Generate a test token
    const testToken = emailVerificationService.generateVerificationToken();
    console.log('🔑 Generated test verification token');
    
    // Test sending verification email
    const testEmail = 'test@example.com';
    const testUsername = 'testuser';
    
    console.log(`📬 Attempting to send verification email to ${testEmail}...`);
    const emailSent = await emailVerificationService.sendVerificationEmail(
      testEmail,
      testUsername, 
      testToken
    );
    
    if (emailSent) {
      console.log('✅ Verification email flow test completed successfully!');
      if (isConfigured) {
        console.log(`   📧 Email sent to ${testEmail}`);
      } else {
        console.log('   📝 Email content logged to console (SendGrid not configured)');
      }
    } else {
      console.log('❌ Verification email flow test failed');
    }
    
    return emailSent;
  } catch (error) {
    console.log('❌ Signup email flow test failed:');
    console.log(`   Error: ${error.message}`);
    return false;
  }
}

// Main function
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log('MedusaVR Email System Test Tool');
    console.log('==============================');
    console.log('');
    console.log('Usage:');
    console.log('  node test-email-system.js [options]');
    console.log('');
    console.log('Options:');
    console.log('  --test-email EMAIL    Send test email to specific address');
    console.log('  --signup-flow         Test complete signup email flow');
    console.log('  --connection-only     Test SendGrid connection only');
    console.log('  --help, -h            Show this help');
    console.log('');
    console.log('Examples:');
    console.log('  node test-email-system.js');
    console.log('  node test-email-system.js --test-email your@email.com');
    console.log('  node test-email-system.js --signup-flow');
    return;
  }
  
  // Step 1: Check configuration
  const configOk = checkEnvVars();
  
  if (!configOk) {
    console.log('🛑 Please fix the configuration issues above before proceeding.');
    process.exit(1);
  }
  
  // Step 2: Test connection
  if (args.includes('--connection-only')) {
    await testSendGridConnection();
    return;
  }
  
  const connectionOk = await testSendGridConnection();
  
  // Step 3: Send test email if requested
  if (args.includes('--test-email')) {
    const emailIndex = args.indexOf('--test-email');
    const testEmail = args[emailIndex + 1];
    
    if (!testEmail) {
      console.log('❌ Please provide an email address after --test-email');
      process.exit(1);
    }
    
    if (connectionOk) {
      await sendTestEmail(testEmail);
    } else {
      console.log('⚠️ Skipping test email - connection failed');
    }
    return;
  }
  
  // Step 4: Test signup flow if requested
  if (args.includes('--signup-flow')) {
    console.log('');
    await testSignupEmailFlow();
    return;
  }
  
  // Default: Run all tests
  console.log('');
  await testSignupEmailFlow();
  
  console.log('');
  console.log('🎯 NEXT STEPS:');
  console.log('=============');
  
  if (!connectionOk) {
    console.log('1. ❌ Fix SendGrid configuration first');
    console.log('2. 🔧 Add your SendGrid API key to server/.env');
    console.log('3. 🧪 Run: node test-email-system.js --test-email your@email.com');
  } else {
    console.log('1. ✅ Email system is working!');
    console.log('2. 🧪 Test with your email: node test-email-system.js --test-email your@email.com');
    console.log('3. 🚀 Try registering a new user account');
  }
  
  console.log('');
}

// Run the tool
main().catch(error => {
  console.error('💥 Unexpected error:', error);
  process.exit(1);
});
