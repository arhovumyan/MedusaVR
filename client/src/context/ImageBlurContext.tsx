import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

interface ImageBlurContextType {
  isBlurred: boolean;
  toggleBlur: () => void;
  showNSFW: boolean;
  toggleNSFWFilter: () => void;
  shouldBlurNSFW: (isNSFW: boolean) => boolean;
  getNSFWBlurStyles: (isNSFW: boolean) => string;
}

const ImageBlurContext = createContext<ImageBlurContextType | undefined>(undefined);

// Local storage key for NSFW preference
const NSFW_PREFERENCE_KEY = 'medusavr_show_nsfw';

export const ImageBlurProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Initialize state from localStorage, defaulting to false (hide NSFW) for safety
  const [isBlurred, setIsBlurred] = useState(false);
  const [showNSFW, setShowNSFW] = useState(() => {
    try {
      const stored = localStorage.getItem(NSFW_PREFERENCE_KEY);
      return stored !== null ? JSON.parse(stored) : false; // Default to false (blur NSFW)
    } catch {
      return false; // Default to false if parsing fails
    }
  });

  // Save to localStorage whenever showNSFW changes
  useEffect(() => {
    try {
      localStorage.setItem(NSFW_PREFERENCE_KEY, JSON.stringify(showNSFW));
    } catch (error) {
      console.warn('Failed to save NSFW preference to localStorage:', error);
    }
  }, [showNSFW]);

  const toggleBlur = () => {
    setIsBlurred(prev => !prev);
  };

  const toggleNSFWFilter = () => {
    setShowNSFW((prev: boolean) => !prev);
  };

  // Helper function to determine if NSFW content should be blurred
  const shouldBlurNSFW = (isNSFW: boolean): boolean => {
    return isNSFW && !showNSFW;
  };

  // Helper function to get blur styles for NSFW content
  const getNSFWBlurStyles = (isNSFW: boolean): string => {
    if (shouldBlurNSFW(isNSFW)) {
      return 'filter: blur(20px); opacity: 0.6;';
    }
    return '';
  };

  return (
    <ImageBlurContext.Provider value={{ 
      isBlurred, 
      toggleBlur, 
      showNSFW, 
      toggleNSFWFilter, 
      shouldBlurNSFW,
      getNSFWBlurStyles
    }}>
      {children}
    </ImageBlurContext.Provider>
  );
};

export const useImageBlur = () => {
  const context = useContext(ImageBlurContext);
  if (context === undefined) {
    throw new Error('useImageBlur must be used within an ImageBlurProvider');
  }
  return context;
};