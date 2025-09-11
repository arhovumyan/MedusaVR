import { Dialog, Transition, TransitionChild, DialogPanel, DialogTitle } from "@headlessui/react";import { Fragment, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, X, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function SignInModal({ isOpen, setIsOpen, openSignUp }: { isOpen: boolean; setIsOpen: (v: boolean) => void; openSignUp: () => void; }) {
  const { login, loginWithGoogle, isLoading } = useAuth();
  const [formData, setFormData] = useState({ emailOrUsername: '', password: '' });
  const [error, setError] = useState<string | null>(null);
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);
  const [isResending, setIsResending] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setUnverifiedEmail(null);
    try {
      await login(formData);
      setIsOpen(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed';
      setError(errorMessage);
      
      // Check if this is an email verification error
      if (errorMessage.includes('verify your email') || errorMessage.includes('verification')) {
        // Try to extract email from the error response if possible
        try {
          const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData),
          });
          const data = await response.json();
          if (data.requiresEmailVerification && data.email) {
            setUnverifiedEmail(data.email);
          }
        } catch {
          // If we can't get the email, that's ok
        }
      }
    }
  };

  const handleResendVerification = async () => {
    if (!unverifiedEmail) return;

    setIsResending(true);
    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: unverifiedEmail
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: "Verification Email Sent",
          description: "Please check your inbox for a new verification email.",
        });
        setError('Verification email sent! Please check your inbox.');
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

  const handleGoogleSignIn = async () => {
    try {
      await loginWithGoogle();
      setIsOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Google sign-in failed');
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={() => setIsOpen(false)}>
        <TransitionChild as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">        
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
        </TransitionChild>

        <div className="fixed inset-0 overflow-y-auto flex items-center justify-center px-4">
          <DialogPanel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-gradient-to-br from-zinc-800/90 to-zinc-900/90 backdrop-blur-lg border border-orange-500/20 p-6 text-white shadow-2xl shadow-orange-500/10 transition-all">
            <div className="flex justify-between items-center mb-6">
              <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">
                Sign in to MedusaVR
              </DialogTitle>
              <button 
                onClick={() => setIsOpen(false)} 
                className="w-6 h-6 rounded-full bg-transparent hover:bg-gray-500/20 flex items-center justify-center opacity-40 hover:opacity-60 transition-all duration-200 focus:outline-none"
              >
                <X className="h-2.5 w-2.5 text-gray-400" />
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl backdrop-blur-sm">
                <p className="text-red-400 text-sm">{error}</p>
                {unverifiedEmail && (
                  <div className="mt-3">
                    <Button
                      onClick={handleResendVerification}
                      disabled={isResending}
                      variant="outline"
                      size="sm"
                      className="w-full border-orange-500/30 text-orange-400 hover:bg-orange-500/10 hover:border-orange-500/50"
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
                  </div>
                )}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2 text-left">
                <Label htmlFor="emailOrUsername" className="text-zinc-200 font-medium">Email or Username</Label>
                <Input 
                  id="emailOrUsername" 
                  name="emailOrUsername" 
                  type="text" 
                  value={formData.emailOrUsername} 
                  onChange={e => setFormData({ ...formData, emailOrUsername: e.target.value })} 
                  className="bg-zinc-800/50 border-orange-500/20 focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/20 text-zinc-100 placeholder:text-zinc-400"
                  required 
                />
              </div>
              <div className="space-y-2 text-left">
                <Label htmlFor="password" className="text-zinc-200 font-medium">Password</Label>
                <Input 
                  id="password" 
                  name="password" 
                  type="password" 
                  value={formData.password} 
                  onChange={e => setFormData({ ...formData, password: e.target.value })} 
                  className="bg-zinc-800/50 border-orange-500/20 focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/20 text-zinc-100 placeholder:text-zinc-400"
                  required 
                />
              </div>
              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 transform hover:scale-105 transition-all duration-200 shadow-lg shadow-orange-500/20" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>

            <div className="my-6 text-center">
              <Button 
                variant="outline" 
                className="w-full bg-zinc-800/30 border-orange-500/30 hover:bg-orange-500/10 hover:border-orange-500/50 text-zinc-200 hover:text-orange-300" 
                onClick={handleGoogleSignIn}
              >
                Continue with Google
              </Button>
            </div>

            <p className="text-center text-sm text-zinc-400">
              Don't have an account?{' '}
              <button 
                onClick={() => { setIsOpen(false); openSignUp(); }} 
                className="text-orange-400 hover:text-orange-300 font-medium transition-colors duration-200"
              >
                Sign up
              </button>
            </p>
          </DialogPanel>
        </div>
      </Dialog>
    </Transition>
  );
}