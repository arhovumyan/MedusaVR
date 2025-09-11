// src/app/UserProfile.jsx 
import React, { useState, useEffect } from 'react';
import { useParams } from 'wouter';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from "wouter";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserPlus, UserMinus, Users, UserCheck, Coins } from 'lucide-react';
import Cards from "@/components/ui/cards";
import { useAuth } from '@/hooks/useAuth';
import { authService } from '@/lib/auth';
import { apiRequest } from '@/lib/queryClient';
import { BrandingFooter } from "@/components/layout/BrandingFooter";
import { ProfilePictureUpload } from "@/components/ui/ProfilePictureUpload";
import type { Character, User } from '@shared/api-types';

import {
  Copy,
  Settings,
  Plus,
  Edit,
  Crown,
  Calendar,
} from "lucide-react";

const defaultAvatar = "/placeholder-avatar.png";

const UserProfilePage = () => {
  const { user, isAuthenticated, refreshUser } = useAuth();
  const { id: profileUserId } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState('Characters');
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const queryClient = useQueryClient();

  // Determine if viewing own profile or another user's profile
  const isOwnProfile = !profileUserId || profileUserId === user?.id;
  const targetUserId = profileUserId || user?.id;

  // If no ID provided and user is authenticated, redirect to user's own profile
  useEffect(() => {
    if (!profileUserId && user?.id) {
      // Use history.replaceState to update the URL without triggering a navigation
      window.history.replaceState(null, '', `/user-profile/${user.id}`);
    }
  }, [profileUserId, user?.id]);

  // Validate that we have a proper user ID before making API calls
  const hasValidUserId = Boolean(targetUserId && targetUserId !== 'undefined' && targetUserId !== ':id');

  // Fetch fresh user data to get current coin balance
  const { data: userProfile } = useQuery({
    queryKey: ['user', 'profile'],
    queryFn: authService.getProfile,
    enabled: isAuthenticated,
    refetchInterval: 60000, // Refetch every minute
  });

  // Fetch target user data if viewing another user's profile
  const { data: targetUser } = useQuery<User | null>({
    queryKey: ['user', targetUserId],
    queryFn: async () => {
      if (isOwnProfile) return userProfile || user;
      if (!hasValidUserId) return null;
      const response = await apiRequest('GET', `/api/users/${targetUserId}`);
      return await response.json() as User;
    },
    enabled: hasValidUserId,
  });

  // Fetch user's created characters
  const { data: userCharacters = [], isLoading: charactersLoading } = useQuery<Character[]>({
    queryKey: ['user-characters', targetUserId],
    queryFn: async () => {
      if (!hasValidUserId) return [];
      const response = await apiRequest('GET', `/api/characters/creator/${targetUserId}`);
      return await response.json() as Character[];
    },
    enabled: hasValidUserId,
  });

  // Fetch followers
  const { data: followersData, isLoading: followersLoading } = useQuery<{data: User[]}>({
    queryKey: ['user-followers', targetUserId],
    queryFn: async () => {
      if (!hasValidUserId) return { data: [] };
      const response = await apiRequest('GET', `/api/follows/users/${targetUserId}/followers`);
      return await response.json() as {data: User[]};
    },
    enabled: hasValidUserId,
  });

  // Fetch following
  const { data: followingData, isLoading: followingLoading } = useQuery<{data: User[]}>({
    queryKey: ['user-following', targetUserId],
    queryFn: async () => {
      if (!hasValidUserId) return { data: [] };
      const response = await apiRequest('GET', `/api/follows/users/${targetUserId}/following`);
      return await response.json() as {data: User[]};
    },
    enabled: hasValidUserId,
  });

  // Check follow status if viewing another user's profile
  const { data: followStatusData } = useQuery<{isFollowing: boolean}>({
    queryKey: ['follow-status', targetUserId],
    queryFn: async () => {
      if (!hasValidUserId || isOwnProfile) return { isFollowing: false };
      const response = await apiRequest('GET', `/api/follows/users/${targetUserId}/follow-status`);
      return await response.json() as {isFollowing: boolean};
    },
    enabled: hasValidUserId && !isOwnProfile && isAuthenticated,
  });

  // Update follow state when data changes
  React.useEffect(() => {
    if (followStatusData) {
      setIsFollowing(followStatusData.isFollowing);
    }
  }, [followStatusData]);

  // Handle follow/unfollow
  const handleFollowToggle = async () => {
    if (!isAuthenticated || !hasValidUserId || isOwnProfile) return;

    setFollowLoading(true);
    try {
      if (isFollowing) {
        await apiRequest('DELETE', `/api/follows/users/${targetUserId}/follow`);
        setIsFollowing(false);
      } else {
        await apiRequest('POST', `/api/follows/users/${targetUserId}/follow`);
        setIsFollowing(true);
      }
      
      // Invalidate relevant queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['follow-status', targetUserId] });
      queryClient.invalidateQueries({ queryKey: ['user-followers', targetUserId] });
    } catch (error) {
      console.error('Follow toggle error:', error);
    } finally {
      setFollowLoading(false);
    }
  };

  // Use target user data if available, fallback to cached user data
  const currentUser = targetUser || userProfile || user;
  const currentCoins = currentUser?.coins || 0;

  const tabs = ['Characters', 'Followers', 'Following'];

  // Render content based on active tab
  const renderTabContent = () => {
    if (activeTab === 'Characters') {
      if (charactersLoading) {
        return (
          <div className="bg-gradient-to-br from-zinc-800/50 to-zinc-900/50 backdrop-blur-lg border border-orange-500/20 rounded-2xl p-6 sm:p-8 lg:p-12 text-center shadow-2xl shadow-orange-500/10">
            <div className="text-zinc-400">Loading characters...</div>
          </div>
        );
      }

      if (userCharacters.length === 0) {
        return (
          <div className="bg-gradient-to-br from-zinc-800/50 to-zinc-900/50 backdrop-blur-lg border border-orange-500/20 rounded-2xl p-6 sm:p-8 lg:p-12 text-center shadow-2xl shadow-orange-500/10">
            <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 bg-orange-500/20 rounded-full flex items-center justify-center">
              <Users className="w-6 h-6 sm:w-8 sm:h-8 text-orange-400" />
            </div>
            <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold text-zinc-200 mb-2">It's a bit empty here</h2>
            <p className="text-sm sm:text-base text-zinc-400 mb-6">
              {isOwnProfile ? "Create your first public character to get started" : "This user hasn't created any characters yet"}
            </p>
            {isOwnProfile && (
              <Link href="/create-character">
                <button className="px-6 sm:px-8 py-2.5 sm:py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 rounded-xl transition-all duration-200 transform hover:scale-105 text-sm sm:text-base">
                  Create Character
                </button>
              </Link>
            )}
          </div>
        );
      }

      return (
        <Cards 
          externalCharacters={userCharacters}
          externalLoading={false}
          externalError={null}
        />
      );
    }

    if (activeTab === 'Followers') {
      if (followersLoading) {
        return (
          <div className="bg-gradient-to-br from-zinc-800/50 to-zinc-900/50 backdrop-blur-lg border border-orange-500/20 rounded-2xl p-6 sm:p-8 lg:p-12 text-center shadow-2xl shadow-orange-500/10">
            <div className="text-zinc-400">Loading followers...</div>
          </div>
        );
      }

      const followers = followersData?.data || [];
      if (followers.length === 0) {
        return (
          <div className="bg-gradient-to-br from-zinc-800/50 to-zinc-900/50 backdrop-blur-lg border border-orange-500/20 rounded-2xl p-6 sm:p-8 lg:p-12 text-center shadow-2xl shadow-orange-500/10">
            <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 bg-orange-500/20 rounded-full flex items-center justify-center">
              <UserPlus className="w-6 h-6 sm:w-8 sm:h-8 text-orange-400" />
            </div>
            <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold text-zinc-200 mb-2">It's a bit empty here</h2>
            <p className="text-sm sm:text-base text-zinc-400 mb-6">
              {isOwnProfile ? "No followers yet" : "This user has no followers yet"}
            </p>
          </div>
        );
      }

      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {followers.map((follower: any) => (
            <Link key={follower._id || follower.id || `follower-${Math.random()}`} href={`/user-profile/${follower._id || follower.id}`}>
              <div className="bg-gradient-to-br from-zinc-800/50 to-zinc-900/50 backdrop-blur-lg border border-orange-500/20 rounded-xl p-4 shadow-lg shadow-orange-500/10 hover:shadow-orange-500/20 transition-all duration-300 cursor-pointer group">
                <div className="flex items-center space-x-3">
                  <img
                    src={follower.avatarUrl || defaultAvatar}
                    alt={follower.username}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <h3 className="text-sm font-semibold text-zinc-200 truncate">{follower.username}</h3>
                      {follower.isVerified && (
                        <Crown className="w-4 h-4 text-yellow-500 shrink-0" />
                      )}
                    </div>
                    {follower.bio && (
                      <p className="text-xs text-zinc-400 truncate">{follower.bio}</p>
                    )}
                    <div className="flex items-center space-x-4 text-xs text-zinc-500 mt-1">
                      <span>{follower.followersCount || 0} followers</span>
                      <span>{follower.followingCount || 0} following</span>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      );
    }

    if (activeTab === 'Following') {
      if (followingLoading) {
        return (
          <div className="bg-gradient-to-br from-zinc-800/50 to-zinc-900/50 backdrop-blur-lg border border-orange-500/20 rounded-2xl p-6 sm:p-8 lg:p-12 text-center shadow-2xl shadow-orange-500/10">
            <div className="text-zinc-400">Loading following...</div>
          </div>
        );
      }

      const following = followingData?.data || [];
      if (following.length === 0) {
        return (
          <div className="bg-gradient-to-br from-zinc-800/50 to-zinc-900/50 backdrop-blur-lg border border-orange-500/20 rounded-2xl p-6 sm:p-8 lg:p-12 text-center shadow-2xl shadow-orange-500/10">
            <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 bg-orange-500/20 rounded-full flex items-center justify-center">
              <Users className="w-6 h-6 sm:w-8 sm:h-8 text-orange-400" />
            </div>
            <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold text-zinc-200 mb-2">It's a bit empty here</h2>
            <p className="text-sm sm:text-base text-zinc-400 mb-6">
              {isOwnProfile ? "You're not following anyone yet" : "This user isn't following anyone yet"}
            </p>
          </div>
        );
      }

      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {following.map((followedUser: any) => (
            <Link key={followedUser._id || followedUser.id || `following-${Math.random()}`} href={`/user-profile/${followedUser._id || followedUser.id}`}>
              <div className="bg-gradient-to-br from-zinc-800/50 to-zinc-900/50 backdrop-blur-lg border border-orange-500/20 rounded-xl p-4 shadow-lg shadow-orange-500/10 hover:shadow-orange-500/20 transition-all duration-300 cursor-pointer group">
                <div className="flex items-center space-x-3">
                  <img
                    src={followedUser.avatarUrl || defaultAvatar}
                    alt={followedUser.username}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <h3 className="text-sm font-semibold text-zinc-200 truncate">{followedUser.username}</h3>
                      {followedUser.isVerified && (
                        <Crown className="w-4 h-4 text-yellow-500 shrink-0" />
                      )}
                    </div>
                    {followedUser.bio && (
                      <p className="text-xs text-zinc-400 truncate">{followedUser.bio}</p>
                    )}
                    <div className="flex items-center space-x-4 text-xs text-zinc-500 mt-1">
                      <span>{followedUser.followersCount || 0} followers</span>
                      <span>{followedUser.followingCount || 0} following</span>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      );
    }

    return null;
  };

  return (
    <div className="text-white px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* ─── HEADER ───────────────────────────────────────────────────────────── */}
        <header className="mb-6 sm:mb-8">
          <div className="bg-gradient-to-br from-zinc-800/50 to-zinc-900/50 backdrop-blur-lg border border-orange-500/20 rounded-2xl p-4 sm:p-6 lg:p-8 shadow-2xl shadow-orange-500/10">
            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-6 mb-6">
              <div className="relative shrink-0">
                {isOwnProfile ? (
                  <ProfilePictureUpload 
                    currentAvatarUrl={user?.avatarUrl || user?.avatar}
                    onAvatarUpdate={async (newAvatarUrl) => {
                      // Refresh user data to show the new avatar
                      if (import.meta.env.DEV || import.meta.env.VITE_APP_ENV === 'development') {
                        console.log('Avatar updated:', newAvatarUrl);
                      }
                      await refreshUser();
                    }}
                  />
                ) : (
                  <img
                    src={currentUser?.avatarUrl || currentUser?.avatar || defaultAvatar}
                    alt={currentUser?.username || 'User'}
                    className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover ring-4 ring-orange-500/30"
                  />
                )}
              </div>
              <div className="flex-1 w-full min-w-0">
                <div className="flex flex-col xs:flex-row xs:items-center space-y-2 xs:space-y-0 xs:space-x-3 mb-2">
                  <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent truncate">
                    {currentUser?.username || 'Guest User'}
                  </h1>
                  <div className="flex items-center space-x-2">
                    {currentUser?.isVerified && (
                      <Crown className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-500 shrink-0" />
                    )}
                    <button aria-label="Copy profile link" className="text-zinc-400 hover:text-orange-400 transition-colors shrink-0">
                      <Copy size={18} className="sm:hidden" />
                      <Copy size={20} className="hidden sm:block" />
                    </button>
                  </div>
                </div>
                <p className="text-sm sm:text-base text-zinc-400 mb-3 truncate-mobile-2">
                  @{currentUser?.username || 'guest'} • {currentUser?.role || 'user'} • {followersData?.data?.length || 0} followers • {userCharacters.length || 0} characters
                </p>
                {currentUser?.bio && (
                  <p className="text-sm sm:text-base text-zinc-300 mb-3 truncate-mobile-3">{currentUser.bio}</p>
                )}
              </div>
            </div>
            
            <div className="flex flex-col xs:flex-row space-y-3 xs:space-y-0 xs:space-x-4">
              {isOwnProfile ? (
                <>
                  <Link href="/create-character">
                    <button className="px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 rounded-xl transition-all duration-200 transform hover:scale-105 flex items-center justify-center gap-2 text-sm sm:text-base w-full xs:w-auto">
                      <Plus className="w-4 h-4" />
                      <span className="hidden sm:inline">Create Character</span>
                      <span className="sm:hidden">Create</span>
                    </button>
                  </Link>
                  <Link href="/settings">
                    <button className="px-4 sm:px-6 py-2.5 sm:py-3 bg-zinc-800/50 border border-orange-500/30 hover:bg-orange-500/10 hover:border-orange-500/50 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 text-sm sm:text-base w-full xs:w-auto">
                      <Settings className="w-4 h-4" />
                      <span className="hidden sm:inline">Settings</span>
                      <span className="sm:hidden">Settings</span>
                    </button>
                  </Link>
                </>
              ) : (
                <div className="flex space-x-3">
                  <button 
                    onClick={handleFollowToggle}
                    disabled={followLoading}
                    className={`px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl transition-all duration-200 transform hover:scale-105 flex items-center justify-center gap-2 text-sm sm:text-base w-full xs:w-auto ${
                      isFollowing 
                        ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700' 
                        : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700'
                    } ${followLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>{followLoading ? 'Loading...' : (isFollowing ? 'Unfollow' : 'Follow')}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* ─── STATS CARDS ──────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
          {[
            { icon: Users, title: "Characters", count: userCharacters.length.toString(), color: "text-blue-400" },
            { icon: UserPlus, title: "Followers", count: (followersData?.data?.length || 0).toString(), color: "text-green-400" },
            { icon: Users, title: "Following", count: (followingData?.data?.length || 0).toString(), color: "text-purple-400" },
            { icon: Crown, title: "Coins", count: isOwnProfile ? currentCoins.toLocaleString() : "---", color: "text-yellow-400" }
          ].map((stat, i) => (
            <div key={i} className="bg-gradient-to-br from-zinc-800/50 to-zinc-900/50 backdrop-blur-lg border border-orange-500/20 rounded-xl p-3 sm:p-4 lg:p-6 shadow-lg shadow-orange-500/10">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className={`w-8 h-8 sm:w-10 sm:h-10 ${stat.color.replace('text-', 'bg-').replace('-400', '-500/20')} rounded-lg flex items-center justify-center shrink-0`}>
                  <stat.icon className={`w-4 h-4 sm:w-5 sm:h-5 ${stat.color}`} />
                </div>
                <div className="min-w-0">
                  <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-zinc-200 truncate">{stat.count}</h3>
                  <p className="text-xs sm:text-sm text-zinc-400 truncate">{stat.title}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ─── TABS ──────────────────────────────────────────────────────────────── */}
        <nav className="mb-6 sm:mb-8">
          <div className="bg-gradient-to-br from-zinc-800/50 to-zinc-900/50 backdrop-blur-lg border border-orange-500/20 rounded-xl p-1 shadow-lg shadow-orange-500/10">
            <ul className="flex overflow-x-auto scrollbar-hide">
              {tabs.map((tab) => (
                <li key={tab} className="flex-1 min-w-0">
                  <button
                    onClick={() => setActiveTab(tab)}
                    className={`w-full py-2.5 sm:py-3 px-3 sm:px-4 rounded-lg transition-all duration-200 text-sm sm:text-base whitespace-nowrap ${
                      activeTab === tab
                        ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                        : 'text-zinc-400 hover:text-orange-300 hover:bg-orange-500/5'
                    }`}
                  >
                    {tab}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </nav>

        {/* ─── CONTENT AREA ─────────────────────────────────────────────────────── */}
        <main className="mb-6 sm:mb-8">
          {renderTabContent()}
        </main>

        {/* Footer */}
        <div className="text-center">
          <BrandingFooter />
        </div>
      </div>
    </div>
  );
}

export default UserProfilePage;