import React, { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useLocation } from 'wouter';

interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function AuthGuard({ children, fallback }: AuthGuardProps) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const [, setLocation] = useLocation();

  // Redirect to home if not authenticated (after loading check)
  useEffect(() => {
    if (!isLoading && (!isAuthenticated || !user)) {
      setLocation('/');
    }
  }, [isLoading, isAuthenticated, user, setLocation]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-zinc-900 via-zinc-800 to-orange-900/20 text-white flex items-center justify-center">
        <LoadingSpinner size="lg" text="Checking authentication..." />
      </div>
    );
  }

  // If not authenticated, redirect is happening, show loading while redirecting
  if (!isAuthenticated || !user) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-zinc-900 via-zinc-800 to-orange-900/20 text-white flex items-center justify-center">
        <LoadingSpinner size="lg" text="Redirecting to home..." />
      </div>
    );
  }

  // User is authenticated, render children
  return <>{children}</>;
}

export default AuthGuard; 