import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, Users, Zap, Crown, Coins, Video, Mic, Brain, Image, CheckCircle, Loader2, ChevronDown, ChevronUp, Sparkles, Bot, Shield, Phone } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { apiService } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export default function SubscribePage() {
  const [isYearly, setIsYearly] = useState(false);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [expandedPlan, setExpandedPlan] = useState<string | null>(null);
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();

  const plans = [
    {
      id: 'artist',
      name: "Artist",
      badge: "Save 20%",
      badgeColor: "bg-amber-500/20 text-amber-400",
      monthlyPrice: 12,
      yearlyPrice: 120,
      originalYearlyPrice: 144,
      monthlyPriceId: 'price_artist_monthly',
      yearlyPriceId: 'price_artist_yearly',
      description: "Premium models and chat history. All the fun at the price of your next Starbucks order.",
      features: [
        { icon: Coins, text: "400 free coins each month", color: "text-amber-400" },
        { icon: CheckCircle, text: "Chat History", color: "text-green-400" },
        { icon: Star, text: "Premium Models", color: "text-purple-400" },
        { icon: Image, text: "Custom Characters", color: "text-indigo-400" },
        { icon: Image, text: "In-Chat Pictures", color: "text-pink-400" },
        { icon: Bot, text: "Enhanced AI Responses", color: "text-cyan-400" },
        { icon: Sparkles, text: "Advanced Personality System", color: "text-purple-500" },
      ],
      buttonText: "Subscribe Now",
      buttonClass: "bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-500 hover:to-gray-600 transform hover:scale-105 transition-all duration-300 hover:shadow-lg hover:shadow-gray-500/25",
    },
    {
      id: 'virtuoso',
      name: "Virtuoso",
      badge: "Best Seller",
      badgeColor: "bg-purple-500 text-white",
      monthlyPrice: 24.5,
      yearlyPrice: 245,
      originalYearlyPrice: 294,
      monthlyPriceId: 'price_virtuoso_monthly',
      yearlyPriceId: 'price_virtuoso_yearly',
      features: [
        { icon: Coins, text: "1200 free coins each month", color: "text-amber-400" },
        { icon: CheckCircle, text: "Chat History", color: "text-green-400" },
        { icon: Star, text: "Premium Models", color: "text-purple-400" },
        { icon: Mic, text: "Voice Calls (beta)", color: "text-green-400" },
        { icon: Image, text: "Custom Characters", color: "text-indigo-400" },
        { icon: Brain, text: "8K Memory Context", color: "text-purple-400" },
        { icon: Image, text: "In-Chat Pictures", color: "text-pink-400" },
        { icon: Bot, text: "Advanced AI Models", color: "text-cyan-400" },
        { icon: Shield, text: "VIP Support", color: "text-orange-400" },
        { icon: Sparkles, text: "Exclusive Character Templates", color: "text-purple-500" },
        { icon: Crown, text: "Early Access Features", color: "text-yellow-500" },
      ],
      buttonText: "Subscribe Now",
      buttonClass: "bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-400 hover:to-purple-500 transform hover:scale-105 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/25 animate-pulse hover:animate-none",
      featured: true,
    },
    {
      id: 'icon',
      name: "Icon",
      badge: "Best Value",
      badgeColor: "bg-green-500/20 text-green-400",
      monthlyPrice: 33,
      yearlyPrice: 330,
      originalYearlyPrice: 396,
      monthlyPriceId: 'price_icon_monthly',
      yearlyPriceId: 'price_icon_yearly',
      description: "Unlimited-access - Everything in Deluxe + Priority access, Exclusive models. Go all out🔥",
      features: [
        { icon: Coins, text: "3000 free coins each month", color: "text-amber-400" },
        { icon: Crown, text: "Elite Roleplay Engine", color: "text-amber-400" },
        { icon: CheckCircle, text: "Chat History", color: "text-green-400" },
        { icon: Star, text: "Premium Models", color: "text-purple-400" },
        { icon: Phone, text: "Voice Calls (Beta)", color: "text-green-400" },
        { icon: Image, text: "Custom Characters", color: "text-indigo-400" },
        { icon: Brain, text: "16K Memory Context", color: "text-purple-400" },
        { icon: Image, text: "In-Chat Pictures", color: "text-pink-400" },
        { icon: Bot, text: "Latest AI Models", color: "text-cyan-400" },
        { icon: Sparkles, text: "Unlimited Character Creation", color: "text-purple-500" },
        { icon: Crown, text: "Exclusive Beta Features", color: "text-yellow-500" },
      ],
      buttonText: "Subscribe Now",
      buttonClass: "bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 transform hover:scale-105 transition-all duration-300 hover:shadow-lg hover:shadow-amber-500/25 hover:glow",
    },
  ];

  const handleSubscribe = async (planId: string) => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please log in to subscribe to a plan.",
        variant: "destructive",
      });
      return;
    }

    // Check if user is trying to subscribe to their current plan
    if (user?.tier === planId) {
      toast({
        title: "Already Subscribed",
        description: `You are already subscribed to the ${planId.charAt(0).toUpperCase() + planId.slice(1)} plan.`,
        variant: "destructive",
      });
      return;
    }

    setLoadingPlan(planId);
    
    try {
      const plan = plans.find(p => p.id === planId);
      if (!plan) {
        throw new Error('Plan not found');
      }

      // Award coins based on plan
      const coinAmounts = {
        artist: 400,
        virtuoso: 1200,
        icon: 3000
      };

      const coinsToAward = coinAmounts[planId as keyof typeof coinAmounts] || 0;

      // Simulate payment processing delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Upgrade user subscription (this will include coin awarding on backend)
      // Pass the current billing period to the backend
      const billingPeriod = isYearly ? 'yearly' : 'monthly';
      const response = await apiService.upgradeSubscription(planId, coinsToAward, billingPeriod);
      
      if (response.success) {
        const periodText = isYearly ? 'year' : 'month';
        toast({
          title: "🎉 Subscription Successful!",
          description: `You've been upgraded to ${plan.name} plan for 1 ${periodText} and received ${coinsToAward} coins! Your new tier is active immediately.`,
        });
        
        // Redirect to For You page after a short delay
        setTimeout(() => {
          window.location.href = '/';
        }, 2000);
      } else {
        throw new Error('Subscription failed');
      }
    } catch (error) {
      console.error('Subscription error:', error);
      toast({
        title: "Subscription Error",
        description: "Failed to process subscription. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoadingPlan(null);
    }
  };

  const togglePlanDetails = (planId: string) => {
    setExpandedPlan(expandedPlan === planId ? null : planId);
  };

  return (
    <div className="pb-10 px-4 sm:px-6 lg:px-8">
      {/* Hero Section */}
      <div className="text-center mb-8 sm:mb-12 bg-gradient-to-br from-zinc-800/50 to-zinc-900/50 backdrop-blur-lg border border-orange-500/20 rounded-2xl p-4 sm:p-8 shadow-2xl shadow-orange-500/10">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4 bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">
          Become a Medusa AI Creator
        </h1>
        <p className="text-base sm:text-lg lg:text-xl text-zinc-300 mb-4 sm:mb-6">
          Upgrade your plan to unleash your creativity today and get access to generating limitless images with your own perfect companion!
        </p>
        
        {/* User Avatars */}
        {/* <div className="flex justify-center space-x-1 sm:space-x-2 mb-4 sm:mb-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <img
              key={i}
              src={`https://images.unsplash.com/photo-${1507003211169 + i * 1000000}?w=48`}
              alt="Community member"
              className="w-8 sm:w-10 lg:w-12 h-8 sm:h-10 lg:h-12 rounded-full border-2 border-white object-cover"
            />
          ))}
        </div>
      </div> */}

      {/* Updated Stats Section */}
      <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-3 gap-3 sm:gap-6 mb-6 sm:mb-8">
        <div className="bg-gradient-to-br from-zinc-800/50 to-zinc-900/50 backdrop-blur-lg border border-orange-500/20 rounded-xl shadow-lg shadow-orange-500/10">
          <div className="p-3 sm:p-6 text-center">
            <div className="flex items-center justify-center mb-2 sm:mb-4">
              <Bot className="w-4 sm:w-6 h-4 sm:h-6 text-purple-500 mr-1 sm:mr-2" />
              <span className="text-lg sm:text-2xl font-bold">Any Model</span>
            </div>
            <p className="text-xs sm:text-sm text-zinc-400">Generate any model</p>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-zinc-800/50 to-zinc-900/50 backdrop-blur-lg border border-orange-500/20 rounded-xl shadow-lg shadow-orange-500/10">
          <div className="p-3 sm:p-6 text-center">
            <div className="flex items-center justify-center mb-2 sm:mb-4">
              <Users className="w-4 sm:w-6 h-4 sm:h-6 text-blue-500 mr-1 sm:mr-2" />
              <span className="text-lg sm:text-2xl font-bold">2M+</span>
            </div>
            <p className="text-xs sm:text-sm text-zinc-400">Talk to 2 million possible models</p>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-zinc-800/50 to-zinc-900/50 backdrop-blur-lg border border-orange-500/20 rounded-xl shadow-lg shadow-orange-500/10">
          <div className="p-3 sm:p-6 text-center">
            <div className="flex items-center justify-center mb-2 sm:mb-4">
              <Shield className="w-4 sm:w-6 h-4 sm:h-6 text-green-500 mr-1 sm:mr-2" />
              <span className="text-lg sm:text-2xl font-bold">Both</span>
            </div>
            <p className="text-xs sm:text-sm text-zinc-400">Both realistic and fantasy</p>
          </div>
        </div>
      </div>

      {/* Pricing Section */}
      <div className="mb-6 sm:mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-4 text-zinc-200">Choose your Plan</h2>
        <p className="text-zinc-400 text-center mb-6 sm:mb-8 text-sm sm:text-base">
          100% anonymous. You can cancel anytime.
        </p>

        {/* Billing Toggle */}
        <div className="flex items-center justify-center mb-6 sm:mb-8 px-4">
          <div className="flex bg-gradient-to-br from-zinc-800/50 to-zinc-900/50 backdrop-blur-lg border border-orange-500/20 rounded-lg p-1 w-full max-w-md">
            <Button
              variant={!isYearly ? "default" : "ghost"}
              onClick={() => setIsYearly(false)}
              className={cn(
                "text-xs sm:text-base px-2 sm:px-4 py-2 rounded-md transition-all duration-300 flex-1",
                !isYearly 
                  ? "bg-orange-500 text-white shadow-lg" 
                  : "text-zinc-400 hover:text-zinc-200"
              )}
            >
              Monthly billing
            </Button>
            <Button
              variant={isYearly ? "default" : "ghost"}
              onClick={() => setIsYearly(true)}
              className={cn(
                "text-xs sm:text-base px-2 sm:px-4 py-2 rounded-md transition-all duration-300 ml-1 flex-1",
                isYearly 
                  ? "bg-orange-500 text-white shadow-lg" 
                  : "text-zinc-400 hover:text-zinc-200"
              )}
            >
              <span className="mr-1 sm:mr-2">Yearly billing</span>
              <Badge className="bg-green-500/20 text-green-400 text-[10px] sm:text-xs">-34%</Badge>
            </Button>
          </div>
        </div>

        {/* Pricing Cards */}
        {/* Mobile: Vertical layout with Best Seller on top */}
        <div className="sm:hidden">
          <div className="space-y-4 px-4">
            {/* Best Seller - Deluxe plan on top */}
            {plans.filter(plan => plan.featured).map((plan, index) => (
              <div
                key={plan.name}
                className={cn(
                  "relative bg-gradient-to-br from-zinc-800/50 to-zinc-900/50 backdrop-blur-lg border border-orange-500/20 rounded-lg shadow-lg transition-all duration-300 ring-1 ring-orange-500/50"
                )}
              >
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className={`${plan.badgeColor} text-[10px] px-1.5 py-0.5`}>
                      {plan.badge}
                    </Badge>
                  </div>
                )}
                
                <div className="p-3 pt-5">
                  {/* Header with title and price */}
                  <div className="mb-4">
                    <h3 className="text-base font-semibold text-zinc-200 mb-2 mt-1">{plan.name}</h3>
                    <div className="mb-3">
                      <span className="text-xl font-bold text-zinc-100">
                        ${isYearly ? plan.yearlyPrice : plan.monthlyPrice}
                      </span>
                      <span className="text-zinc-400 text-sm">
                        /{isYearly ? 'yr' : 'mo'}
                      </span>
                      {isYearly && (
                        <p className="text-xs text-zinc-400 leading-relaxed mt-1">
                          ${plan.monthlyPrice}/mo • <span className="line-through">${plan.originalYearlyPrice}/yr</span>
                        </p>
                      )}
                    </div>
                    <p className="text-xs text-zinc-400 leading-relaxed line-clamp-3 mb-2">
                      {plan.description}
                    </p>
                  </div>
                  
                  {/* Compact features list */}
                  <div className="space-y-2 mb-4">
                    {plan.features.slice(0, expandedPlan === plan.id ? plan.features.length : 4).map((feature, featureIndex) => (
                      <div key={featureIndex} className="flex items-center space-x-2">
                        <feature.icon className={`w-3 h-3 ${feature.color} flex-shrink-0`} />
                        <span className="text-xs text-zinc-300 leading-relaxed">{feature.text}</span>
                      </div>
                    ))}
                    {plan.features.length > 4 && (
                      <button 
                        onClick={() => togglePlanDetails(plan.id)}
                        className="flex items-center text-xs text-orange-400 hover:text-orange-300 ml-5 transition-colors duration-200 mt-3"
                      >
                        {expandedPlan === plan.id ? (
                          <>
                            <ChevronUp className="w-3 h-3 mr-1" />
                            Show less
                          </>
                        ) : (
                          <>
                            <ChevronDown className="w-3 h-3 mr-1" />
                            +{plan.features.length - 4} more
                          </>
                        )}
                      </button>
                    )}
                  </div>
                  
                  <Button 
                    className={`w-full ${user?.tier === plan.id ? 'bg-gray-600 cursor-not-allowed' : plan.buttonClass} text-xs py-2 h-9`}
                    onClick={() => handleSubscribe(plan.id)}
                    disabled={loadingPlan === plan.id || user?.tier === plan.id}
                  >
                    {loadingPlan === plan.id ? (
                      <Loader2 className="w-3 h-3 animate-spin mr-1" />
                    ) : null}
                    {user?.tier === plan.id ? 'Current Plan' : loadingPlan === plan.id ? 'Processing...' : plan.buttonText}
                  </Button>
                </div>
              </div>
            ))}

            {/* Other plans below in a single column for better readability */}
            <div className="space-y-4">
              {plans.filter(plan => !plan.featured).map((plan, index) => (
                <div
                  key={plan.name}
                  className={cn(
                    "relative bg-gradient-to-br from-zinc-800/50 to-zinc-900/50 backdrop-blur-lg border border-orange-500/20 rounded-lg shadow-lg transition-all duration-300"
                  )}
                >
                  {plan.badge && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <Badge className={`${plan.badgeColor} text-[10px] px-1.5 py-0.5`}>
                        {plan.badge}
                      </Badge>
                    </div>
                  )}
                  
                  <div className="p-3 pt-5">
                    {/* Header with title and price */}
                    <div className="mb-4">
                      <h3 className="text-base font-semibold text-zinc-200 mb-2 mt-1">{plan.name}</h3>
                      <div className="mb-3">
                        <span className="text-xl font-bold text-zinc-100">
                          ${isYearly ? plan.yearlyPrice : plan.monthlyPrice}
                        </span>
                        <span className="text-zinc-400 text-sm">
                          /{isYearly ? 'yr' : 'mo'}
                        </span>
                        {isYearly && (
                          <p className="text-xs text-zinc-400 leading-relaxed mt-1">
                            ${plan.monthlyPrice}/mo • <span className="line-through">${plan.originalYearlyPrice}/yr</span>
                          </p>
                        )}
                      </div>
                      <p className="text-xs text-zinc-400 leading-relaxed line-clamp-3 mb-2">
                        {plan.description}
                      </p>
                    </div>
                    
                    {/* Compact features list */}
                    <div className="space-y-2 mb-4">
                      {plan.features.slice(0, expandedPlan === plan.id ? plan.features.length : 4).map((feature, featureIndex) => (
                        <div key={featureIndex} className="flex items-center space-x-2">
                          <feature.icon className={`w-3 h-3 ${feature.color} flex-shrink-0`} />
                          <span className="text-xs text-zinc-300 leading-relaxed">{feature.text}</span>
                        </div>
                      ))}
                      {plan.features.length > 4 && (
                        <button 
                          onClick={() => togglePlanDetails(plan.id)}
                          className="flex items-center text-xs text-orange-400 hover:text-orange-300 ml-5 transition-colors duration-200 mt-3"
                        >
                          {expandedPlan === plan.id ? (
                            <>
                              <ChevronUp className="w-3 h-3 mr-1" />
                              Show less
                            </>
                          ) : (
                            <>
                              <ChevronDown className="w-3 h-3 mr-1" />
                              +{plan.features.length - 4} more
                            </>
                          )}
                        </button>
                      )}
                    </div>
                    
                    <Button 
                      className={`w-full ${user?.tier === plan.id ? 'bg-gray-600 cursor-not-allowed' : plan.buttonClass} text-xs py-2 h-9`}
                      onClick={() => handleSubscribe(plan.id)}
                      disabled={loadingPlan === plan.id || user?.tier === plan.id}
                    >
                      {loadingPlan === plan.id ? (
                        <Loader2 className="w-3 h-3 animate-spin mr-1" />
                      ) : null}
                      {user?.tier === plan.id ? 'Current Plan' : loadingPlan === plan.id ? 'Processing...' : plan.buttonText}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Desktop: Grid layout */}
        <div className="hidden sm:grid sm:grid-cols-3 md:grid-cols-3 gap-4 sm:gap-6 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <div
              key={plan.name}
              className={cn(
                "relative bg-gradient-to-br from-zinc-800/50 to-zinc-900/50 backdrop-blur-lg border border-orange-500/20 rounded-xl sm:rounded-2xl shadow-2xl shadow-orange-500/10 hover:shadow-orange-500/20 transition-all duration-300",
                plan.featured && "ring-1 sm:ring-2 ring-orange-500/50 sm:scale-105"
              )}
            >
              {plan.badge && (
                <div className="absolute -top-2 sm:-top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className={`${plan.badgeColor} text-xs sm:text-sm px-2 sm:px-3`}>
                    {plan.badge}
                  </Badge>
                </div>
              )}
              
              <div className="p-3 sm:p-6">
                <div className="mb-4 sm:mb-6">
                  <h3 className="text-lg sm:text-xl font-semibold text-zinc-200 mb-2 sm:mb-4">{plan.name}</h3>
                  <div className="mb-3 sm:mb-4">
                    <span className="text-xl sm:text-2xl lg:text-3xl font-bold text-zinc-100">
                      ${isYearly ? plan.yearlyPrice : plan.monthlyPrice}
                    </span>
                    <span className="text-zinc-400 text-sm sm:text-base">
                      /{isYearly ? 'year' : 'month'}
                    </span>
                    {isYearly && (
                      <p className="text-xs sm:text-sm text-zinc-400">
                        or ${plan.monthlyPrice}/month{' '}
                        <span className="line-through">${plan.originalYearlyPrice}/year</span>
                      </p>
                    )}
                  </div>
                  <p className="text-xs sm:text-sm text-zinc-400 leading-tight">
                    {plan.description}
                  </p>
                </div>
                
                <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-6">
                  {plan.features.slice(0, expandedPlan === plan.id ? plan.features.length : 5).map((feature, featureIndex) => (
                    <div key={featureIndex} className="flex items-center space-x-2 sm:space-x-3">
                      <feature.icon className={`w-3 sm:w-4 lg:w-5 h-3 sm:h-4 lg:h-5 ${feature.color} flex-shrink-0`} />
                      <span className="text-xs sm:text-sm text-zinc-300 leading-tight">{feature.text}</span>
                    </div>
                  ))}
                  {plan.features.length > 5 && (
                    <button 
                      onClick={() => togglePlanDetails(plan.id)}
                      className="flex items-center text-xs text-orange-400 hover:text-orange-300 ml-5 sm:ml-6 transition-colors duration-200"
                    >
                      {expandedPlan === plan.id ? (
                        <>
                          <ChevronUp className="w-4 h-4 mr-1" />
                          Show less features
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-4 h-4 mr-1" />
                          +{plan.features.length - 5} more features
                        </>
                      )}
                    </button>
                  )}
                </div>
                
                <Button 
                  className={`w-full ${user?.tier === plan.id ? 'bg-gray-600 cursor-not-allowed' : plan.buttonClass} text-xs sm:text-sm py-2 sm:py-3`}
                  onClick={() => handleSubscribe(plan.id)}
                  disabled={loadingPlan === plan.id || user?.tier === plan.id}
                >
                  {loadingPlan === plan.id ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : null}
                  {user?.tier === plan.id ? 'Current Plan' : loadingPlan === plan.id ? 'Processing...' : plan.buttonText}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Payment Methods */}
      <div className="text-center mb-8 sm:mb-12">
        <h3 className="text-lg font-semibold mb-4 text-zinc-200">Pay using</h3>
        <div className="flex justify-center gap-2 sm:gap-4">
          <div className="bg-gradient-to-br from-zinc-800/50 to-zinc-900/50 backdrop-blur-lg border border-orange-500/20 rounded-xl p-3 sm:p-4 shadow-lg shadow-orange-500/10 flex-1 max-w-[100px] sm:max-w-none sm:flex-none hover:scale-105 transition-transform duration-300">
            <div className="text-center">
              <div className="text-lg sm:text-2xl mb-1 sm:mb-2">💳</div>
              <p className="text-xs sm:text-sm text-zinc-300">Credit Card</p>
            </div>
          </div>
          <div className="bg-gradient-to-br from-zinc-800/50 to-zinc-900/50 backdrop-blur-lg border border-orange-500/20 rounded-xl p-3 sm:p-4 shadow-lg shadow-orange-500/10 flex-1 max-w-[100px] sm:max-w-none sm:flex-none hover:scale-105 transition-transform duration-300">
            <div className="text-center">
              <div className="text-lg sm:text-2xl mb-1 sm:mb-2">🏦</div>
              <p className="text-xs sm:text-sm text-zinc-300">Pay by Bank</p>
            </div>
          </div>
          <div className="bg-gradient-to-br from-zinc-800/50 to-zinc-900/50 backdrop-blur-lg border border-orange-500/20 rounded-xl p-3 sm:p-4 shadow-lg shadow-orange-500/10 flex-1 max-w-[100px] sm:max-w-none sm:flex-none hover:scale-105 transition-transform duration-300">
            <div className="text-center">
              <div className="text-lg sm:text-2xl mb-1 sm:mb-2">💰</div>
              <p className="text-xs sm:text-sm text-zinc-300 leading-tight">One time Payment</p>
            </div>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}
