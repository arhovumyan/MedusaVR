import { Dialog, Transition, TransitionChild, DialogPanel, DialogTitle } from "@headlessui/react";
import { Fragment, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Zap, Crown, Sparkles, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { apiService } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { LoadingSpinner } from '@/components/ui/loading-spinner';

interface SubscriptionUpgradeModalProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  requiredTier?: string;
  feature?: string;
}

interface SubscriptionPlan {
  name: string;
  price: number;
  currency: string;
  interval: string;
  description: string;
  features: string[];
}

interface TierPermissions {
  canCreateCharacters: boolean;
  canGenerateImages: boolean;
  canAccessPremiumFeatures: boolean;
  charactersLimit: number;
  imagesPerMonth: number;
}

export default function SubscriptionUpgradeModal({ 
  isOpen, 
  setIsOpen, 
  requiredTier = 'artist',
  feature = 'create characters'
}: SubscriptionUpgradeModalProps) {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const [plans, setPlans] = useState<Record<string, SubscriptionPlan>>({});
  const [tierPermissions, setTierPermissions] = useState<Record<string, TierPermissions>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isUpgrading, setIsUpgrading] = useState(false);

  const tierIcons = {
    artist: <Zap className="h-6 w-6" />,
    virtuoso: <Crown className="h-6 w-6" />,
    icon: <Sparkles className="h-6 w-6" />
  };

  const tierColors = {
    artist: 'from-orange-500 to-orange-600',
    virtuoso: 'from-purple-500 to-purple-600',
    icon: 'from-yellow-500 to-yellow-600'
  };

  const tierBadgeColors = {
    artist: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    virtuoso: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    icon: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
  };

  useEffect(() => {
    if (isOpen) {
      fetchSubscriptionPlans();
    }
  }, [isOpen]);

  const fetchSubscriptionPlans = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/subscriptions/plans', {
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('medusavr_access_token')}`
        }
      });
      const data = await response.json();
      setPlans(data.plans);
      setTierPermissions(data.tierPermissions);
    } catch (error) {
      console.error('Error fetching subscription plans:', error);
      toast({
        title: "Error",
        description: "Failed to load subscription plans. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpgrade = async (planId: string) => {
    try {
      setIsUpgrading(true);
      
      const response = await fetch('/api/subscriptions/upgrade', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('medusavr_access_token')}`
        },
        body: JSON.stringify({ plan: planId })
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: "Success! 🎉",
          description: `Successfully upgraded to ${data.tier} tier!`,
          variant: "default"
        });
        
        // Refresh user data to get updated tier
        await refreshUser();
        
        // Close modal - only after successful upgrade
        setIsOpen(false);
      } else {
        throw new Error(data.message || 'Upgrade failed');
      }
    } catch (error: any) {
      console.error('Error upgrading subscription:', error);
      toast({
        title: "Upgrade Failed",
        description: error.message || "Failed to upgrade subscription. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsUpgrading(false);
    }
  };

  const handleClose = () => {
    // Modal cannot be closed - users must upgrade to continue
    return;
  };

  const getAvailablePlans = () => {
    const tierHierarchy = ['free', 'artist', 'virtuoso', 'icon'];
    const currentTierIndex = tierHierarchy.indexOf(user?.tier || 'free');
    const requiredTierIndex = tierHierarchy.indexOf(requiredTier);
    
    return Object.entries(plans).filter(([planId]) => {
      const planIndex = tierHierarchy.indexOf(planId);
      return planIndex >= Math.max(currentTierIndex + 1, requiredTierIndex);
    });
  };

  if (isLoading) {
    return (
      <Transition appear show={isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => {}} static>
          <TransitionChild 
            as={Fragment} 
            enter="ease-out duration-300" 
            enterFrom="opacity-0" 
            enterTo="opacity-100" 
            leave="ease-in duration-200" 
            leaveFrom="opacity-100" 
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" />
          </TransitionChild>
          <div className="fixed inset-0 overflow-y-auto flex items-center justify-center p-4">
            <TransitionChild
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <DialogPanel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-gradient-to-br from-zinc-800/90 to-zinc-900/90 backdrop-blur-lg border border-orange-500/20 p-6 text-white shadow-2xl shadow-orange-500/10 transition-all">
                <div className="text-center">
                  <LoadingSpinner size="md" text="Loading plans..." />
                </div>
              </DialogPanel>
            </TransitionChild>
          </div>
        </Dialog>
      </Transition>
    );
  }

  const availablePlans = getAvailablePlans();

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={() => {}} static>
        <TransitionChild 
          as={Fragment} 
          enter="ease-out duration-300" 
          enterFrom="opacity-0" 
          enterTo="opacity-100" 
          leave="ease-in duration-200" 
          leaveFrom="opacity-100" 
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" />
        </TransitionChild>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4 py-8">
            <TransitionChild
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <DialogPanel className="w-full max-w-sm sm:max-w-md lg:max-w-3xl mx-2 sm:mx-4 my-4 transform overflow-visible rounded-2xl bg-gradient-to-br from-zinc-800/90 to-zinc-900/90 backdrop-blur-lg border border-orange-500/20 text-white shadow-2xl shadow-orange-500/10 transition-all">
                
                {/* Header */}
                <div className="p-4 sm:p-6 border-b border-orange-500/20">
                  <div className="text-center">
                    <DialogTitle className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">
                      Upgrade Required to Create Characters
                    </DialogTitle>
                    <p className="text-zinc-300 mt-2 text-sm sm:text-base">
                      To {feature}, you need to upgrade your subscription tier.
                    </p>
                    <p className="text-zinc-400 mt-1 sm:mt-2 text-xs sm:text-sm">
                      This modal cannot be closed until you upgrade.
                    </p>
                  </div>
                </div>

                {/* Current Tier */}
                <div className="p-4 sm:p-6 border-b border-zinc-700/50">
                  <div className="flex items-center gap-3 mb-3 sm:mb-4">
                    <div className="p-2 bg-zinc-700/50 rounded-lg">
                      <Star className="h-4 w-4 sm:h-5 sm:w-5 text-zinc-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-zinc-200 text-sm sm:text-base">Current Tier</h3>
                      <p className="text-xs sm:text-sm text-zinc-400">
                        You're currently on the <span className="capitalize font-semibold text-orange-400">{user?.tier || 'free'}</span> tier
                      </p>
                    </div>
                  </div>
                  
                  {tierPermissions[user?.tier || 'free'] && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 text-xs sm:text-sm">
                      <div className="flex items-center gap-2">
                        <div className={cn(
                          "w-2 h-2 rounded-full",
                          tierPermissions[user?.tier || 'free'].canCreateCharacters ? "bg-green-500" : "bg-red-500"
                        )} />
                        <span className={tierPermissions[user?.tier || 'free'].canCreateCharacters ? "text-green-400" : "text-red-400"}>
                          {tierPermissions[user?.tier || 'free'].canCreateCharacters ? "Can create characters" : "Cannot create characters"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={cn(
                          "w-2 h-2 rounded-full",
                          tierPermissions[user?.tier || 'free'].canGenerateImages ? "bg-green-500" : "bg-red-500"
                        )} />
                        <span className={tierPermissions[user?.tier || 'free'].canGenerateImages ? "text-green-400" : "text-red-400"}>
                          {tierPermissions[user?.tier || 'free'].canGenerateImages ? "Can generate images" : "Cannot generate images"}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Available Plans */}
                <div className="p-4 sm:p-6">
                  <h3 className="text-base sm:text-lg font-semibold text-orange-200 mb-4 sm:mb-6 text-center">Choose Your Plan</h3>
                  
                  {/* Custom responsive layout: Artist & Virtuoso side by side, Icon below */}
                  <div className="space-y-4">
                    {/* First row: Artist and Virtuoso side by side */}
                    <div className="grid grid-cols-2 gap-3 sm:gap-4">
                      {availablePlans.filter(([planId]) => planId === 'artist' || planId === 'virtuoso').map(([planId, plan]) => (
                        <div
                          key={planId}
                          className="relative bg-zinc-700/30 rounded-xl p-3 sm:p-4 border border-zinc-600/50 hover:border-orange-500/30 transition-all duration-300 hover:scale-[1.02] group"
                        >
                          <div className="text-center mb-3">
                            <div className={cn(
                              "w-8 h-8 sm:w-10 sm:h-10 rounded-full mx-auto mb-2 flex items-center justify-center bg-gradient-to-r",
                              tierColors[planId as keyof typeof tierColors]
                            )}>
                              <div className="flex items-center justify-center w-4 h-4 sm:w-5 sm:h-5">
                                {tierIcons[planId as keyof typeof tierIcons]}
                              </div>
                            </div>
                            <h4 className="text-sm sm:text-lg font-bold text-white">{plan.name}</h4>
                            <p className="text-zinc-400 text-xs sm:text-sm mt-1">{plan.description}</p>
                          </div>

                          <div className="text-center mb-3 sm:mb-4">
                            <div className="text-lg sm:text-2xl font-bold text-white">
                              ${plan.price}
                              <span className="text-xs sm:text-sm font-normal text-zinc-400">/{plan.interval}</span>
                            </div>
                          </div>

                          <div className="space-y-2 mb-3 sm:mb-4">
                            {plan.features.slice(0, 3).map((feature, index) => (
                              <div key={index} className="flex items-start gap-2">
                                <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4 text-green-400 flex-shrink-0 mt-0.5" />
                                <span className="text-xs sm:text-sm text-zinc-300 leading-tight">{feature}</span>
                              </div>
                            ))}
                            {plan.features.length > 3 && (
                              <div className="text-xs text-zinc-400 text-center">+{plan.features.length - 3} more features</div>
                            )}
                          </div>

                          <Button
                            onClick={() => handleUpgrade(planId)}
                            disabled={isUpgrading}
                            className={cn(
                              "w-full bg-gradient-to-r text-white font-semibold py-2 px-3 text-xs sm:text-sm rounded-lg transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100",
                              tierColors[planId as keyof typeof tierColors]
                            )}
                          >
                            {isUpgrading ? (
                              <>
                                <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-b-2 border-white mr-2"></div>
                                Upgrading...
                              </>
                            ) : (
                              `Upgrade to ${plan.name}`
                            )}
                          </Button>
                        </div>
                      ))}
                    </div>

                    {/* Second row: Icon centered */}
                    {availablePlans.filter(([planId]) => planId === 'icon').map(([planId, plan]) => (
                      <div key={planId} className="flex justify-center">
                        <div className="relative bg-zinc-700/30 rounded-xl p-4 sm:p-5 border border-zinc-600/50 hover:border-orange-500/30 transition-all duration-300 hover:scale-[1.02] group w-full max-w-sm">
                          {planId === 'icon' && (
                            <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                              <Badge className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white border-0 px-2 py-1 text-xs">
                                Most Popular
                              </Badge>
                            </div>
                          )}
                          
                          <div className="text-center mb-4">
                            <div className={cn(
                              "w-10 h-10 sm:w-12 sm:h-12 rounded-full mx-auto mb-3 flex items-center justify-center bg-gradient-to-r",
                              tierColors[planId as keyof typeof tierColors]
                            )}>
                              <div className="flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6">
                                {tierIcons[planId as keyof typeof tierIcons]}
                              </div>
                            </div>
                            <h4 className="text-lg sm:text-xl font-bold text-white">{plan.name}</h4>
                            <p className="text-zinc-400 text-sm mt-1">{plan.description}</p>
                          </div>

                          <div className="text-center mb-4 sm:mb-6">
                            <div className="text-2xl sm:text-3xl font-bold text-white">
                              ${plan.price}
                              <span className="text-sm font-normal text-zinc-400">/{plan.interval}</span>
                            </div>
                          </div>

                          <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-6">
                            {plan.features.map((feature, index) => (
                              <div key={index} className="flex items-start gap-2">
                                <CheckCircle2 className="h-4 w-4 text-green-400 flex-shrink-0 mt-0.5" />
                                <span className="text-sm text-zinc-300">{feature}</span>
                              </div>
                            ))}
                          </div>

                          <Button
                            onClick={() => handleUpgrade(planId)}
                            disabled={isUpgrading}
                            className={cn(
                              "w-full bg-gradient-to-r text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100",
                              tierColors[planId as keyof typeof tierColors]
                            )}
                          >
                            {isUpgrading ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                Upgrading...
                              </>
                            ) : (
                              `Upgrade to ${plan.name}`
                            )}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Footer */}
                <div className="p-4 sm:p-6 border-t border-zinc-700/50 bg-zinc-800/30">
                  <div className="flex flex-col items-center gap-3 sm:gap-4">
                    <div className="flex items-center gap-2 text-xs sm:text-sm text-zinc-400">
                      <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4 text-green-400" />
                      <span>Cancel anytime • No hidden fees • Instant access</span>
                    </div>
                    <Button 
                      variant="outline" 
                      onClick={() => window.location.href = '/subscribe'}
                      className="border-orange-500/30 hover:border-orange-500/60 hover:bg-orange-500/10 text-orange-400 hover:text-orange-300 text-sm"
                    >
                      Browse All Plans & Options
                    </Button>
                  </div>
                </div>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
} 