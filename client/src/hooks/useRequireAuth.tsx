import { useAuth } from './useAuth';
import { useSubscriptionModal } from './useSubscriptionModal';

/**
 * Hook that provides a function to check authentication and show subscription modal if needed
 */
export function useRequireAuth() {
  const { isAuthenticated } = useAuth();
  const { showSubscriptionModal } = useSubscriptionModal();

  /**
   * Check if user is authenticated, show subscription modal if not
   * @param action - Description of the action requiring authentication
   * @returns true if authenticated, false if not (and modal is shown)
   */
  const requireAuth = (action: string = 'access this feature'): boolean => {
    if (!isAuthenticated) {
      showSubscriptionModal(action);
      return false;
    }
    return true;
  };

  return { requireAuth, isAuthenticated };
}
