/**
 * Age verification utilities for managing user age consent
 */

const AGE_VERIFICATION_KEY = 'ageVerified';
const AGE_VERIFICATION_TIMESTAMP_KEY = 'ageVerifiedTimestamp';
const AGE_VERIFICATION_VERSION_KEY = 'ageVerificationVersion';

// Age verification expires after 30 days (720 hours) for better user experience
const VERIFICATION_EXPIRY_DAYS = 30;
const CURRENT_VERSION = 'v3'; // Updated to v3 for 30-day expiry

export const ageVerificationUtils = {
  /**
   * Check if user has verified their age and verification is still valid
   */
  isAgeVerified(): boolean {
    try {
      const verified = localStorage.getItem(AGE_VERIFICATION_KEY);
      const timestamp = localStorage.getItem(AGE_VERIFICATION_TIMESTAMP_KEY);
      const version = localStorage.getItem(AGE_VERIFICATION_VERSION_KEY);
      
      // If no verification data exists or version doesn't match, require re-verification
      if (verified !== 'true' || !timestamp || version !== CURRENT_VERSION) {
        this.clearVerification();
        return false;
      }
      
      // Check if verification has expired
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

  /**
   * Mark user as age verified
   */
  setAgeVerified(): void {
    try {
      localStorage.setItem(AGE_VERIFICATION_KEY, 'true');
      localStorage.setItem(AGE_VERIFICATION_TIMESTAMP_KEY, Date.now().toString());
      localStorage.setItem(AGE_VERIFICATION_VERSION_KEY, CURRENT_VERSION);
    } catch (error) {
      console.warn('Error setting age verification:', error);
    }
  },

  /**
   * Clear age verification
   */
  clearVerification(): void {
    try {
      localStorage.removeItem(AGE_VERIFICATION_KEY);
      localStorage.removeItem(AGE_VERIFICATION_TIMESTAMP_KEY);
      localStorage.removeItem(AGE_VERIFICATION_VERSION_KEY);
    } catch (error) {
      console.warn('Error clearing age verification:', error);
    }
  },

  /**
   * Get verification timestamp for debugging
   */
  getVerificationTimestamp(): Date | null {
    try {
      const timestamp = localStorage.getItem(AGE_VERIFICATION_TIMESTAMP_KEY);
      return timestamp ? new Date(parseInt(timestamp)) : null;
    } catch (error) {
      console.warn('Error getting verification timestamp:', error);
      return null;
    }
  },

  /**
   * Get detailed verification status for debugging
   */
  getVerificationStatus(): {
    isVerified: boolean;
    timestamp: Date | null;
    version: string | null;
    timeUntilExpiry: number | null;
  } {
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
        timeUntilExpiry
      };
    } catch (error) {
      console.warn('Error getting verification status:', error);
      return {
        isVerified: false,
        timestamp: null,
        version: null,
        timeUntilExpiry: null
      };
    }
  }
};
