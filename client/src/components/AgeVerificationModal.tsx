import React, { useState } from 'react';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Shield, AlertTriangle, ExternalLink } from 'lucide-react';

interface AgeVerificationModalProps {
  isOpen: boolean;
  onVerified: () => void;
}

export function AgeVerificationModal({ isOpen, onVerified }: AgeVerificationModalProps) {
  const [isAnimating, setIsAnimating] = useState(false);

  const handleYes = () => {
    setIsAnimating(true);
    // Just call onVerified after a short delay without any DOM manipulation
    setTimeout(() => {
      onVerified();
    }, 300);
  };

  const handleNo = () => {
    setIsAnimating(true);
    setTimeout(() => {
      window.location.href = 'https://google.com';
    }, 300);
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 min-h-screen">
        {/* Backdrop */}
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" />
        
        {/* Modal Content */}
        <div 
          className={`
            relative w-full max-w-sm sm:max-w-md mx-auto my-auto
            transition-all duration-500 ease-out
            ${isAnimating ? 'scale-95 opacity-0' : 'scale-100 opacity-100'}
          `}
          style={{
            maxHeight: 'calc(100vh - 2rem)',
            overflow: 'auto'
          }}
        >
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-zinc-900 via-zinc-800 to-black border border-orange-500/20 shadow-2xl">
          {/* Animated background glow */}
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-transparent to-purple-500/10 animate-pulse"></div>
          
          {/* Subtle grid pattern overlay */}
          <div className="absolute inset-0 opacity-5" style={{
            backgroundImage: `radial-gradient(circle at 25% 25%, orange 1px, transparent 1px)`,
            backgroundSize: '24px 24px'
          }}></div>

          <div className="relative z-10 p-4 sm:p-8">
            {/* Header with icon */}
            <div className="text-center mb-6 sm:mb-8">
              <div className="relative inline-block mb-3 sm:mb-4">
                <div className="absolute inset-0 bg-orange-500/30 rounded-full blur-xl animate-pulse"></div>
                <div className="relative w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-orange-500 to-amber-500 rounded-full flex items-center justify-center shadow-lg">
                  <Shield className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                </div>
              </div>
              
              <h2 className="text-xl sm:text-2xl font-bold mb-2 bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent">
                Age Verification
              </h2>
              
              <div className="flex items-center justify-center gap-2 text-amber-400 text-xs sm:text-sm font-medium mb-3 sm:mb-4">
                <AlertTriangle className="w-3 h-3 sm:w-4 sm:h-4" />
                <span>Adult Content Verification Required</span>
              </div>
            </div>

            {/* Main content */}
            <div className="text-center mb-6 sm:mb-8">
              <p className="text-gray-300 text-base sm:text-lg leading-relaxed mb-3 sm:mb-4">
                You must be <span className="text-orange-400 font-semibold">18 years or older</span> to access this website.
              </p>
              
              <p className="text-gray-400 text-xs sm:text-sm leading-relaxed">
                This website contains adult content and AI-generated material intended for mature audiences only. 
                By continuing, you confirm that you are of legal age in your jurisdiction.
              </p>
            </div>

            {/* Action buttons */}
            <div className="space-y-2 sm:space-y-3">
              <Button
                onClick={handleYes}
                className="w-full py-3 sm:py-4 text-base sm:text-lg font-semibold bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white border-0 rounded-xl transition-all duration-300 transform hover:scale-[1.02] hover:shadow-xl hover:shadow-orange-500/25"
              >
                Yes, I am 18 or older
              </Button>
              
              <Button
                onClick={handleNo}
                variant="outline"
                className="w-full py-3 sm:py-4 text-base sm:text-lg font-semibold bg-transparent border-2 border-zinc-600 text-zinc-300 hover:bg-zinc-800 hover:border-zinc-500 rounded-xl transition-all duration-300 transform hover:scale-[1.02] group"
              >
                <span>No, I am under 18</span>
                <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4 ml-2 group-hover:translate-x-1 transition-transform duration-200" />
              </Button>
            </div>

            {/* Footer disclaimer */}
            <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-zinc-700/50">
              <p className="text-xs text-zinc-500 text-center leading-relaxed">
                By clicking "Yes", you certify that you are 18+ years old and agree to our{' '}
                <a 
                  href="/legal/terms-of-service" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-orange-400 hover:text-orange-300 cursor-pointer underline"
                >
                  Terms of Service
                </a>{' '}
                and{' '}
                <a 
                  href="/legal/privacy-policy" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-orange-400 hover:text-orange-300 cursor-pointer underline"
                >
                  Privacy Policy
                </a>
                .
              </p>
            </div>
          </div>

          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-orange-500/20 to-transparent rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-purple-500/20 to-transparent rounded-full blur-2xl"></div>
        </div>
        </div>
      </div>
    </Dialog>
  );
}