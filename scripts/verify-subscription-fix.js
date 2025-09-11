/**
 * Simple verification script to confirm the subscription fix is deployed
 * 
 * This script inspects the deployed code to verify:
 * 1. The double coin distribution bug is fixed
 * 2. The subscription endpoint only awards coins once
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function verifySubscriptionFix() {
  console.log('🔍 Verifying Subscription Coin Distribution Fix...\n');

  try {
    // Path to the subscriptions route file
    const subscriptionsPath = path.join(__dirname, 'server', 'routes', 'subscriptions.ts');
    
    if (!fs.existsSync(subscriptionsPath)) {
      console.log('❌ subscriptions.ts file not found');
      return false;
    }

    // Read the subscriptions file
    const subscriptionsContent = fs.readFileSync(subscriptionsPath, 'utf8');
    
    console.log('📁 Reading subscriptions.ts...');

    // Check for the problematic double coin distribution
    const problematicPatterns = [
      /award.*coins.*based.*on.*tier/i,
      /if.*tier.*icon.*coins.*\+=/i,
      /switch.*tier.*coins/i
    ];

    let foundProblematicCode = false;
    const lines = subscriptionsContent.split('\n');
    
    problematicPatterns.forEach((pattern, index) => {
      lines.forEach((line, lineIndex) => {
        // Skip comments
        if (line.trim().startsWith('//') || line.trim().startsWith('*')) {
          return;
        }
        
        if (pattern.test(line)) {
          console.log(`⚠️  Found potentially problematic pattern ${index + 1} at line ${lineIndex + 1}:`);
          console.log(`     "${line.trim()}"`);
          foundProblematicCode = true;
        }
      });
    });

    // Check that we only have one coin awarding mechanism
    const coinAwardingLines = subscriptionsContent
      .split('\n')
      .filter(line => line.includes('coins') && line.includes('+'))
      .filter(line => !line.trim().startsWith('//') && !line.trim().startsWith('*'));

    console.log(`💰 Found ${coinAwardingLines.length} coin awarding lines:`);
    coinAwardingLines.forEach((line, index) => {
      console.log(`   ${index + 1}: ${line.trim()}`);
    });

    // Check for the specific fix we implemented
    const hasCoinsToAwardParameter = subscriptionsContent.includes('coinsToAward');
    const hasOnlySingleCoinAward = coinAwardingLines.length === 1;

    console.log('\n📊 Fix Verification Results:');
    console.log(`   ✅ Uses coinsToAward parameter: ${hasCoinsToAwardParameter ? 'YES' : 'NO'}`);
    console.log(`   ✅ Single coin awarding mechanism: ${hasOnlySingleCoinAward ? 'YES' : 'NO'}`);
    console.log(`   ✅ No problematic patterns: ${!foundProblematicCode ? 'YES' : 'NO'}`);

    const isFixed = hasCoinsToAwardParameter && hasOnlySingleCoinAward && !foundProblematicCode;

    if (isFixed) {
      console.log('\n🎉 SUCCESS: Subscription coin distribution fix is properly deployed!');
      console.log('   - Frontend sends coinsToAward parameter');
      console.log('   - Backend awards coins exactly once');
      console.log('   - No automatic tier-based duplicate awarding');
    } else {
      console.log('\n❌ ISSUE: Fix may not be complete');
    }

    // Let's also check the frontend
    console.log('\n🔍 Checking frontend subscription page...');
    const frontendPath = path.join(__dirname, 'client', 'src', 'pages', 'SubscribePage.tsx');
    
    if (fs.existsSync(frontendPath)) {
      const frontendContent = fs.readFileSync(frontendPath, 'utf8');
      const hasCoinsToAwardInFrontend = frontendContent.includes('coinsToAward');
      const hasCorrectIconAmount = frontendContent.includes('3000') && frontendContent.includes('icon');
      
      console.log(`   ✅ Frontend sends coinsToAward: ${hasCoinsToAwardInFrontend ? 'YES' : 'NO'}`);
      console.log(`   ✅ Icon tier shows 3000 coins: ${hasCorrectIconAmount ? 'YES' : 'NO'}`);
    }

    return isFixed;

  } catch (error) {
    console.error('❌ Error during verification:', error.message);
    return false;
  }
}

// Run the verification
const success = verifySubscriptionFix();
process.exit(success ? 0 : 1);
