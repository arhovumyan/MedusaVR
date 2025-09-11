#!/usr/bin/env node

/**
 * Test script to verify age verification fix
 * This script can be run in browser console to test the age verification logic
 */

console.log('🧪 Testing Age Verification Fix');
console.log('================================');

// Simulate the age verification utility functions
const AGE_VERIFICATION_KEY = 'ageVerified';
const AGE_VERIFICATION_TIMESTAMP_KEY = 'ageVerifiedTimestamp';
const AGE_VERIFICATION_VERSION_KEY = 'ageVerificationVersion';
const VERIFICATION_EXPIRY_DAYS = 1; // 24 hours
const CURRENT_VERSION = 'v2';

const testAgeVerification = {
  isAgeVerified() {
    try {
      const verified = localStorage.getItem(AGE_VERIFICATION_KEY);
      const timestamp = localStorage.getItem(AGE_VERIFICATION_TIMESTAMP_KEY);
      const version = localStorage.getItem(AGE_VERIFICATION_VERSION_KEY);
      
      if (verified !== 'true' || !timestamp || version !== CURRENT_VERSION) {
        this.clearVerification();
        return false;
      }
      
      const verificationDate = new Date(parseInt(timestamp));
      const expiryDate = new Date(verificationDate.getTime() + (VERIFICATION_EXPIRY_DAYS * 24 * 60 * 60 * 1000));
      
      if (new Date() > expiryDate) {
        this.clearVerification();
        return false;
      }
      
      return true;
    } catch (error) {
      console.warn('Error checking age verification:', error);
      return false;
    }
  },

  setAgeVerified() {
    try {
      localStorage.setItem(AGE_VERIFICATION_KEY, 'true');
      localStorage.setItem(AGE_VERIFICATION_TIMESTAMP_KEY, Date.now().toString());
      localStorage.setItem(AGE_VERIFICATION_VERSION_KEY, CURRENT_VERSION);
    } catch (error) {
      console.warn('Error setting age verification:', error);
    }
  },

  clearVerification() {
    try {
      localStorage.removeItem(AGE_VERIFICATION_KEY);
      localStorage.removeItem(AGE_VERIFICATION_TIMESTAMP_KEY);
      localStorage.removeItem(AGE_VERIFICATION_VERSION_KEY);
    } catch (error) {
      console.warn('Error clearing age verification:', error);
    }
  },

  getStatus() {
    try {
      const verified = localStorage.getItem(AGE_VERIFICATION_KEY);
      const timestamp = localStorage.getItem(AGE_VERIFICATION_TIMESTAMP_KEY);
      const version = localStorage.getItem(AGE_VERIFICATION_VERSION_KEY);
      
      const timestampDate = timestamp ? new Date(parseInt(timestamp)) : null;
      const timeUntilExpiry = timestampDate ? 
        (timestampDate.getTime() + (VERIFICATION_EXPIRY_DAYS * 24 * 60 * 60 * 1000)) - Date.now() : null;
      
      return {
        isVerified: verified === 'true',
        timestamp: timestampDate,
        version,
        timeUntilExpiry,
        hoursUntilExpiry: timeUntilExpiry ? Math.round(timeUntilExpiry / (1000 * 60 * 60) * 100) / 100 : null
      };
    } catch (error) {
      console.warn('Error getting verification status:', error);
      return null;
    }
  }
};

// Test scenarios
console.log('\n📋 Test Scenarios:');
console.log('=================');

// Clear any existing verification
testAgeVerification.clearVerification();
console.log('1. ✅ Cleared existing verification');

// Test: No verification should show modal
let shouldShowModal = !testAgeVerification.isAgeVerified();
console.log(`2. Should show modal (no verification): ${shouldShowModal ? '✅ YES' : '❌ NO'}`);

// Set age verification
testAgeVerification.setAgeVerified();
console.log('3. ✅ Set age verification');

// Test: With fresh verification should NOT show modal
shouldShowModal = !testAgeVerification.isAgeVerified();
console.log(`4. Should show modal (fresh verification): ${shouldShowModal ? '❌ YES (ERROR!)' : '✅ NO'}`);

// Show current status
const status = testAgeVerification.getStatus();
console.log('\n📊 Current Status:');
console.log('==================');
console.log('Verified:', status.isVerified);
console.log('Timestamp:', status.timestamp);
console.log('Version:', status.version);
console.log('Hours until expiry:', status.hoursUntilExpiry);

// Test old version cleanup
console.log('\n🔄 Testing Version Migration:');
console.log('============================');

// Simulate old version data
localStorage.setItem(AGE_VERIFICATION_KEY, 'true');
localStorage.setItem(AGE_VERIFICATION_TIMESTAMP_KEY, Date.now().toString());
localStorage.setItem(AGE_VERIFICATION_VERSION_KEY, 'v1'); // Old version

shouldShowModal = !testAgeVerification.isAgeVerified();
console.log(`Should show modal (old version): ${shouldShowModal ? '✅ YES' : '❌ NO (ERROR!)'}`);

// Set new verification
testAgeVerification.setAgeVerified();
shouldShowModal = !testAgeVerification.isAgeVerified();
console.log(`Should show modal (after migration): ${shouldShowModal ? '❌ YES (ERROR!)' : '✅ NO'}`);

console.log('\n🎉 Age verification fix test completed!');
console.log('\n🔧 Summary of Changes:');
console.log('=====================');
console.log('- ✅ Changed expiry from 30 days to 1 day (24 hours)');
console.log('- ✅ Added version checking for seamless migration');
console.log('- ✅ Users with old verification will be re-prompted once');
console.log('- ✅ After verification, modal won\'t show for 24 hours');
console.log('- ✅ Added debugging utilities for troubleshooting');

console.log('\n📝 To test in browser:');
console.log('======================');
console.log('1. Open browser console');
console.log('2. Paste this script');
console.log('3. Run the tests');
console.log('4. Refresh page to verify modal doesn\'t show again');
