// src/components/layout/Header.tsx
import { Link, useLocation } from "wouter";
import { Search, Coins, User, Home, Menu, ChevronDown, Settings, Shield, LogOut, UserCircle } from "lucide-react";
import { EyeIcon } from "../icons/EyeIcon";
import { EyeOffIcon } from "../icons/EyeOffIcon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { authService } from "@/lib/auth";
import { formatCoins } from "@/lib/utils";
import SignInModal from "@/components/SignInModal";
import SignUpModal from "@/components/SignUpModal";
import { useQueryClient } from '@tanstack/react-query';
import { useImageBlur } from "@/context/ImageBlurContext";
import { apiRequest } from "@/lib/queryClient";


interface HeaderProps {
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
}

export function Header({ sidebarOpen, onToggleSidebar }: HeaderProps) {
  const [isSignInOpen, setIsSignInOpen] = useState(false);
  const [isSignUpOpen, setIsSignUpOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { user, isAuthenticated, logout } = useAuth();
  const { isBlurred, toggleBlur, showNSFW, toggleNSFWFilter } = useImageBlur();
  const queryClient = useQueryClient();
  const [location, setLocation] = useLocation();

  const handleRefreshUserProfile = () => {
    queryClient.invalidateQueries({ queryKey: ['user', 'profile'] });
  };

  // Fetch fresh user data to get current coin balance
  const { data: userProfile, error: profileError, isLoading } = useQuery({
    queryKey: ['user', 'profile'],
    queryFn: authService.getProfile,
    enabled: isAuthenticated,
    staleTime: Infinity, // ✅ never refetch unless manually triggered
    refetchInterval: false, // ✅ don't poll
    refetchOnWindowFocus: false, // ✅ don't re-trigger on tab switch
    retry: false, // ✅ don't retry on failure
  });
  
  

  // Use fresh data if available, fallback to cached user data
  const currentUser = userProfile || user;
  const currentCoins = currentUser?.coins || 0;

  // Debug logging - only in development
  if (import.meta.env.DEV || import.meta.env.VITE_APP_ENV === 'development') {
    console.log('Header Debug:', {
      isAuthenticated,
      user,
      userProfile,
      profileError,
      isLoading,
      currentCoins
    });
  }
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsUserDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      setIsUserDropdownOpen(false);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleSearch = () => {
    const trimmedQuery = searchQuery.trim();
    if (!trimmedQuery) return;

    // Navigate to the dedicated search page with search query
    setLocation(`/search?q=${encodeURIComponent(trimmedQuery)}`);
  };

  const handleSearchKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <>
    

      <header className="fixed top-0 left-0 right-0 z-50 bg-zinc-900/80 backdrop-blur-md border-b border-orange-500/20 px-2 sm:px-4 py-3 flex items-center justify-between gap-2">
        <div className="flex items-center flex-1 min-w-0 gap-1">
          <button
            onClick={onToggleSidebar}
            className="p-2 rounded-lg text-gray-100 hover:text-orange-400 hover:bg-orange-500/10 cursor-pointer hover:scale-110 transition-all duration-150 shrink-0"
          >
            <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>

          <Link href="/ForYouPage">
            <Button
              variant="ghost"
              size="icon"
              className="cursor-pointer hover:scale-110 transition-transform duration-150 hover:bg-orange-500/10 hover:text-orange-400 shrink-0"
            >
              <Home className="w-5 h-5 sm:w-6 sm:h-6" />
            </Button>
          </Link>

          <div className="relative flex-1 max-w-[150px] sm:max-w-sm">
            <button
              onClick={handleSearch}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 z-10 hover:text-orange-400 transition-colors cursor-pointer"
            >
              <Search className="w-4 h-4 sm:w-5 sm:h-5 text-orange-400/70" />
            </button>
            <Input
              type="search"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleSearchKeyPress}
              className="w-full h-9 sm:h-10 bg-zinc-800/50 backdrop-blur-sm border border-orange-500/20 focus:border-orange-500/40 focus:ring-2 focus:ring-orange-500/20 text-zinc-100 placeholder:text-zinc-400 text-sm pl-9 sm:pl-12 transition-all duration-200"
            />
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={toggleNSFWFilter}
            className="p-2 rounded-lg text-gray-100 hover:text-orange-400 hover:bg-orange-500/10 cursor-pointer hover:scale-110 transition-all duration-150 shrink-0"
          >
            {!showNSFW ? <EyeOffIcon className="w-5 h-5 sm:w-6 sm:h-6" /> : <EyeIcon className="w-5 h-5 sm:w-6 sm:h-6" />}
          </button>
          <Link href="/coins">
            <Button
              variant="outline"
              size="sm"
              className="bg-orange-500/20 border-orange-500/30 hover:bg-orange-500/30 cursor-pointer hover:scale-110 transition-all duration-150 backdrop-blur-sm h-9 px-2 sm:px-3"
            >
              <Coins className="w-4 h-4 sm:w-5 sm:h-5 text-orange-400 mr-1 sm:mr-2" />
              <span className="text-orange-200 text-xs sm:text-sm">
                {formatCoins(currentCoins, 7)}
              </span>
            </Button>
          </Link>

          {isAuthenticated ? (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                className="flex items-center gap-1 sm:gap-2 cursor-pointer hover:scale-105 transition-all duration-150 p-1.5 sm:p-2 rounded-lg hover:bg-orange-500/10 bg-zinc-800/50 border border-orange-500/20"
              >
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full overflow-hidden border border-orange-500/30 shrink-0">
                  <img
                    src={user?.avatarUrl || `https://ui-avatars.com/api/?background=ea580c&color=ffffff&bold=true&name=${encodeURIComponent(user?.username || 'User')}`}
                    alt="User profile"
                    className="w-full h-full object-cover"
                  />
                </div>

                <ChevronDown 
                  className={`w-3 h-3 sm:w-4 sm:h-4 text-orange-400 transition-transform duration-200 shrink-0 ${
                    isUserDropdownOpen ? 'rotate-180' : ''
                  }`} 
                />
              </button>

              {/* Dropdown Menu */}
              {isUserDropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 sm:w-64 bg-zinc-900/95 backdrop-blur-md border border-orange-500/20 rounded-lg shadow-2xl shadow-orange-500/10 py-2 z-50">
                  {/* User Info Header */}
                  <div className="px-3 sm:px-4 py-3 border-b border-orange-500/20">
                    <h3 className="font-semibold text-orange-200 text-sm truncate">{user?.username || 'User'}</h3>
                    <p className="text-xs text-orange-300/60 truncate">{user?.email || 'user@example.com'}</p>
                  </div>

                  {/* Menu Items */}
                  <div className="py-1">
                    <Link href={`/user-profile/${user?.id}`}>
                      <button
                        onClick={() => setIsUserDropdownOpen(false)}
                        className="w-full flex items-center px-3 sm:px-4 py-2 text-sm text-zinc-300 hover:bg-orange-500/10 hover:text-orange-400 transition-colors duration-150 cursor-pointer"
                      >
                        <UserCircle className="w-4 h-4 mr-3 shrink-0" />
                        <span className="truncate">Profile</span>
                      </button>
                    </Link>

                    <Link href="/settings">
                      <button
                        onClick={() => setIsUserDropdownOpen(false)}
                        className="w-full flex items-center px-3 sm:px-4 py-2 text-sm text-zinc-300 hover:bg-orange-500/10 hover:text-orange-400 transition-colors duration-150 cursor-pointer"
                      >
                        <Settings className="w-4 h-4 mr-3 shrink-0" />
                        <span className="truncate">Account</span>
                      </button>
                    </Link>

                    <div className="border-t border-orange-500/20 my-1"></div>

                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center px-3 sm:px-4 py-2 text-sm text-zinc-300 hover:bg-red-500/10 hover:text-red-400 transition-colors duration-150 cursor-pointer"
                    >
                      <LogOut className="w-4 h-4 mr-3 shrink-0" />
                      <span className="truncate">Sign out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-1 sm:gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="text-zinc-300 hover:text-orange-400 hover:bg-orange-500/10 transition-all duration-150 text-xs sm:text-sm px-2 sm:px-3 h-8 sm:h-9"
                onClick={() => setIsSignUpOpen(true)}
              >
                <span className="hidden xs:inline">Sign Up</span>
                <span className="xs:hidden">Sign Up</span>
              </Button>
              
              <Button
                variant="default"
                size="sm"
                className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-lg shadow-orange-500/25 hover:scale-105 transition-all duration-150 text-xs sm:text-sm px-2 sm:px-3 h-8 sm:h-9"
                onClick={() => setIsSignInOpen(true)}
              >
                <span className="hidden xs:inline">Sign In</span>
                <span className="xs:hidden">Sign In</span>
              </Button>
            </div>
          )}
        </div>
      </header>

      <SignInModal
        isOpen={isSignInOpen}
        setIsOpen={setIsSignInOpen}
        openSignUp={() => setIsSignUpOpen(true)}
      />

      <SignUpModal
        isOpen={isSignUpOpen}
        setIsOpen={setIsSignUpOpen}
        openSignIn={() => setIsSignInOpen(true)}
      />
    </>
  );
}
