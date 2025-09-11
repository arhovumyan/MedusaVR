import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  CreditCard, 
  Calendar, 
  DollarSign, 
  Download, 
  ExternalLink, 
  Crown,
  CheckCircle,
  XCircle,
  Loader2,
  AlertTriangle,
  ArrowUpCircle,
  ArrowDownCircle,
  Settings,
  UserCheck
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiService } from "@/lib/api";
import type { Subscription, Invoice } from "@shared/api-types";
import { Link } from "wouter";
import { LoadingSpinner } from '@/components/ui/loading-spinner';

export default function SubscriptionManagePage() {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (isAuthenticated) {
      loadSubscriptionData();
    }
  }, [isAuthenticated]);

  const loadSubscriptionData = async () => {
    try {
      setLoading(true);
      
      // Load subscription status
      try {
        const subResponse = await apiService.getSubscriptionStatus();
        setSubscription(subResponse.subscription);
      } catch (subError) {
        console.warn('Failed to load subscription status:', subError);
        setSubscription(null);
      }
      
      // Load invoices (optional, may not be implemented)
      try {
        const invoicesResponse = await apiService.getInvoices();
        setInvoices(invoicesResponse.invoices || []);
      } catch (invoicesError) {
        console.warn('Invoices endpoint not available:', invoicesError);
        setInvoices([]); // Set empty array as fallback
      }
    } catch (error) {
      console.error('Failed to load subscription data:', error);
      toast({
        title: "Error",
        description: "Failed to load subscription data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!subscription) return;
    
    setActionLoading('cancel');
    try {
      // Cancel subscription and drop user to free tier
      await apiService.cancelSubscription(subscription.id);
      
      // Update user tier to free
      await apiService.updateUserTier('free');
      
      toast({
        title: "Subscription Cancelled",
        description: "Your subscription has been cancelled and your tier has been changed to Free. You'll still have access until the end of your billing period.",
      });
      await loadSubscriptionData(); // Refresh data
    } catch (error) {
      console.error('Failed to cancel subscription:', error);
      toast({
        title: "Error",
        description: "Failed to cancel subscription. Please try again.",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleManageBilling = async () => {
    setActionLoading('billing');
    try {
      const response = await apiService.createPortalSession();
      if (response.url) {
        window.location.href = response.url;
      }
    } catch (error) {
      console.error('Failed to create portal session:', error);
      toast({
        title: "Error",
        description: "Failed to open billing portal. Please try again.",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleUpdatePaymentMethod = async () => {
    setActionLoading('payment');
    try {
      // Create a session specifically for updating payment method
      const response = await apiService.updatePaymentMethod();
      if (response.url) {
        window.location.href = response.url;
      } else {
        // Fallback to billing portal
        await handleManageBilling();
      }
    } catch (error) {
      console.error('Failed to update payment method:', error);
      toast({
        title: "Error",
        description: "Failed to update payment method. Please try again.",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Active</Badge>;
      case 'canceled':
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Cancelled</Badge>;
      case 'past_due':
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Past Due</Badge>;
      case 'unpaid':
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Unpaid</Badge>;
      default:
        return <Badge className="bg-zinc-500/20 text-zinc-400 border-zinc-500/30">{status}</Badge>;
    }
  };

  const getTierBadge = (tier: string) => {
    const tierColors = {
      'free': 'bg-gray-500/20 text-gray-400 border-gray-500/30',
      'artist': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      'virtuoso': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      'icon': 'bg-orange-500/20 text-orange-400 border-orange-500/30'
    };
    
    return (
      <Badge className={tierColors[tier as keyof typeof tierColors] || tierColors.free}>
        <Crown className="w-3 h-3 mr-1" />
        {tier.charAt(0).toUpperCase() + tier.slice(1)}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const calculateNextPayment = (subscription: Subscription) => {
    if (!subscription || subscription.status === 'canceled') {
      return 'No upcoming payment';
    }

    const currentPeriodEnd = new Date(subscription.currentPeriodEnd);
    const now = new Date();
    
    // Check if subscription is monthly or yearly based on plan
    const planId = subscription.planId || '';
    const isYearly = planId.toLowerCase().includes('yearly') || 
                    planId.toLowerCase().includes('annual');
    
    if (currentPeriodEnd > now) {
      const timeDiff = currentPeriodEnd.getTime() - now.getTime();
      const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
      
      if (daysDiff === 1) {
        return `Tomorrow (${formatDate(subscription.currentPeriodEnd)})`;
      } else if (daysDiff <= 7) {
        return `In ${daysDiff} days (${formatDate(subscription.currentPeriodEnd)})`;
      } else {
        return `${formatDate(subscription.currentPeriodEnd)} (${isYearly ? 'Yearly' : 'Monthly'} billing)`;
      }
    }
    
    return formatDate(subscription.currentPeriodEnd);
  };

  const formatAmount = (amount: number) => {
    return `$${(amount / 100).toFixed(2)}`;
  };

  if (!isAuthenticated) {
    return (
      <div className="text-white px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="bg-gradient-to-br from-zinc-800/50 to-zinc-900/50 backdrop-blur-lg border border-orange-500/20 rounded-2xl p-8 text-center shadow-2xl shadow-orange-500/10">
            <AlertTriangle className="w-12 h-12 text-orange-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2 text-zinc-200">Authentication Required</h2>
            <p className="text-zinc-400 mb-4">Please log in to manage your subscription.</p>
            <Link href="/login">
              <Button className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white">
                Log In
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="text-white px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <LoadingSpinner size="lg" text="Loading subscription..." />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="text-white px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">
            Subscription Management
          </h1>
          {!subscription && (
            <Link href="/subscribe">
              <Button className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white">
                <Crown className="w-4 h-4 mr-2" />
                Subscribe Now
              </Button>
            </Link>
          )}
        </div>

        {/* Current Subscription */}
        <div className="bg-gradient-to-br from-zinc-800/50 to-zinc-900/50 backdrop-blur-lg border border-orange-500/20 rounded-2xl p-6 shadow-2xl shadow-orange-500/10">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-zinc-200 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-orange-400" />
              Current Subscription
            </h2>
          </div>
          
          {subscription ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-zinc-200 mb-1">{subscription.planId || 'Unknown Plan'}</h3>
                  <div className="flex items-center gap-2">
                    {getTierBadge(user?.tier || 'free')}
                    {getStatusBadge(subscription.status)}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-orange-400">
                    {user?.subscription?.plan ? (
                      user.subscription.billingPeriod === 'yearly' ? 
                        `$${user.subscription.plan === 'artist' ? '144' : 
                             user.subscription.plan === 'virtuoso' ? '239' : '479'}` :
                        `$${user.subscription.plan === 'artist' ? '12' : 
                             user.subscription.plan === 'virtuoso' ? '20' : '40'}`
                    ) : formatAmount(subscription.amount || 0)}
                  </p>
                  <p className="text-sm text-zinc-400">
                    {user?.subscription?.billingPeriod === 'yearly' ? 'per year' : 'per month'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-zinc-400" />
                    <span className="text-sm text-zinc-400">Current Period</span>
                  </div>
                  <p className="text-zinc-300">
                    {user?.subscription?.startDate && user?.subscription?.endDate ? (
                      <>
                        {formatDate(user.subscription.startDate)} - {formatDate(user.subscription.endDate)}
                        <br />
                        <span className="text-xs text-orange-400 font-medium">
                          {user.subscription.billingPeriod === 'yearly' ? 'Annual Subscription' : 'Monthly Subscription'}
                        </span>
                      </>
                    ) : subscription ? (
                      `${formatDate(subscription.currentPeriodStart)} - ${formatDate(subscription.currentPeriodEnd)}`
                    ) : (
                      'No active subscription'
                    )}
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-orange-400" />
                    <span className="text-sm text-zinc-400">Subscription Ends</span>
                  </div>
                  <p className="text-zinc-300">
                    {user?.subscription?.endDate ? (
                      <>
                        {formatDate(user.subscription.endDate)}
                        {user.subscription.status === 'active' && user.subscription.autoRenew && (
                          <span className="block text-xs text-green-400 mt-1">
                            Auto-renew enabled ({user.subscription.billingPeriod || 'monthly'})
                          </span>
                        )}
                        {user.subscription.status === 'canceled' && (
                          <span className="block text-xs text-orange-400 mt-1">
                            Will not renew
                          </span>
                        )}
                      </>
                    ) : subscription ? (
                      calculateNextPayment(subscription)
                    ) : (
                      'N/A'
                    )}
                  </p>
                </div>
              </div>

              <div className="h-px bg-gradient-to-r from-transparent via-orange-500/30 to-transparent my-6"></div>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Link href="/subscribe">
                  <Button
                    className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white"
                  >
                    <ArrowUpCircle className="w-4 h-4 mr-2" />
                    Change Plan
                  </Button>
                </Link>

                <Button
                  onClick={handleUpdatePaymentMethod}
                  disabled={actionLoading === 'payment'}
                  className="w-full bg-zinc-800/50 border border-blue-500/30 text-blue-400 hover:bg-blue-500/10 hover:border-blue-500/50"
                  variant="outline"
                >
                  {actionLoading === 'payment' ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <CreditCard className="w-4 h-4 mr-2" />
                  )}
                  Update Payment
                </Button>

                <Button
                  onClick={handleManageBilling}
                  disabled={actionLoading === 'billing'}
                  className="w-full bg-zinc-800/50 border border-green-500/30 text-green-400 hover:bg-green-500/10 hover:border-green-500/50"
                  variant="outline"
                >
                  {actionLoading === 'billing' ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Settings className="w-4 h-4 mr-2" />
                  )}
                  Manage Billing
                </Button>

                {subscription.status === 'active' && (
                  <Button
                    onClick={handleCancelSubscription}
                    disabled={actionLoading === 'cancel'}
                    className="w-full bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30 hover:border-red-500/50"
                    variant="outline"
                  >
                    {actionLoading === 'cancel' ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <XCircle className="w-4 h-4 mr-2" />
                    )}
                    Cancel
                  </Button>
                )}
              </div>

              {/* Subscription Info */}
              <div className="bg-zinc-900/50 border border-zinc-700 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-zinc-300 mb-2 flex items-center gap-2">
                  <UserCheck className="w-4 h-4" />
                  Subscription Details
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-zinc-400">Plan Type</p>
                    <p className="text-zinc-200 font-medium">
                      {(subscription.planId || '').toLowerCase().includes('yearly') ? 'Annual' : 'Monthly'} Billing
                    </p>
                  </div>
                  <div>
                    <p className="text-zinc-400">Member Since</p>
                    <p className="text-zinc-200 font-medium">
                      {formatDate(subscription.createdAt || subscription.currentPeriodStart)}
                    </p>
                  </div>
                  <div>
                    <p className="text-zinc-400">Auto-Renewal</p>
                    <p className="text-zinc-200 font-medium">
                      {subscription.status === 'canceled' ? 'Disabled' : 'Enabled'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <Crown className="w-12 h-12 text-orange-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2 text-zinc-200">No Active Subscription</h3>
              <div className="mb-4">
                <p className="text-zinc-400 mb-2">Current Tier: {getTierBadge(user?.tier || 'free')}</p>
                <p className="text-zinc-500 text-sm">
                  Subscribe to a plan to access premium features and content.
                </p>
              </div>
              <Link href="/subscribe">
                <Button className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white">
                  Browse Plans
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Billing History */}
        <div className="bg-gradient-to-br from-zinc-800/50 to-zinc-900/50 backdrop-blur-lg border border-orange-500/20 rounded-2xl p-6 shadow-2xl shadow-orange-500/10">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-zinc-200 flex items-center gap-2">
              <Download className="w-5 h-5 text-orange-400" />
              Billing History
            </h2>
          </div>
          
          {invoices.length > 0 ? (
            <div className="space-y-3">
              {invoices.map((invoice) => (
                <div
                  key={invoice.id}
                  className="flex items-center justify-between p-4 border border-orange-500/20 rounded-lg bg-zinc-800/30"
                >
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-3 h-3 rounded-full",
                      invoice.status === 'paid' ? 'bg-green-500' : 'bg-red-500'
                    )} />
                    <div>
                      <p className="font-medium text-zinc-200">
                        {formatAmount(invoice.amount)}
                      </p>
                      <p className="text-sm text-zinc-400">
                        {formatDate(invoice.createdAt)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge 
                      className={invoice.status === 'paid' ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'}
                    >
                      {invoice.status === 'paid' ? (
                        <CheckCircle className="w-3 h-3 mr-1" />
                      ) : (
                        <XCircle className="w-3 h-3 mr-1" />
                      )}
                      {invoice.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Download className="w-12 h-12 text-orange-400 mx-auto mb-4" />
              <p className="text-zinc-400">No billing history available</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
