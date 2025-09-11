import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Coins, ArrowLeft } from 'lucide-react';

export default function PaymentSuccessPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [provider, setProvider] = useState<string>('crypto');

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const session_id = params.get('session_id');
    const orderId = params.get('orderId');
    const paymentProvider = params.get('provider') || 'crypto';
    
    setSessionId(session_id || orderId);
    setProvider(paymentProvider);
    
    if (session_id || orderId) {
      console.log('🎉 Payment successful!', { sessionId: session_id, orderId, provider: paymentProvider });
      // You could verify the payment here by calling your backend
    }
  }, [location]);

  const isCrypto = provider === 'crypto';
  const isTrustPay = provider === 'trustpay';

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 flex items-center justify-center px-4">
      <Card className="w-full max-w-md bg-zinc-800/50 border-green-500/30 shadow-2xl shadow-green-500/10 backdrop-blur-sm">
        <CardHeader className="text-center pb-6">
          <div className="relative mx-auto mb-6 w-fit">
            <div className="absolute inset-0 bg-green-500 rounded-full blur-lg opacity-30"></div>
            <div className="relative p-4 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full">
              <CheckCircle className="w-12 h-12 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-green-400 mb-2">
            {isTrustPay ? 'Payment Successful!' : 'Payment Initiated!'}
          </CardTitle>
          <p className="text-zinc-300">
            {isTrustPay 
              ? 'Your credit card payment was successful. Coins have been added to your account!'
              : 'Your crypto payment has been initiated. Coins will be credited automatically once confirmed.'
            }
          </p>
        </CardHeader>

        <CardContent className="text-center space-y-6">
          {sessionId && (
            <div className="p-4 bg-zinc-700/50 rounded-lg border border-zinc-600">
              <p className="text-sm text-zinc-400 mb-2">
                {isTrustPay ? 'Transaction ID' : 'Order ID'}
              </p>
              <p className="text-xs font-mono text-zinc-300 break-all">{sessionId}</p>
            </div>
          )}

          {isCrypto && (
            <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <p className="text-blue-400 text-sm">
                💡 Blockchain confirmations can take a few minutes. Your coins will appear automatically once confirmed.
              </p>
            </div>
          )}

          {isTrustPay && (
            <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
              <p className="text-green-400 text-sm">
                ✅ Payment processed instantly! Your coins are ready to use.
              </p>
            </div>
          )}

          <div className="flex items-center justify-center space-x-2 text-lg font-semibold text-emerald-400">
            <Coins className="w-6 h-6" />
            <span>{isTrustPay ? 'Coins added successfully!' : 'Processing payment...'}</span>
          </div>

          <div className="space-y-3">
            <Button
              onClick={() => navigate('/coins')}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold shadow-lg shadow-green-500/20"
            >
              <Coins className="w-4 h-4 mr-2" />
              View My Coins
            </Button>
            
            <Button
              onClick={() => navigate('/')}
              variant="outline"
              className="w-full border-zinc-600 text-zinc-300 hover:bg-zinc-700/50 hover:border-zinc-500"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
