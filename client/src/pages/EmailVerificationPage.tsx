import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, XCircle, Loader2, Mail, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface VerificationResult {
  success: boolean;
  message: string;
  user?: {
    id: string;
    email: string;
    username: string;
    verified: boolean;
  };
}

export default function EmailVerificationPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [verificationStatus, setVerificationStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [isResending, setIsResending] = useState(false);

  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setVerificationStatus('error');
      setVerificationResult({
        success: false,
        message: 'No verification token provided. Please check your email link.'
      });
      return;
    }

    verifyEmail(token);
  }, [token]);

  const verifyEmail = async (verificationToken: string) => {
    try {
      const response = await fetch(`/api/auth/verify-email?token=${verificationToken}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result: VerificationResult = await response.json();
      setVerificationResult(result);

      if (result.success) {
        setVerificationStatus('success');
        toast({
          title: "Email Verified Successfully!",
          description: "Your account is now active. You can log in to start using MedusaVR.",
        });
      } else {
        setVerificationStatus('error');
        toast({
          title: "Verification Failed",
          description: result.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Email verification error:', error);
      setVerificationStatus('error');
      setVerificationResult({
        success: false,
        message: 'An error occurred while verifying your email. Please try again.'
      });
      toast({
        title: "Verification Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleResendVerification = async () => {
    if (!verificationResult?.user?.email) return;

    setIsResending(true);
    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: verificationResult.user.email
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: "Verification Email Sent",
          description: "Please check your inbox for a new verification email.",
        });
      } else {
        toast({
          title: "Failed to Resend",
          description: result.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Resend verification error:', error);
      toast({
        title: "Error",
        description: "Failed to resend verification email. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsResending(false);
    }
  };

  const handleLoginRedirect = () => {
    navigate('/', { replace: true });
  };

  const handleBackToHome = () => {
    navigate('/', { replace: true });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-gray-800/50 border-gray-700 backdrop-blur-lg">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto mb-4 flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-orange-500 to-red-500">
            {verificationStatus === 'loading' && <Loader2 className="h-8 w-8 text-white animate-spin" />}
            {verificationStatus === 'success' && <CheckCircle className="h-8 w-8 text-white" />}
            {verificationStatus === 'error' && <XCircle className="h-8 w-8 text-white" />}
          </div>
          
          <CardTitle className="text-2xl font-bold text-white">
            {verificationStatus === 'loading' && 'Verifying Your Email...'}
            {verificationStatus === 'success' && 'Email Verified!'}
            {verificationStatus === 'error' && 'Verification Failed'}
          </CardTitle>
          
          <CardDescription className="text-gray-300">
            {verificationStatus === 'loading' && 'Please wait while we verify your email address.'}
            {verificationStatus === 'success' && 'Your account is now active and ready to use.'}
            {verificationStatus === 'error' && 'We encountered an issue verifying your email.'}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {verificationResult && (
            <div className={`p-4 rounded-lg border ${
              verificationResult.success 
                ? 'bg-green-500/10 border-green-500/20 text-green-400' 
                : 'bg-red-500/10 border-red-500/20 text-red-400'
            }`}>
              <p className="text-sm">{verificationResult.message}</p>
            </div>
          )}

          {verificationStatus === 'success' && (
            <div className="space-y-3">
              <Button 
                onClick={handleLoginRedirect}
                className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold"
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Continue to Login
              </Button>
            </div>
          )}

          {verificationStatus === 'error' && (
            <div className="space-y-3">
              {verificationResult?.user?.email && (
                <Button 
                  onClick={handleResendVerification}
                  disabled={isResending}
                  variant="outline"
                  className="w-full border-gray-600 text-gray-300 hover:bg-gray-700"
                >
                  {isResending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Mail className="mr-2 h-4 w-4" />
                      Resend Verification Email
                    </>
                  )}
                </Button>
              )}
              
              <Button 
                onClick={handleBackToHome}
                variant="ghost"
                className="w-full text-gray-400 hover:text-white hover:bg-gray-700"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Home
              </Button>
            </div>
          )}

          {verificationStatus === 'loading' && (
            <div className="flex justify-center">
              <Button 
                onClick={handleBackToHome}
                variant="ghost"
                className="text-gray-400 hover:text-white hover:bg-gray-700"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Home
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}