/**
 * Debug script to check age verification status
 * Run this in browser console to debug the issue
 */

console.log(' Age Verification Debug');
console.log('========================');

// Check current localStorage values
console.log('\n Current localStorage values:');
console.log('ageVerified:', localStorage.getItem('ageVerified'));
console.log('ageVerifiedTimestamp:', localStorage.getItem('ageVerifiedTimestamp'));
console.log('ageVerificationVersion:', localStorage.getItem('ageVerificationVersion'));

// Check if timestamp exists and what it says
const timestamp = localStorage.getItem('ageVerifiedTimestamp');
if (timestamp) {
    const date = new Date(parseInt(timestamp));
    const now = new Date();
    const diffHours = (now - date) / (1000 * 60 * 60);
    
    console.log('\n Timestamp Details:');
    console.log('Verification Date:', date);
    console.log('Current Date:', now);
    console.log('Hours since verification:', diffHours.toFixed(2));
    console.log('Should be valid for 24 hours');
}

// Clear all age verification data to reset
console.log('\n Clearing all age verification data...');
localStorage.removeItem('ageVerified');
localStorage.removeItem('ageVerifiedTimestamp');
localStorage.removeItem('ageVerificationVersion');

console.log('\n Cleared! Refresh the page to see the modal, then click "Yes, I am 18 or older"');
console.log('After that, refresh again - the modal should NOT appear for 24 hours.');

// Function to manually set verification (for testing)
window.setAgeVerification = function() {
    localStorage.setItem('ageVerified', 'true');
    localStorage.setItem('ageVerifiedTimestamp', Date.now().toString());
    localStorage.setItem('ageVerificationVersion', 'v2');
    console.log(' Age verification set manually');
    console.log('Refresh the page - modal should NOT appear');
};

// Function to check verification status
window.checkAgeVerification = function() {
    const verified = localStorage.getItem('ageVerified');
    const timestamp = localStorage.getItem('ageVerifiedTimestamp');
    const version = localStorage.getItem('ageVerificationVersion');
    
    console.log('\n Verification Status:');
    console.log('Verified:', verified);
    console.log('Timestamp:', timestamp ? new Date(parseInt(timestamp)) : null);
    console.log('Version:', version);
    
    if (verified === 'true' && timestamp && version === 'v2') {
        const verificationDate = new Date(parseInt(timestamp));
        const expiryDate = new Date(verificationDate.getTime() + (24 * 60 * 60 * 1000));
        const isExpired = new Date() > expiryDate;
        
        console.log('Expires:', expiryDate);
        console.log('Is Expired:', isExpired);
        console.log('Should show modal:', isExpired || version !== 'v2');
    } else {
        console.log('Should show modal: true (missing data)');
    }
};

console.log('\n🛠️ Debug functions available:');
console.log('- setAgeVerification() - manually set verification');
console.log('- checkAgeVerification() - check current status');
