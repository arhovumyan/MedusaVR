import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { XCircle, ArrowLeft, CreditCard } from 'lucide-react';

export default function SubscriptionCancelPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-red-100 p-3 rounded-full">
              <XCircle className="h-12 w-12 text-red-600" />
            </div>
          </div>
          <CardTitle className="text-2xl text-red-600">
            Subscription Canceled
          </CardTitle>
          <CardDescription className="text-lg">
            Your subscription process was canceled. No payment was processed.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="bg-gray-50 p-6 rounded-lg border">
            <h3 className="text-lg font-semibold mb-4">What happened?</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
                You canceled the subscription process before completing payment
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
                No charges were made to your payment method
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
                Your account remains on the free tier
              </li>
            </ul>
          </div>

          <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
            <h3 className="text-lg font-semibold mb-2 text-blue-900">
              Still interested in premium features?
            </h3>
            <p className="text-sm text-blue-800 mb-4">
              You can upgrade anytime to unlock premium AI models, unlimited messages, 
              and exclusive features.
            </p>
            <div className="space-y-2 text-sm text-blue-700">
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                <span>Secure payment processing with crypto currencies</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                <span>Cancel anytime - no long-term commitments</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                <span>7-day free trial on all plans</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button 
              onClick={() => window.location.href = '/subscribe'} 
              className="flex-1"
            >
              Try Again
            </Button>
            <Button 
              onClick={() => window.location.href = '/'} 
              variant="outline"
              className="flex-1"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </div>

          <div className="text-center text-sm text-muted-foreground">
            <p>
              Need help? Contact our support team at{' '}
              <a href="mailto:vrfans11@gmail.com" className="text-primary hover:underline">
                vrfans11@gmail.com
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
