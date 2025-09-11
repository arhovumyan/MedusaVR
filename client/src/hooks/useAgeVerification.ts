import { useState, useEffect } from 'react';
import { ageVerificationUtils } from '@/lib/ageVerification';

export function useAgeVerification() {
  const [isVerified, setIsVerified] = useState<boolean | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    // Check if user has already verified their age and verification is still valid
    console.log('🔍 Checking age verification status...');
    const verified = ageVerificationUtils.isAgeVerified();
    
    // Get detailed status for debugging
    const status = ageVerificationUtils.getVerificationStatus();
    console.log('📊 Age verification status:', {
      isVerified: verified,
      timestamp: status.timestamp,
      version: status.version,
      timeUntilExpiry: status.timeUntilExpiry,
      hoursUntilExpiry: status.timeUntilExpiry ? Math.round(status.timeUntilExpiry / (1000 * 60 * 60) * 100) / 100 : null
    });
    
    if (verified) {
      console.log('✅ Age verification valid, hiding modal');
      setIsVerified(true);
      setShowModal(false);
      console.log('🔧 showModal state set to false');
    } else {
      console.log('❌ Age verification required, will show modal');
      setIsVerified(false);
      // Small delay to ensure smooth page load before showing modal
      setTimeout(() => {
        console.log('🔧 showModal state set to true after timeout');
        setShowModal(true);
      }, 500);
    }
  }, []);

  const handleVerification = () => {
    console.log('✅ User verified age, storing verification');
    ageVerificationUtils.setAgeVerified();
    setIsVerified(true);
    setShowModal(false);
  };

  const resetVerification = () => {
    console.log('🔄 Resetting age verification');
    ageVerificationUtils.clearVerification();
    setIsVerified(false);
    setShowModal(true);
  };

  const returnValue = {
    isVerified,
    showModal,
    handleVerification,
    resetVerification
  };

  console.log('🔧 useAgeVerification returning:', { 
    isVerified: returnValue.isVerified, 
    showModal: returnValue.showModal 
  });

  return returnValue;
}
