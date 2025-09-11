import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Coins, Image, Video, Mic, Wand2, Crown, Zap, TrendingDown } from "lucide-react";
import { coinPackages, recentTransactions, usageItems } from '@/constants/index';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { authService } from '@/lib/auth';
import { apiService } from '@/lib/api';
import { formatCoins } from '@/lib/utils';
import { useState } from 'react';

export default function CoinsPage() {
  const { user, isAuthenticated } = useAuth();
  const [loadingPackage, setLoadingPackage] = useState<string | null>(null);

  // Fetch fresh user data to get current coin balance
  const { data: userProfile, isLoading: isLoadingProfile } = useQuery({
    queryKey: ['user', 'profile'],
    queryFn: authService.getProfile,
    enabled: isAuthenticated,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Fetch coin information including monthly allowance
  const { data: coinInfo, isLoading: isLoadingCoinInfo } = useQuery({
    queryKey: ['coins', 'info'],
    queryFn: apiService.getCoinInfo,
    enabled: isAuthenticated,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const currentCoins = (userProfile as any)?.coins || (user as any)?.coins || 0;

  const handlePurchase = async (pkg: any) => {
    if (!isAuthenticated) {
      alert('Please sign in to purchase coins');
      return;
    }

    try {
      setLoadingPackage(pkg.name);
      console.log('🛍️ Mock purchasing package:', pkg);
      
      // Simulate payment processing delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const response = await apiService.mockCoinPurchase(pkg.packageId, pkg.coins);
      console.log('✅ Mock payment successful:', response);
      
      if (response.success) {
        alert(`🎉 Payment successful! ${pkg.coins} coins have been added to your account.`);
        // Refresh the page to update the coin balance
        window.location.reload();
      } else {
        throw new Error('Payment failed');
      }
    } catch (error: any) {
      console.error('❌ Purchase failed:', error);
      alert(`Payment failed: ${error.message || 'Please try again.'}`);
    } finally {
      setLoadingPackage(null);
    }
  };

  const handleCardPurchase = async (pkg: any) => {
    if (!isAuthenticated) {
      alert('Please sign in to purchase coins');
      return;
    }

    try {
      setLoadingPackage(pkg.name);
      console.log('💳 Mock card payment for package:', pkg);
      
      // Simulate payment processing delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const response = await apiService.mockCoinPurchase(pkg.packageId, pkg.coins);
      console.log('✅ Mock card payment successful:', response);
      
      if (response.success) {
        alert(`🎉 Payment successful! ${pkg.coins} coins have been added to your account.`);
        // Refresh the page to update the coin balance
        window.location.reload();
      } else {
        throw new Error('Payment failed');
      }
    } catch (error: any) {
      console.error('❌ Card purchase failed:', error);
      alert(`Payment failed: ${error.message || 'Please try again.'}`);
    } finally {
      setLoadingPackage(null);
    }
  };

  const handleManualCoinAddition = async () => {
    try {
      console.log('🪙 Adding coins manually...');
      
      const response = await apiService.addCoinsManually('test_pack_100');
      console.log('✅ Coins added:', response);
      
      alert(response.message);
      
      // Refetch user data to update the balance display
      window.location.reload();
    } catch (error: any) {
      console.error('❌ Failed to add coins:', error);
      alert(`Failed to add coins: ${error.message || 'Please try again.'}`);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8 sm:mb-12 text-center">
        <div className="inline-flex items-center space-x-3 mb-4">
          <div className="p-2 sm:p-3 bg-gradient-to-r from-orange-500 to-amber-500 rounded-full">
            <Coins className="w-6 sm:w-8 h-6 sm:h-8 text-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent">
            Coins & Credits
          </h1>
        </div>
        <p className="text-zinc-400 text-sm sm:text-lg max-w-2xl mx-auto">
          Unlock premium features, generate stunning images, and enhance your experience with MedusaVR coins
        </p>
      </div>

      {/* Current Balance - Enhanced */}
      <div className="space-y-16">
        <Card className="mb-12 bg-gradient-to-r from-orange-500/10 via-amber-500/10 to-orange-600/10 border-orange-500/30 shadow-2xl shadow-orange-500/5 backdrop-blur-sm">
          <CardContent className="p-4 sm:p-6 lg:p-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-6">
              <div className="flex items-center space-x-4 sm:space-x-6 flex-1 min-w-0">
                <div className="relative shrink-0">
                  <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-amber-500 rounded-full blur-lg opacity-50"></div>
                  <div className="relative p-3 sm:p-4 bg-gradient-to-r from-orange-500 to-amber-500 rounded-full">
                    <Coins className="w-8 sm:w-12 h-8 sm:h-12 text-white" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl sm:text-2xl font-bold text-orange-400 mb-2">Current Balance</h2>
                  <div className="flex items-baseline space-x-2 sm:space-x-3 flex-wrap">
                    {isLoadingProfile ? (
                      <div className="animate-pulse bg-orange-300/20 h-8 sm:h-12 w-24 sm:w-32 rounded"></div>
                    ) : (
                      <>
                        <span className="text-2xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent break-all">
                          {/* Mobile: Use truncated format */}
                          <span className="sm:hidden">{formatCoins(currentCoins)}</span>
                          {/* Desktop: Use full format but with max length */}
                          <span className="hidden sm:inline">{formatCoins(currentCoins)}</span>
                        </span>
                        <span className="text-base sm:text-xl text-orange-300/80 shrink-0">VF Coins</span>
                      </>
                    )}
                  </div>
                  {isAuthenticated ? (
                    <p className="text-xs sm:text-sm text-orange-300/60 mt-2 truncate">
                      Welcome back, {user?.username}!
                    </p>
                  ) : (
                    <p className="text-xs sm:text-sm text-orange-300/60 mt-2">
                      Sign in to view your balance
                    </p>
                  )}
                </div>
              </div>
              <div className="w-full sm:w-auto sm:text-right">
                <div className="p-3 sm:p-4 bg-orange-500/10 rounded-lg border border-orange-500/20">
                  <p className="text-xs sm:text-sm text-orange-300/80 mb-1">Monthly Allowance</p>
                  {isLoadingCoinInfo ? (
                    <div className="animate-pulse bg-orange-300/20 h-6 w-16 rounded mb-1"></div>
                  ) : (
                    <p className="text-xl sm:text-2xl font-bold text-orange-400">
                      {coinInfo?.data?.monthlyAllowance || 0}
                    </p>
                  )}
                  {isLoadingCoinInfo ? (
                    <div className="animate-pulse bg-orange-300/20 h-3 w-24 rounded"></div>
                  ) : (
                    <p className="text-xs text-orange-300/60">
                      {coinInfo?.data?.isEligibleForRefill 
                        ? 'Monthly allowance available in subscription settings' 
                        : `Next refill in ${coinInfo?.data?.daysUntilRefill || 0} days`}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Coin Packages - Simplified */}
        <div className="mb-16">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-orange-400 mb-4">Coin Packages</h2>
            <p className="text-zinc-400">Choose the perfect package for your needs - Instant delivery!</p>
          </div>
          
          {/* Mobile: Most popular on top, others below horizontally */}
          <div className="max-w-4xl mx-auto">
            {/* Mobile Layout */}
            <div className="sm:hidden space-y-4">
              {/* Most Popular Package - Full Width on Top */}
              {coinPackages.filter(pkg => pkg.popular).map((pkg, index) => (
                <Card 
                  key={`mobile-popular-${index}`}
                  className="relative pt-6 ring-2 ring-orange-500 bg-gradient-to-b from-orange-500/10 to-amber-500/5 border-orange-500/50 backdrop-blur-sm transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl"
                >
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-gradient-to-r from-orange-500 to-amber-500 text-white px-3 py-1 flex items-center space-x-1 text-xs shadow-lg">
                      <Crown className="w-3 h-3" />
                      <span>Most Popular</span>
                    </Badge>
                  </div>
                  
                  <CardHeader className="text-center pb-3">
                    <div className="relative mx-auto mb-4">
                      <div className="absolute inset-0 bg-orange-500 rounded-full blur-lg opacity-30"></div>
                      <div className="relative p-3 bg-gradient-to-r from-orange-500 to-amber-500 rounded-full">
                        <Coins className="w-6 h-6 text-white" />
                      </div>
                    </div>
                    <CardTitle className="text-lg text-orange-400">{pkg.name}</CardTitle>
                    <div className="text-3xl font-bold mb-2 text-orange-300">{pkg.coins}</div>
                    <p className="text-xs text-zinc-400">Coins</p>
                    <div className="mt-3">
                      <div className="text-2xl font-bold text-orange-400">${pkg.price}</div>
                      {pkg.savings && (
                        <Badge className="mt-1 bg-green-500/20 text-green-400 border-green-500/30 text-xs">
                          {pkg.savings}
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pt-0 px-4 pb-4">
                    <Button 
                      className="w-full font-semibold transition-all duration-300 py-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-lg shadow-orange-500/25 text-sm"
                      onClick={() => handleCardPurchase(pkg)}
                      disabled={loadingPackage === pkg.name}
                    >
                      {loadingPackage === pkg.name ? (
                        <div className="flex items-center justify-center space-x-2">
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                          <span>Processing...</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center space-x-2">
                          <Coins className="w-3 h-3" />
                          <span>Buy with Card</span>
                        </div>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              ))}
              
              {/* Other Packages - Horizontal Grid */}
              <div className="grid grid-cols-2 gap-3">
                {coinPackages.filter(pkg => !pkg.popular).map((pkg, index) => (
                  <Card 
                    key={`mobile-other-${index}`}
                    className="relative bg-zinc-800/50 border-zinc-700 hover:border-orange-500/30 backdrop-blur-sm transition-all duration-300 hover:scale-[1.02] hover:shadow-xl"
                  >
                    <CardHeader className="text-center pb-2 px-3 pt-3">
                      <div className="relative mx-auto mb-3">
                        <div className="absolute inset-0 bg-zinc-600 rounded-full blur-lg opacity-30"></div>
                        <div className="relative p-2 bg-zinc-700 rounded-full">
                          <Coins className="w-4 h-4 text-white" />
                        </div>
                      </div>
                      <CardTitle className="text-sm text-zinc-200">{pkg.name}</CardTitle>
                      <div className="text-xl font-bold mb-1 text-zinc-100">{pkg.coins}</div>
                      <p className="text-xs text-zinc-400">Coins</p>
                      <div className="mt-2">
                        <div className="text-lg font-bold text-zinc-200">${pkg.price}</div>
                        {pkg.savings && (
                          <Badge className="mt-1 bg-green-500/20 text-green-400 border-green-500/30 text-xs">
                            {pkg.savings}
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    
                    <CardContent className="pt-0 px-3 pb-3">
                      <Button 
                        className="w-full font-semibold transition-all duration-300 py-1.5 bg-zinc-700 hover:bg-zinc-600 text-zinc-100 border border-zinc-600 hover:border-orange-500/50 text-xs"
                        onClick={() => handleCardPurchase(pkg)}
                        disabled={loadingPackage === pkg.name}
                      >
                        {loadingPackage === pkg.name ? (
                          <div className="flex items-center justify-center space-x-1">
                            <div className="animate-spin rounded-full h-2 w-2 border-b-2 border-white"></div>
                            <span>...</span>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center space-x-1">
                            <Coins className="w-3 h-3" />
                            <span>Buy</span>
                          </div>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Desktop Layout - Original Grid */}
            <div className="hidden sm:grid sm:grid-cols-3 gap-6">
              {coinPackages.map((pkg, index) => (
                <Card 
                  key={`desktop-${index}`}
                  className={`relative transition-all duration-300 hover:scale-105 hover:shadow-2xl ${
                    pkg.popular 
                    ? "pt-6 ring-2 ring-orange-500 bg-gradient-to-b from-orange-500/10 to-amber-500/5 border-orange-500/50" 
                    : "bg-zinc-800/50 border-zinc-700 hover:border-orange-500/30"
                  } backdrop-blur-sm`}
                >
                  {pkg.popular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <Badge className="bg-gradient-to-r from-orange-500 to-amber-500 text-white px-4 py-1 flex items-center space-x-1 text-sm shadow-lg">
                        <Crown className="w-4 h-4" />
                        <span>Most Popular</span>
                      </Badge>
                    </div>
                  )}
                  
                  <CardHeader className="text-center pb-4">
                    <div className="relative mx-auto mb-6">
                      <div className={`absolute inset-0 ${pkg.popular ? 'bg-orange-500' : 'bg-zinc-600'} rounded-full blur-lg opacity-30`}></div>
                      <div className={`relative p-4 ${pkg.popular ? 'bg-gradient-to-r from-orange-500 to-amber-500' : 'bg-zinc-700'} rounded-full`}>
                        <Coins className="w-8 h-8 text-white" />
                      </div>
                    </div>
                    <CardTitle className={`text-xl ${pkg.popular ? 'text-orange-400' : 'text-zinc-200'}`}>
                      {pkg.name}
                    </CardTitle>
                    <div className={`text-4xl font-bold mb-3 ${pkg.popular ? 'text-orange-300' : 'text-zinc-100'}`}>
                      {pkg.coins}
                    </div>
                    <p className="text-sm text-zinc-400">Coins</p>
                    <div className="mt-4">
                      <div className={`text-3xl font-bold ${pkg.popular ? 'text-orange-400' : 'text-zinc-200'}`}>
                        ${pkg.price}
                      </div>
                      {pkg.savings && (
                        <Badge className="mt-2 bg-green-500/20 text-green-400 border-green-500/30">
                          {pkg.savings}
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pt-0">
                    <Button 
                      className={`w-full font-semibold transition-all duration-300 py-3 ${
                        pkg.popular
                          ? "bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-lg shadow-orange-500/25"
                          : "bg-zinc-700 hover:bg-zinc-600 text-zinc-100 border border-zinc-600 hover:border-orange-500/50"
                      }`}
                      onClick={() => handleCardPurchase(pkg)}
                      disabled={loadingPackage === pkg.name}
                    >
                      {loadingPackage === pkg.name ? (
                        <div className="flex items-center justify-center space-x-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          <span>Processing...</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center space-x-2">
                          <Coins className="w-4 h-4" />
                          <span>Buy with Card</span>
                        </div>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>

        {/* Usage Information - Enhanced */}
        <div className="mb-16">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-orange-400 mb-4">How to Use Your Coins</h2>
            <p className="text-zinc-400">Explore all the amazing features you can unlock with your coins</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {usageItems.map((item, index) => (
              <Card key={index} className="group relative overflow-hidden bg-gradient-to-br from-zinc-800/80 via-zinc-800/60 to-zinc-900/80 border border-zinc-700/50 hover:border-orange-500/40 backdrop-blur-sm transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-orange-500/20 text-center">
                {/* Animated Background Gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 via-transparent to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                
                <CardContent className="relative p-6 space-y-4">
                  {/* Icon with Enhanced Styling */}
                  <div className="relative mx-auto w-fit">
                    {/* Outer Glow Ring */}
                    <div className="absolute inset-0 bg-gradient-to-r from-orange-500/30 to-amber-500/30 rounded-full blur-xl scale-110 opacity-60 group-hover:opacity-100 group-hover:scale-125 transition-all duration-500"></div>
                    
                    {/* Inner Glow Ring */}
                    <div className="absolute inset-0 bg-gradient-to-r from-orange-500/20 to-amber-500/20 rounded-full blur-lg opacity-80 group-hover:opacity-100 transition-opacity duration-300"></div>
                    
                    {/* Icon Container */}
                    <div className="relative p-4 bg-gradient-to-br from-zinc-700/80 to-zinc-800/80 rounded-full border border-orange-500/20 group-hover:border-orange-500/40 group-hover:from-orange-500/10 group-hover:to-amber-500/10 transition-all duration-300">
                      <item.icon className="w-7 h-7 text-orange-400 group-hover:text-orange-300 group-hover:scale-110 transition-all duration-300" />
                    </div>
                  </div>

                  {/* Feature Name */}
                  <h3 className="font-bold text-orange-300 text-lg mb-2 group-hover:text-orange-200 transition-colors duration-300">
                    {item.feature}
                  </h3>
                  
                  {/* Description */}
                  <p className="text-sm text-zinc-400 mb-4 leading-relaxed group-hover:text-zinc-300 transition-colors duration-300">
                    {item.description}
                  </p>
                  
                  {/* Cost Display */}
                  <div className={`font-bold ${item.color} flex items-center justify-center space-x-2 text-base`}>
                    <div className="p-1 bg-current/10 rounded-full">
                      <Coins className="w-5 h-5" />
                    </div>
                    <span className="font-extrabold tracking-wider">{item.cost}</span>
                  </div>

                  {/* Decorative Elements */}
                  <div className="absolute top-2 right-2 w-2 h-2 bg-gradient-to-r from-orange-500 to-amber-500 rounded-full opacity-60 group-hover:opacity-100 group-hover:scale-150 transition-all duration-500"></div>
                  <div className="absolute bottom-2 left-2 w-1 h-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full opacity-40 group-hover:opacity-80 group-hover:scale-150 transition-all duration-700"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}