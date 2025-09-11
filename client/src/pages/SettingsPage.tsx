// src/pages/SettingsPage.tsx
import { useState } from "react";
import { Check, MessageSquare, Coins, Info, Trash2, Edit3, AlertTriangle, Settings } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { authService } from "@/lib/auth";
import { formatCoins } from "@/lib/utils";
import { ProfilePictureUpload } from "@/components/ui/ProfilePictureUpload";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import PreferencesUpdateModal from "@/components/PreferencesUpdateModal";
import { apiService } from "@/lib/api";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

type SettingsTab = 'subscription' | 'account' | 'preferences';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('subscription');
  const { user, isAuthenticated, refreshUser, logout } = useAuth();
  const { toast } = useToast();
  
  // Username update state
  const [newUsername, setNewUsername] = useState(user?.username || '');
  const [isUpdatingUsername, setIsUpdatingUsername] = useState(false);
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  
  // Delete account state
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  
  // Cancel subscription state
  const [isCancellingSubscription, setIsCancellingSubscription] = useState(false);
  
  // Tag preference modal state
  const [showTagPreferenceModal, setShowTagPreferenceModal] = useState(false);

  // Fetch fresh user data to get current coin balance
  const { data: userProfile } = useQuery({
    queryKey: ['user', 'profile'],
    queryFn: authService.getProfile,
    enabled: isAuthenticated,
    refetchInterval: 60000, // Refetch every minute
  });

  // Use fresh data if available, fallback to cached user data
  const currentUser = userProfile || user;
  const currentCoins = currentUser?.coins || 0;

  const tabs = [
    { id: 'subscription' as SettingsTab, label: 'Subscription' },
    { id: 'account' as SettingsTab, label: 'Account' },
    { id: 'preferences' as SettingsTab, label: 'Preferences' },
  ];

  const handleUsernameUpdate = async () => {
    if (!user?.id || !newUsername.trim()) return;
    
    if (newUsername === user.username) {
      setIsEditingUsername(false);
      return;
    }

    setIsUpdatingUsername(true);
    try {
      const response = await apiRequest('PUT', `/api/users/${user.id}`, {
        username: newUsername.trim()
      });

      if (response.ok) {
        const data = await response.json();
        toast({
          title: "Success",
          description: "Username updated successfully",
        });
        await refreshUser(); // Refresh user data
        setIsEditingUsername(false);
      } else {
        const errorData = await response.json();
        toast({
          title: "Error",
          description: errorData.message || "Failed to update username",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Username update error:', error);
      toast({
        title: "Error",
        description: "Failed to update username",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingUsername(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user?.id) return;

    setIsDeletingAccount(true);
    try {
      const response = await apiRequest('DELETE', `/api/users/${user.id}`);

      if (response.ok) {
        toast({
          title: "Account Deleted",
          description: "Your account has been permanently deleted",
        });
        
        // Logout and redirect to home
        logout();
        window.location.href = '/';
      } else {
        const errorData = await response.json();
        toast({
          title: "Error",
          description: errorData.message || "Failed to delete account",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Account deletion error:', error);
      toast({
        title: "Error",
        description: "Failed to delete account",
        variant: "destructive",
      });
    } finally {
      setIsDeletingAccount(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!user?.id) return;

    setIsCancellingSubscription(true);
    try {
      const response = await apiRequest('POST', `/api/users/${user.id}/cancel-subscription`);

      if (response.ok) {
        toast({
          title: "Subscription Cancelled",
          description: "Your subscription has been cancelled and you've been moved to the free tier",
        });
        
        // Refresh user data to show updated tier
        await refreshUser();
      } else {
        const errorData = await response.json();
        toast({
          title: "Error",
          description: errorData.message || "Failed to cancel subscription",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Subscription cancellation error:', error);
      toast({
        title: "Error",
        description: "Failed to cancel subscription",
        variant: "destructive",
      });
    } finally {
      setIsCancellingSubscription(false);
    }
  };

  const handleTagPreferencesSave = async (selectedTags: string[]) => {
    try {
      await apiService.updateUserPreferences({
        selectedTags,
      });
      
      toast({
        title: "Success",
        description: "Your tag preferences have been updated",
      });
      
      // Refresh user data to get updated preferences
      await refreshUser();
      setShowTagPreferenceModal(false);
    } catch (error) {
      console.error('Tag preferences update error:', error);
      toast({
        title: "Error",
        description: "Failed to update tag preferences",
        variant: "destructive",
      });
    }
  };

  const renderSubscriptionTab = () => {
    const userTier = currentUser?.tier || 'free';
    const tierDisplayName = userTier.charAt(0).toUpperCase() + userTier.slice(1);
    const isFreeTier = userTier === 'free';
    
    return (
      <div className="space-y-6 sm:space-y-8">
        {/* Your Plan Section */}
        <div className="bg-zinc-800/50 backdrop-blur-sm border border-orange-500/20 rounded-lg p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-4">
            <div>
              <h2 className="text-lg sm:text-xl font-semibold text-orange-200 mb-2">Your Plan</h2>
              <p className="text-zinc-300 text-sm sm:text-base">
                You are on the <span className={`font-medium ${isFreeTier ? 'text-zinc-400' : 'text-orange-400'}`}>{tierDisplayName}</span> plan.
              </p>
            </div>
          <div className="text-left sm:text-right">
            <div className="flex items-center text-zinc-400 text-sm mb-1">
              <MessageSquare className="w-4 h-4 mr-1" />
              Usage
            </div>
            <div className="text-xl sm:text-2xl font-bold text-orange-200">0 / 0</div>
          </div>
        </div>

        {/* Plan Features */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 mb-4 sm:mb-6">
          {[
            "Unlimited character interactions",
            "Basic character creation",
            "Community features",
            "Standard support"
          ].map((feature, index) => (
            <div key={index} className="flex items-center text-sm sm:text-base text-zinc-300">
              <Check className="w-4 h-4 text-green-400 mr-2 shrink-0" />
              {feature}
            </div>
          ))}
        </div>

        <Link href="/subscribe">
          <Button 
            variant="outline" 
            className="border-orange-500/30 text-orange-400 hover:bg-orange-500/10 hover:border-orange-500/50 transition-all duration-200 cursor-pointer"
          >
            Upgrade Plan
          </Button>
        </Link>
        
        {/* Cancel Subscription Button - only show if user has a paid tier */}
        {!isFreeTier && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button 
                variant="outline" 
                className="border-red-500/30 text-red-400 hover:bg-red-500/10 hover:border-red-500/50 transition-all duration-200 cursor-pointer bg-red-500/5"
              >
                Cancel Current Plan
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-zinc-800 border border-red-500/20">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-red-400">Cancel Subscription</AlertDialogTitle>
                <AlertDialogDescription className="text-zinc-300">
                  Are you sure you want to cancel your {tierDisplayName} subscription? 
                  You will lose access to premium features and be moved to the free tier immediately.
                  This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="border-zinc-600 text-zinc-300 hover:bg-zinc-700">
                  Keep Subscription
                </AlertDialogCancel>
                <AlertDialogAction 
                  onClick={handleCancelSubscription}
                  disabled={isCancellingSubscription}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  {isCancellingSubscription ? "Cancelling..." : "Yes, Cancel Subscription"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

      {/* Coins Section */}
      <div className="bg-zinc-800/50 backdrop-blur-sm border border-orange-500/20 rounded-lg p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-4">
          <div>
            <h2 className="text-lg sm:text-xl font-semibold text-orange-200 mb-2">Coins</h2>
            <p className="text-zinc-300 text-sm sm:text-base">
              Use coins for premium features and character interactions.
            </p>
          </div>
          <div className="text-left sm:text-right">
            <div className="flex items-center text-zinc-400 text-sm mb-1">
              <Coins className="w-4 h-4 mr-1" />
              Current Balance
            </div>
            <div className="text-xl sm:text-2xl font-bold text-yellow-400">{formatCoins(currentCoins)}</div>
          </div>
        </div>

        <Link href="/coins">
          <Button 
            variant="outline" 
            className="border-orange-500/30 text-orange-400 hover:bg-orange-500/10 hover:border-orange-500/50 transition-all duration-200 cursor-pointer"
          >
            Get more coins
          </Button>
        </Link>
      </div>
    </div>
    );
  };

  const renderAccountTab = () => (
    <div className="bg-zinc-800/50 backdrop-blur-sm border border-orange-500/20 rounded-lg p-4 sm:p-6">
      <h2 className="text-lg sm:text-xl font-semibold text-orange-200 mb-4 sm:mb-6">Account Information</h2>
      <div className="space-y-4 sm:space-y-6">
        {/* Profile Picture Section */}
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-4">Profile Picture</label>
          <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
            <ProfilePictureUpload 
              currentAvatarUrl={user?.avatarUrl}
              onAvatarUpdate={async (newAvatarUrl) => {
                console.log('Avatar updated in settings:', newAvatarUrl);
                // Refresh user data to show the new avatar
                await refreshUser();
              }}
            />
            <div className="text-xs sm:text-sm text-zinc-400">
              <p>Click on your avatar to upload a new profile picture.</p>
              <p>Supported formats: JPG, PNG, GIF (max 5MB)</p>
            </div>
          </div>
        </div>
        
        {/* Username Section */}
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">Username</label>
          {isEditingUsername ? (
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <Input
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                className="bg-zinc-700/50 border-orange-500/20 text-zinc-200 flex-1"
                placeholder="Enter new username"
                minLength={3}
                maxLength={30}
              />
              <div className="flex gap-2">
                <Button
                  onClick={handleUsernameUpdate}
                  disabled={isUpdatingUsername || !newUsername.trim() || newUsername === user?.username}
                  size="sm"
                  className="bg-orange-500 hover:bg-orange-600 text-white"
                >
                  {isUpdatingUsername ? "Saving..." : "Save"}
                </Button>
                <Button
                  onClick={() => {
                    setIsEditingUsername(false);
                    setNewUsername(user?.username || '');
                  }}
                  variant="outline"
                  size="sm"
                  className="border-zinc-600 text-zinc-300 hover:bg-zinc-700"
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between bg-zinc-700/50 border border-orange-500/20 rounded-lg p-3">
              <span className="text-zinc-200 text-sm sm:text-base">
                {user?.username || 'Not set'}
              </span>
              <Button
                onClick={() => setIsEditingUsername(true)}
                variant="ghost"
                size="sm"
                className="text-orange-400 hover:text-orange-300 hover:bg-orange-500/10"
              >
                <Edit3 className="w-4 h-4 mr-1" />
                Edit
              </Button>
            </div>
          )}
          <p className="text-xs text-zinc-500 mt-1">Username must be 3-30 characters long</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">Email</label>
          <div className="bg-zinc-700/50 border border-orange-500/20 rounded-lg p-3 text-zinc-200 text-sm sm:text-base">
            {user?.email || 'Not set'}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">Member Since</label>
          <div className="bg-zinc-700/50 border border-orange-500/20 rounded-lg p-3 text-zinc-200 text-sm sm:text-base">
            {currentUser?.createdAt ? new Date(currentUser.createdAt).toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            }) : 'Unknown'}
          </div>
        </div>

        {/* Danger Zone */}
        <div className="border-t border-red-500/20 pt-6 mt-8">
          <h3 className="text-lg font-semibold text-red-400 mb-4">Danger Zone</h3>
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5 shrink-0" />
              <div className="flex-1">
                <h4 className="text-sm font-medium text-red-300 mb-2">Delete Account</h4>
                <p className="text-xs text-red-200/80 mb-4">
                  This action cannot be undone. This will permanently delete your account, 
                  all your characters, conversations, and remove all associated data.
                </p>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button 
                      variant="destructive" 
                      size="sm"
                      className="bg-red-600 hover:bg-red-700 text-white"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Account
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="bg-zinc-900 border-red-500/20">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-red-400">Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription className="text-zinc-300">
                        This action cannot be undone. This will permanently delete your account
                        and remove all your data from our servers, including:
                        <ul className="list-disc list-inside mt-2 space-y-1">
                          <li>Your profile and account information</li>
                          <li>All characters you've created</li>
                          <li>All conversations and chat history</li>
                          <li>Your followers and following relationships</li>
                        </ul>
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="border-zinc-600 text-zinc-300 hover:bg-zinc-700">
                        Cancel
                      </AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={handleDeleteAccount}
                        disabled={isDeletingAccount}
                        className="bg-red-600 hover:bg-red-700 text-white"
                      >
                        {isDeletingAccount ? "Deleting..." : "Delete Account"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderPreferencesTab = () => (
    <div className="bg-zinc-800/50 backdrop-blur-sm border border-orange-500/20 rounded-lg p-6">
      <h2 className="text-xl font-semibold text-orange-200 mb-6">Preferences</h2>
      
      <div className="space-y-6">
        {/* Tag Preferences Section */}
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-medium text-orange-200 mb-2">Content Preferences</h3>
            <p className="text-sm text-zinc-400 mb-4">
              Select your preferred tags to personalize your experience and see characters that match your interests.
            </p>
          </div>

          {/* Current preferences display */}
          <div className="bg-zinc-700/50 border border-orange-500/20 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-zinc-300">Current Preferences</h4>
              <Button
                onClick={() => setShowTagPreferenceModal(true)}
                variant="outline"
                size="sm"
                className="border-orange-500/30 text-orange-400 hover:bg-orange-500/10 hover:border-orange-500/50"
              >
                <Settings className="w-4 h-4 mr-2" />
                Edit Preferences
              </Button>
            </div>
            
            {user?.preferences?.selectedTags && user.preferences.selectedTags.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {user.preferences.selectedTags.map((tag, index) => (
                  <span
                    key={tag}
                    className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-orange-500/20 text-orange-300 border border-orange-500/30"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Info className="w-12 h-12 text-zinc-500 mx-auto mb-3" />
                <p className="text-zinc-400 text-sm mb-3">No preferences set yet</p>
                <Button
                  onClick={() => setShowTagPreferenceModal(true)}
                  className="bg-orange-500 hover:bg-orange-600 text-white"
                >
                  Set Your Preferences
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );



  return (
    <div className="min-h-screen pt-8 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl sm:text-3xl font-bold text-orange-200 mb-6 sm:mb-8">Settings</h1>
        
        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-1 sm:gap-2 mb-6 sm:mb-8 bg-zinc-800/30 backdrop-blur-sm rounded-lg p-1 border border-orange-500/20 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                px-2 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-all duration-200 cursor-pointer whitespace-nowrap
                ${activeTab === tab.id
                  ? 'bg-zinc-700/80 text-orange-200 shadow-lg'
                  : 'text-zinc-400 hover:text-orange-300 hover:bg-zinc-700/40'
                }
              `}
            >
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">
                {tab.id === 'subscription' && 'Sub'}
                {tab.id === 'account' && 'Account'}
                {tab.id === 'preferences' && 'Prefs'}
              </span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="mb-8">
          {activeTab === 'subscription' && renderSubscriptionTab()}
          {activeTab === 'account' && renderAccountTab()}
          {activeTab === 'preferences' && renderPreferencesTab()}
        </div>
      </div>

      {/* Preferences Update Modal */}
      <PreferencesUpdateModal
        isOpen={showTagPreferenceModal}
        setIsOpen={setShowTagPreferenceModal}
        onSave={handleTagPreferencesSave}
        initialSelectedTags={user?.preferences?.selectedTags || []}
      />
    </div>
  );
}
