import { createContext, useContext, useState, ReactNode } from 'react';
import SubscriptionModal from '@/components/SubscriptionModal';

interface SubscriptionModalContextType {
  showSubscriptionModal: (action?: string) => void;
  hideSubscriptionModal: () => void;
  isSubscriptionModalOpen: boolean;
}

const SubscriptionModalContext = createContext<SubscriptionModalContextType | undefined>(undefined);

export function useSubscriptionModal() {
  const context = useContext(SubscriptionModalContext);
  if (!context) {
    throw new Error('useSubscriptionModal must be used within a SubscriptionModalProvider');
  }
  return context;
}

interface SubscriptionModalProviderProps {
  children: ReactNode;
  onSignIn: () => void;
  onSignUp: () => void;
}

export function SubscriptionModalProvider({ 
  children, 
  onSignIn, 
  onSignUp 
}: SubscriptionModalProviderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentAction, setCurrentAction] = useState<string>('access this feature');

  const showSubscriptionModal = (action?: string) => {
    if (action) {
      setCurrentAction(action);
    }
    setIsOpen(true);
  };

  const hideSubscriptionModal = () => {
    setIsOpen(false);
  };

  const value: SubscriptionModalContextType = {
    showSubscriptionModal,
    hideSubscriptionModal,
    isSubscriptionModalOpen: isOpen,
  };

  return (
    <SubscriptionModalContext.Provider value={value}>
      {children}
      <SubscriptionModal
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        onSignIn={onSignIn}
        onSignUp={onSignUp}
        action={currentAction}
      />
    </SubscriptionModalContext.Provider>
  );
}
