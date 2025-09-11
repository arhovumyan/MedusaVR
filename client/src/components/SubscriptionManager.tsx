import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/useAuth';
import { apiService } from '@/lib/api';
import type { Subscription } from '@shared/api-types';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import {
  Crown,
  Calendar,
  DollarSign,
  CreditCard,
  ExternalLink,
  Loader2,
  AlertTriangle
} from 'lucide-react';

interface SubscriptionManagerProps {
  onUpgrade?: () => void;
}

export default function SubscriptionManager({ onUpgrade }: SubscriptionManagerProps) {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [hasSubscription, setHasSubscription] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      fetchSubscriptionStatus();
    }
  }, [isAuthenticated]);

  const fetchSubscriptionStatus = async () => {
    try {
      setLoading(true);
      const response = await apiService.getSubscriptionStatus();
      setHasSubscription(!!response.subscription);
      setSubscription(response.subscription);
    } catch (error) {
      console.error('Error fetching subscription status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    try {
      setActionLoading(true);
      const response = await apiService.createPortalSession();
      window.open(response.url, '_blank');
    } catch (error) {
      console.error('Error opening customer portal:', error);
      alert('Failed to open subscription management portal');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!confirm('Are you sure you want to cancel your subscription?')) {
      return;
    }

    try {
      setActionLoading(true);
      await apiService.cancelSubscription();
      await fetchSubscriptionStatus();
      alert('Subscription canceled successfully');
    } catch (error) {
      console.error('Error canceling subscription:', error);
      alert('Failed to cancel subscription');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusColors = {
      active: 'bg-green-500',
      trialing: 'bg-blue-500',
      past_due: 'bg-yellow-500',
      canceled: 'bg-red-500',
      unpaid: 'bg-orange-500',
    };

    return (
      <Badge className={statusColors[status as keyof typeof statusColors] || 'bg-gray-500'}>
        {status.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  const getPlanIcon = (planId: string) => {
    const icons = {
      premium: '⭐',
      deluxe: '🚀',
      elite: '👑',
    };
    return icons[planId as keyof typeof icons] || '📦';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (!isAuthenticated) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">
            Please sign in to view your subscription
          </p>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center">
            <LoadingSpinner size="sm" text="Loading subscription..." />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!hasSubscription || !subscription) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Active Subscription</CardTitle>
          <CardDescription>
            You don't have an active subscription. Upgrade to unlock premium features!
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={onUpgrade} className="w-full">
            <Crown className="mr-2 h-4 w-4" />
            Upgrade to Premium
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Subscription */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">{getPlanIcon(subscription.planId)}</span>
                {subscription.planId?.charAt(0).toUpperCase() + subscription.planId?.slice(1)} Plan
              </CardTitle>
              <CardDescription>Your current subscription plan</CardDescription>
            </div>
            {getStatusBadge(subscription.status)}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Current Period</p>
                <p className="text-sm text-muted-foreground">
                  {formatDate(subscription.currentPeriodStart)} - {formatDate(subscription.currentPeriodEnd)}
                </p>
              </div>
            </div>

            {subscription.nextBillingDate && (
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Next Billing</p>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(subscription.nextBillingDate)}
                  </p>
                </div>
              </div>
            )}
          </div>

          {subscription.cancelAtPeriodEnd && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                Your subscription will be canceled at the end of the current period ({formatDate(subscription.currentPeriodEnd)}).
              </p>
            </div>
          )}

          <div className="flex gap-2">
            <Button
              onClick={handleManageSubscription}
              disabled={actionLoading}
              variant="outline"
              className="flex-1"
            >
              {actionLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <ExternalLink className="mr-2 h-4 w-4" />
              )}
              Manage Subscription
            </Button>

            {subscription.status === 'active' && !subscription.cancelAtPeriodEnd && (
              <Button
                onClick={handleCancelSubscription}
                disabled={actionLoading}
                variant="destructive"
              >
                Cancel
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Current Usage */}
      <Card>
        <CardHeader>
          <CardTitle>Usage & Benefits</CardTitle>
          <CardDescription>Your current plan benefits</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm">Coins Balance</span>
              <Badge variant="secondary">{user?.coins || 0} coins</Badge>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm">Plan Tier</span>
              <Badge>{subscription.planId}</Badge>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm">Monthly Coin Allowance</span>
              <span className="text-sm text-muted-foreground">
                {subscription.planId === 'premium' && '400 coins'}
                {subscription.planId === 'deluxe' && '1,200 coins'}
                {subscription.planId === 'elite' && '3,000 coins'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
