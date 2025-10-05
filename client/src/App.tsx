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

const App = memo(() => {
  const [isSignInOpen, setIsSignInOpen] = useState(false);
  const [isSignUpOpen, setIsSignUpOpen] = useState(false);


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
              <AppLayout>
                <Router />
              </AppLayout>
              <Toaster />
              
            </TooltipProvider>
            
            {/* Global modals - inside AuthProvider */}
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
            
          </SubscriptionModalProvider>
        </AuthProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );
});

App.displayName = 'App';

export default App;
