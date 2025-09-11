import { memo, useState } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { HelmetProvider } from "react-helmet-async";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import { SubscriptionModalProvider } from "@/hooks/useSubscriptionModal";
import Router from "./Router";
import AppLayout from "./components/layout/AppLayout";
import SignInModal from "@/components/SignInModal";
import SignUpModal from "@/components/SignUpModal";
import { OnboardingCheck } from "@/components/OnboardingCheck";
import { AgeVerificationModal } from "@/components/AgeVerificationModal";
import { useAgeVerification } from "@/hooks/useAgeVerification";

const App = memo(() => {
  const [isSignInOpen, setIsSignInOpen] = useState(false);
  const [isSignUpOpen, setIsSignUpOpen] = useState(false);
  const { isVerified, showModal, handleVerification } = useAgeVerification();

  // Debug logging for App.tsx state
  console.log(`🏠 App.tsx - isVerified: ${isVerified}, showModal: ${showModal}`);

  const openSignIn = () => {
    setIsSignUpOpen(false);
    setIsSignInOpen(true);
  };

  const openSignUp = () => {
    setIsSignInOpen(false);
    setIsSignUpOpen(true);
  };

  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <SubscriptionModalProvider onSignIn={openSignIn} onSignUp={openSignUp}>
            <TooltipProvider>
              {/* Only show main content when age is verified AND modal is not showing */}
              {isVerified && !showModal && (
                <>
                  <AppLayout>
                    <Router />
                  </AppLayout>
                  <Toaster />
                </>
              )}
              
              {/* Show loading state or blank screen while checking age verification */}
              {!isVerified && !showModal && (
                <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-800 to-black flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-zinc-400">Loading...</p>
                  </div>
                </div>
              )}
            </TooltipProvider>
            
            {/* Global modals - inside AuthProvider - only show when age is verified */}
            {isVerified && !showModal && (
              <>
                <SignInModal 
                  isOpen={isSignInOpen} 
                  setIsOpen={setIsSignInOpen}
                  openSignUp={openSignUp}
                />
                <SignUpModal 
                  isOpen={isSignUpOpen} 
                  setIsOpen={setIsSignUpOpen}
                  openSignIn={openSignIn}
                />
                
                {/* Global onboarding check */}
                <OnboardingCheck />
              </>
            )}
            
            {/* Age verification modal - only shows when showModal is true */}
            {showModal && (
              <AgeVerificationModal 
                isOpen={true}
                onVerified={handleVerification}
              />
            )}
          </SubscriptionModalProvider>
        </AuthProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );
});

App.displayName = 'App';

export default App;
