import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import TagPreferenceModal from './TagPreferenceModal';
import { apiService } from '@/lib/api';

export function OnboardingCheck() {
  const { user, isAuthenticated, refreshUser } = useAuth();
  const [showPreferencesModal, setShowPreferencesModal] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    // Only check onboarding status if user is authenticated and we have user data
    if (isAuthenticated && user && !isProcessing) {
      // If this is the first time we're getting user data, refresh it to ensure it's up to date
      if (!hasInitialized) {
        if (import.meta.env.DEV || import.meta.env.VITE_APP_ENV === 'development') {
          console.log('OnboardingCheck: First time loading user, refreshing data...');
        }
        refreshUser().then(() => {
          setHasInitialized(true);
        });
        return;
      }

      // Check if user has completed onboarding
      const hasCompletedOnboarding = user.preferences?.completedOnboarding ?? false;
      
      if (import.meta.env.DEV || import.meta.env.VITE_APP_ENV === 'development') {
        console.log('OnboardingCheck: User data:', {
          userId: user.id,
          username: user.username,
          preferences: user.preferences,
          hasCompletedOnboarding,
          hasInitialized,
          isProcessing
        });
      }
      
      // Only show modal if onboarding not completed and modal not already shown
      if (!hasCompletedOnboarding && !showPreferencesModal) {
        if (import.meta.env.DEV || import.meta.env.VITE_APP_ENV === 'development') {
          console.log('OnboardingCheck: Showing preferences modal because onboarding not completed');
        }
        setShowPreferencesModal(true);
      } else if (hasCompletedOnboarding && showPreferencesModal) {
        if (import.meta.env.DEV || import.meta.env.VITE_APP_ENV === 'development') {
          console.log('OnboardingCheck: Hiding preferences modal because onboarding is completed');
        }
        setShowPreferencesModal(false);
      } else {
        if (import.meta.env.DEV || import.meta.env.VITE_APP_ENV === 'development') {
          console.log('OnboardingCheck: User has completed onboarding, not showing modal');
        }
      }
    }
  }, [isAuthenticated, user, refreshUser, hasInitialized, isProcessing, showPreferencesModal]);

  const handlePreferencesSave = async (selectedTags: string[]) => {
    setIsProcessing(true);
    try {
      if (import.meta.env.DEV || import.meta.env.VITE_APP_ENV === 'development') {
        console.log('OnboardingCheck: Saving preferences...', { selectedTags });
      }
      
      // Save user preferences to the backend
      await apiService.updateUserPreferences({
        selectedTags,
        completedOnboarding: true,
        nsfwEnabled: selectedTags.some(tag => 
          ['nsfw', 'hentai', 'breeding', 'femdom', 'bdsm', 'bondage', 'cnc', 'ntr', 'chastity', 'hypno', 'voyeur', 'cheating', 'cuckold', 'feet', 'worship', 'futa', 'bbw', 'succubus', 'pregnant', 'shortstack'].includes(tag)
        )
      });
      
      if (import.meta.env.DEV || import.meta.env.VITE_APP_ENV === 'development') {
        console.log('OnboardingCheck: User preferences saved successfully');
      }
      
      // Close the modal immediately
      setShowPreferencesModal(false);
      
      // Refresh user data to get the updated preferences
      await refreshUser();
      
      if (import.meta.env.DEV || import.meta.env.VITE_APP_ENV === 'development') {
        console.log('OnboardingCheck: User data refreshed, onboarding complete');
      }
    } catch (err) {
      console.error('OnboardingCheck: Failed to save preferences:', err);
      // Keep the modal open on error so user can try again
    } finally {
      setIsProcessing(false);
    }
  };

  const handleModalClose = (open: boolean) => {
    // Prevent closing the modal if user hasn't completed onboarding
    // This ensures users must complete the onboarding process
    if (!open && user && !user.preferences?.completedOnboarding) {
      if (import.meta.env.DEV || import.meta.env.VITE_APP_ENV === 'development') {
        console.log('OnboardingCheck: Preventing modal close - onboarding not completed');
      }
      return;
    }
    setShowPreferencesModal(open);
  };

  return (
    <TagPreferenceModal
      isOpen={showPreferencesModal}
      setIsOpen={handleModalClose}
      onSave={handlePreferencesSave}
      isFirstTimeSetup={true}
    />
  );
}
