import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { XCircle, ArrowLeft, RefreshCw } from 'lucide-react';

export default function PaymentCancelPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 flex items-center justify-center px-4">
      <Card className="w-full max-w-md bg-zinc-800/50 border-red-500/30 shadow-2xl shadow-red-500/10 backdrop-blur-sm">
        <CardHeader className="text-center pb-6">
          <div className="relative mx-auto mb-6 w-fit">
            <div className="absolute inset-0 bg-red-500 rounded-full blur-lg opacity-30"></div>
            <div className="relative p-4 bg-gradient-to-r from-red-500 to-rose-500 rounded-full">
              <XCircle className="w-12 h-12 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-red-400 mb-2">
            Payment Canceled
          </CardTitle>
          <p className="text-zinc-300">
            Your payment was canceled. No charges were made to your account.
          </p>
        </CardHeader>

        <CardContent className="text-center space-y-6">
          <div className="p-4 bg-zinc-700/50 rounded-lg border border-zinc-600">
            <p className="text-sm text-zinc-400">
              You can try again anytime. Your cart will be waiting for you.
            </p>
          </div>

          <div className="space-y-3">
            <Button
              onClick={() => navigate('/coins')}
              className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-semibold shadow-lg shadow-orange-500/20"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
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
