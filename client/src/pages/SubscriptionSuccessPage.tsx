import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Loader2, Crown } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export default function SubscriptionSuccessPage() {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { refreshUser } = useAuth();
  
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    if (sessionId) {
      // Refresh user data to get updated subscription info
      const refreshData = async () => {
        try {
          await refreshUser();
          setLoading(false);
        } catch (err) {
          setError('Failed to update subscription status');
          setLoading(false);
        }
      };

      // Wait a moment for payment processing
      setTimeout(refreshData, 2000);
    } else {
      setError('Invalid session');
      setLoading(false);
    }
  }, [sessionId, refreshUser]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
              <h2 className="text-xl font-semibold mb-2">Processing your subscription...</h2>
              <p className="text-muted-foreground">
                Please wait while we confirm your payment and activate your subscription.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-red-600">Subscription Error</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => window.location.href = '/settings?tab=subscription'} 
              className="w-full"
            >
              Go to Settings
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-green-100 p-3 rounded-full">
              <CheckCircle className="h-12 w-12 text-green-600" />
            </div>
          </div>
          <CardTitle className="text-2xl text-green-600">
            Subscription Activated!
          </CardTitle>
          <CardDescription className="text-lg">
            Welcome to MedusaVR Premium! Your subscription has been successfully activated.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-lg border">
            <div className="flex items-center gap-3 mb-4">
              <Crown className="h-6 w-6 text-purple-600" />
              <h3 className="text-lg font-semibold">What's Next?</h3>
            </div>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                Your monthly coins have been added to your account
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                Premium features are now unlocked
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                Access to NSFW content and premium models
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                Chat history is now saved automatically
              </li>
            </ul>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button 
              onClick={() => window.location.href = '/chat'} 
              className="flex-1"
            >
              Start Chatting
            </Button>
            <Button 
              onClick={() => window.location.href = '/settings?tab=subscription'} 
              variant="outline"
              className="flex-1"
            >
              Manage Subscription
            </Button>
          </div>

          <div className="text-center text-sm text-muted-foreground">
            <p>
              You will receive a confirmation email shortly. 
              You can manage your subscription anytime in your settings.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
