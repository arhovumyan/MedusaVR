import { Dialog, Transition, TransitionChild, DialogPanel, DialogTitle } from "@headlessui/react";
import { Fragment } from "react";
import { Button } from "@/components/ui/button";
import { X, Heart, Star, Crown } from "lucide-react";
import modelImage from "@/constants/pics/model.jpg";
import modelImage2 from "@/constants/pics/bitties.png"; // Ensure this path is correct

interface SubscriptionModalProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  onSignIn: () => void;
  onSignUp: () => void;
  action?: string; // e.g., "add to favorites", "chat with character"
}

export default function SubscriptionModal({ 
  isOpen, 
  setIsOpen, 
  onSignIn, 
  onSignUp,
  action = "access this feature"
}: SubscriptionModalProps) {
  
  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={() => setIsOpen(false)}>
        <TransitionChild 
          as={Fragment} 
          enter="ease-out duration-300" 
          enterFrom="opacity-0" 
          enterTo="opacity-100" 
          leave="ease-in duration-200" 
          leaveFrom="opacity-100" 
          leaveTo="opacity-0"
        >        
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
        </TransitionChild>

        <div className="fixed inset-0 overflow-y-auto flex items-center justify-center px-4">
          <DialogPanel className="w-full max-w-lg transform overflow-hidden rounded-2xl bg-gradient-to-br from-zinc-900/95 to-black/95 backdrop-blur-lg border border-orange-500/30 text-white shadow-2xl shadow-orange-500/20 transition-all">
            
            {/* Header with close button */}
            <div className="relative p-6 pb-0">
              <button 
                onClick={() => setIsOpen(false)} 
                className="absolute top-4 right-4 w-6 h-6 rounded-full bg-transparent hover:bg-gray-500/20 flex items-center justify-center opacity-40 hover:opacity-60 transition-all duration-200 focus:outline-none"
              >
                <X className="h-2.5 w-2.5 text-gray-400" />
              </button>
            </div>

            {/* Main content */}
            <div className="px-6 pb-6">
              {/* Image */}
              <div className="flex justify-center mb-6">
                <div className="relative">
                  <img
                    src={modelImage2}
                    alt="MedusaVR Premium"
                    className="w-32 h-32 rounded-full object-cover border-4 border-gradient-to-r from-orange-400 to-orange-600 shadow-lg"
                  />
                  <div className="absolute -top-2 -right-2 bg-gradient-to-r from-orange-400 to-orange-600 rounded-full p-2">
                    <Crown className="h-5 w-5 text-white" />
                  </div>
                </div>
              </div>

              {/* Title */}
              <DialogTitle className="text-3xl font-bold text-center mb-4">
                <span className="bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">
                  Join MedusaVR 
                </span>
              </DialogTitle>

              {/* Subtitle */}
              <p className="text-center text-zinc-300 mb-6 text-lg">
                Sign up to {action} and unlock exclusive features
              </p>

              {/* Features list */}
              <div className="space-y-3 mb-6">
                <div className="flex items-center space-x-3 text-zinc-200">
                  <Heart className="h-5 w-5 text-red-500" />
                  <span>Save your favorite characters</span>
                </div>
                <div className="flex items-center space-x-3 text-zinc-200">
                  <Star className="h-5 w-5 text-yellow-500" />
                  <span>Unlimited conversations</span>
                </div>
                <div className="flex items-center space-x-3 text-zinc-200">
                  <Crown className="h-5 w-5 text-orange-500" />
                  <span>Premium character access</span>
                </div>
              </div>

              {/* Action buttons */}
              <div className="space-y-3">
                <Button 
                  onClick={() => {
                    setIsOpen(false);
                    onSignUp();
                  }}
                  className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold py-3 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg shadow-orange-500/25"
                >
                  Get Started Free
                </Button>
                
                <Button 
                  onClick={() => {
                    setIsOpen(false);
                    onSignIn();
                  }}
                  variant="outline"
                  className="w-full border-zinc-600 text-zinc-300 hover:bg-zinc-800 hover:text-white font-semibold py-3 rounded-xl transition-all duration-200"
                >
                  Already have an account? Sign In
                </Button>
              </div>

              {/* Footer text */}
              <p className="text-center text-zinc-500 text-sm mt-4">
                Join thousands of users enjoying premium AI conversations
              </p>
            </div>
          </DialogPanel>
        </div>
      </Dialog>
    </Transition>
  );
}
