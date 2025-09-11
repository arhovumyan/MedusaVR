
import { Dialog, Transition, TransitionChild, DialogPanel, DialogTitle } from "@headlessui/react";
import { Fragment, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function SignUpModal({ isOpen, setIsOpen, openSignIn }: { isOpen: boolean; setIsOpen: (v: boolean) => void; openSignIn: () => void; }) {
  const { register, registerWithGoogle, isLoading } = useAuth();
  const [formData, setFormData] = useState({ email: '', username: '', password: '', confirmPassword: '' });
  const [error, setError] = useState<string | null>(null);
  const [isLoading2, setIsLoading2] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading2(true);
    
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match'); 
      setIsLoading2(false);
      return;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters'); 
      setIsLoading2(false);
      return;
    }
    
    try {
      // Use the auth hook's register function which handles CSRF and proper auth flow
      await register({
        email: formData.email,
        username: formData.username,
        password: formData.password
      });
      
      // Close modal and show success message
      setIsOpen(false);
      
      toast({
        title: "Account Created Successfully!",
        description: "Welcome to MedusaVR! You're now logged in.",
      });
      
      // Clear form
      setFormData({ email: '', username: '', password: '', confirmPassword: '' });
      
    } catch (err: any) {
      console.error('Registration error:', err);
      setError(err.message || 'Registration failed');
    } finally {
      setIsLoading2(false);
    }
  };

  const handleGoogleSignUp = async () => {
    try {
      await registerWithGoogle();
      
      // Just close the modal after successful Google registration
      // OnboardingCheck will handle showing preferences modal
      setIsOpen(false);
      
      // Reset form state
      setFormData({ email: '', username: '', password: '', confirmPassword: '' });
      setError(null);
      toast({
        title: "Welcome to MedusaVR!",
        description: "Here are 15 free coins to get you started.",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Google sign-up failed');
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setFormData({ email: '', username: '', password: '', confirmPassword: '' });
    setError(null);
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleClose}>
        <TransitionChild
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" />
        </TransitionChild>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <TransitionChild
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <DialogPanel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-gradient-to-br from-zinc-800/90 to-zinc-900/90 backdrop-blur-lg border border-orange-500/20 p-6 text-white shadow-2xl shadow-orange-500/10 transition-all">
                <div className="flex justify-between items-center mb-6">
                  <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">
                    Create Your Account
                  </DialogTitle>
                  <button 
                    onClick={handleClose} 
                    className="w-6 h-6 rounded-full bg-transparent hover:bg-gray-500/20 flex items-center justify-center opacity-40 hover:opacity-60 transition-all duration-200 focus:outline-none"
                  >
                    <X className="h-2.5 w-2.5 text-gray-400" />
                  </button>
                </div>

                {error && (
                  <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl backdrop-blur-sm">
                    <p className="text-red-400 text-sm">{error}</p>
                  </div>
                )}

                {/* Always show signup form - email verification modal removed */}
                  <>
                    <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2 text-left">
                    <Label htmlFor="email" className="text-zinc-200 font-medium">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="bg-zinc-800/50 border-orange-500/20 focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/20 text-zinc-100 placeholder:text-zinc-400"
                      placeholder="Enter your email"
                      required
                    />
                  </div>

                  <div className="space-y-2 text-left">
                    <Label htmlFor="username" className="text-zinc-200 font-medium">Username</Label>
                    <Input
                      id="username"
                      type="text"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      className="bg-zinc-800/50 border-orange-500/20 focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/20 text-zinc-100 placeholder:text-zinc-400"
                      placeholder="Choose a username"
                      required
                    />
                  </div>

                  <div className="space-y-2 text-left">
                    <Label htmlFor="password" className="text-zinc-200 font-medium">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="bg-zinc-800/50 border-orange-500/20 focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/20 text-zinc-100 placeholder:text-zinc-400"
                      placeholder="Create a strong password"
                      required
                    />
                  </div>

                  <div className="space-y-2 text-left">
                    <Label htmlFor="confirmPassword" className="text-zinc-200 font-medium">Confirm Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      className="bg-zinc-800/50 border-orange-500/20 focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/20 text-zinc-100 placeholder:text-zinc-400"
                      placeholder="Confirm your password"
                      required
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={isLoading || isLoading2}
                    className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 transform hover:scale-105 transition-all duration-200 shadow-lg shadow-orange-500/20"
                  >
                    {(isLoading || isLoading2) ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating Account...
                      </>
                    ) : (
                      'Create Account'
                    )}
                  </Button>
                </form>

                <div className="my-6 text-center">
                  <Button
                    variant="outline"
                    className="w-full bg-zinc-800/30 border-orange-500/30 hover:bg-orange-500/10 hover:border-orange-500/50 text-zinc-200 hover:text-orange-300"
                    onClick={handleGoogleSignUp}
                  >
                    Continue with Google
                  </Button>
                </div>

                    <p className="text-center text-sm text-zinc-400">
                      Already have an account?{' '}
                      <button
                        onClick={() => { setIsOpen(false); openSignIn(); }}
                        className="text-orange-400 hover:text-orange-300 font-medium transition-colors duration-200"
                      >
                        Sign in
                      </button>
                    </p>
                  </>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
