// Utility functions and mock data helpers for the GirlfriendGPT application

export const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
};

export const formatTimeAgo = (date: Date): string => {
  const now = new Date();
  const diffInMs = now.getTime() - new Date(date).getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInMinutes < 1) {
    return "Just now";
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
  } else if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
  } else {
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  }
};

export const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('en-US', { 
    year: 'numeric', 
    month: 'long' 
  }).format(date);
};

export const generateStarRating = (rating: number): { fullStars: number; hasHalfStar: boolean; emptyStars: number } => {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
  
  return { fullStars, hasHalfStar, emptyStars };
};

// Character tag colors mapping
export const getTagColor = (tag: string): string => {
  const tagColors: Record<string, string> = {
    'Intelligent': 'bg-blue-500/20 text-blue-400',
    'Mysterious': 'bg-purple-500/20 text-purple-400',
    'Artistic': 'bg-pink-500/20 text-pink-400',
    'Cheerful': 'bg-yellow-500/20 text-yellow-400',
    'Anime': 'bg-rose-500/20 text-rose-400',
    'Adventure': 'bg-green-500/20 text-green-400',
    'Fantasy': 'bg-violet-500/20 text-violet-400',
    'Warrior': 'bg-red-500/20 text-red-400',
    'Wise': 'bg-indigo-500/20 text-indigo-400',
    'Sci-Fi': 'bg-cyan-500/20 text-cyan-400',
    'Futuristic': 'bg-teal-500/20 text-teal-400',
    'Tech': 'bg-slate-500/20 text-slate-400',
    'Romantic': 'bg-pink-500/20 text-pink-400',
    'Passionate': 'bg-red-500/20 text-red-400',
    'Caring': 'bg-emerald-500/20 text-emerald-400',
    'Cyberpunk': 'bg-purple-500/20 text-purple-400',
    'Hacker': 'bg-green-500/20 text-green-400',
    'Rebel': 'bg-orange-500/20 text-orange-400',
    'Android': 'bg-gray-500/20 text-gray-400',
    'Emotional': 'bg-pink-500/20 text-pink-400',
    'Nature': 'bg-green-500/20 text-green-400',
    'Healer': 'bg-emerald-500/20 text-emerald-400',
    'Gentle': 'bg-blue-500/20 text-blue-400',
  };

  return tagColors[tag] || 'bg-primary/20 text-primary';
};

// User avatars for community sections
export const getCommunityAvatars = (): string[] => {
  return [
    "https://images.unsplash.com/photo-1494790108755-2616c46b4ee2?w=48&h=48&fit=crop",
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=48&h=48&fit=crop",
    "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=48&h=48&fit=crop",
    "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=48&h=48&fit=crop",
    "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=48&h=48&fit=crop",
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=48&h=48&fit=crop",
  ];
};

// Sample conversation starters for characters
export const getConversationStarters = (characterName: string): string[] => {
  return [
    `Hello there! I'm ${characterName}. What brings you here today?`,
    `Welcome! I've been waiting to meet someone like you.`,
    `*looks up with curious eyes* Oh, a new friend! Tell me about yourself.`,
    `I sense something special about you. Care to share what's on your mind?`,
    `*smiles warmly* Perfect timing! I was just thinking about starting an adventure.`,
  ];
};

// Character personality traits
export const getPersonalityTraits = (): string[] => {
  return [
    'Empathetic', 'Adventurous', 'Intellectual', 'Playful', 'Mysterious',
    'Confident', 'Gentle', 'Passionate', 'Wise', 'Energetic',
    'Creative', 'Loyal', 'Independent', 'Curious', 'Protective',
    'Witty', 'Calm', 'Ambitious', 'Spontaneous', 'Thoughtful',
  ];
};

// Common character backstory elements
export const getBackstoryElements = (): string[] => {
  return [
    'Ancient wisdom keeper', 'Skilled warrior', 'Talented artist', 'Tech genius',
    'Magic practitioner', 'Space explorer', 'Time traveler', 'Healer',
    'Royal bloodline', 'Mysterious past', 'Guardian spirit', 'Scholar',
    'Rebel fighter', 'Peaceful monk', 'Adventurer', 'Inventor',
  ];
};

// Subscription plan features
export const getSubscriptionFeatures = () => {
  return {
    artist: [
      { name: 'GF400 free coins each month', icon: 'coins' },
      { name: '5,000 messages / month', icon: 'message' },
      { name: 'Chat History', icon: 'history' },
      { name: 'Premium Models', icon: 'star' },
      { name: 'NSFW', icon: 'fire' },
      { name: 'Custom Characters', icon: 'palette' },
      { name: 'In-Chat Pictures', icon: 'image' },
    ],
    virtuoso: [
      { name: 'GF1200 free coins each month', icon: 'coins' },
      { name: '20,000 messages / month', icon: 'message' },
      { name: 'Video Generation In Chat', icon: 'video' },
      { name: 'Chat History', icon: 'history' },
      { name: 'Premium Models', icon: 'star' },
      { name: 'NSFW', icon: 'fire' },
      { name: 'Voice', icon: 'mic' },
      { name: 'Custom Characters', icon: 'palette' },
      { name: '8K Memory', icon: 'brain' },
      { name: 'In-Chat Pictures', icon: 'image' },
    ],
    icon: [
      { name: 'GF2000 free coins each month', icon: 'coins' },
      { name: '♾️ Unlimited Messages', icon: 'infinity' },
      { name: 'Video Generation In Chat', icon: 'video' },
      { name: 'Chat History', icon: 'history' },
      { name: 'Premium Models', icon: 'star' },
      { name: 'NSFW', icon: 'fire' },
      { name: 'Voice', icon: 'mic' },
      { name: 'Custom Characters', icon: 'palette' },
      { name: '8K Memory', icon: 'brain' },
      { name: 'In-Chat Pictures', icon: 'image' },
    ],
  };
};

// Coin usage costs
export const getCoinUsage = () => {
  return [
    { name: 'Image Generation', cost: 10, description: 'Create custom images of your characters' },
    { name: 'Video Generation', cost: 25, description: 'Generate short videos in chat' },
    { name: 'Voice Messages', cost: 5, description: 'Hear your characters speak' },
    { name: 'Premium Features', cost: 'Variable', description: 'Access exclusive AI models' },
  ];
};

// Sample testimonials
export const getTestimonials = () => {
  return [
    {
      rating: 4.5,
      text: "I'm ngl IDK what system the AI here uses but it's more fluid than previous AIs I've used",
      author: "iAmSiNnEr",
      platform: "via Twitter",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop",
    },
    {
      rating: 5,
      text: "You guys just made me to upgrade from Premium to Deluxe.",
      author: "Calandriel",
      platform: "via Discord",
      avatar: "https://images.unsplash.com/photo-1494790108755-2616c46b4ee2?w=40&h=40&fit=crop",
    },
    {
      rating: 5,
      text: "Welp, you guys are doing gods work making this site.",
      author: "Anonymous User",
      platform: "via Discord",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=40&h=40&fit=crop",
    },
  ];
};

// Category emojis and descriptions
export const getCategories = () => {
  return [
    { name: "NSFW", emoji: "🔥", description: "Adult content and mature themes" },
    { name: "Female", emoji: "👩‍🦰", description: "Female characters" },
    { name: "Male", emoji: "👨‍🦰", description: "Male characters" },
    { name: "Fictional", emoji: "📚", description: "Characters from fiction" },
    { name: "Anime", emoji: "📺", description: "Anime-style characters" },
    { name: "Game", emoji: "🎮", description: "Gaming characters" },
    { name: "Romantic", emoji: "💞", description: "Romance-focused characters" },
    { name: "Fantasy", emoji: "🧙‍♀️", description: "Fantasy world characters" },
    { name: "Sci-Fi", emoji: "🚀", description: "Science fiction characters" },
  ];
};

// Navigation menu items
export const getNavigationItems = () => {
  return [
    { name: "For You", href: "/ForYouPage", icon: "home" },
    { name: "Following", href: "/following", icon: "users" },
    { name: "Top Creators", href: "/creators", icon: "star" },
    { name: "Recent Chats", href: "/recent-chats", icon: "message-circle" },
  ];
};

// Create menu items
export const getCreateItems = () => {
  return [
    { name: "Create Character", href: "/create-character", icon: "plus" },
    { name: "Generate Images", href: "/generate-images", icon: "image" },
  ];
};

// Sample character generation prompts
export const getImagePrompts = () => {
  return [
    "A beautiful anime girl with long silver hair, wearing a flowing blue dress, standing in a magical forest with glowing butterflies",
    "A mysterious cyberpunk character with neon hair and futuristic clothing in a dark alley",
    "An elegant elf warrior with ancient armor and magical weapons in an enchanted grove",
    "A gentle healer with nature magic surrounded by blooming flowers and soft light",
    "A confident space explorer in advanced tech suit standing on an alien planet",
  ];
};

// Enhanced error messages for different scenarios with styling information
export const getErrorMessages = () => {
  return {
    characterNotFound: {
      type: "characterNotFound" as const,
      title: "Character Not Found",
      message: "The character you're looking for doesn't exist.",
      variant: "warning" as const,
      icon: "search",
      actionText: "Browse Characters",
      actionHref: "/ForYouPage"
    },
    creatorNotFound: {
      type: "creatorNotFound" as const,
      title: "Creator Not Found",
      message: "The creator you're looking for doesn't exist.",
      variant: "warning" as const,
      icon: "user-x",
      actionText: "Explore Creators", 
      actionHref: "/creators"
    },
    noCharacters: {
      type: "noCharacters" as const,
      title: "No Characters Found",
      message: "No characters found matching your criteria.",
      variant: "info" as const,
      icon: "users",
      actionText: "View All Characters",
      actionHref: "/ForYouPage"
    },
    noCreators: {
      type: "noCreators" as const,
      title: "No Creators Found", 
      message: "No creators found matching your criteria.",
      variant: "info" as const,
      icon: "users",
      actionText: "Browse All Creators",
      actionHref: "/creators"
    },
    noChats: {
      type: "noChats" as const,
      title: "No Conversations Yet",
      message: "You haven't started any conversations yet.",
      variant: "info" as const,
      icon: "message-circle",
      actionText: "Find Characters",
      actionHref: "/ForYouPage"
    },
    noFollowing: {
      type: "noFollowing" as const,
      title: "Not Following Anyone",
      message: "You're not following any creators yet.",
      variant: "info" as const,
      icon: "heart",
      actionText: "Discover Creators",
      actionHref: "/creators"
    },
    networkError: {
      type: "networkError" as const,
      title: "Connection Problem",
      message: "Unable to connect to the server. Please check your internet connection.",
      variant: "error" as const,
      icon: "wifi",
      actionText: "Retry",
      showRetry: true
    },
    unknownError: {
      type: "unknownError" as const,
      title: "Something Went Wrong",
      message: "Something went wrong. Please refresh the page.",
      variant: "error" as const,
      icon: "alert-triangle",
      actionText: "Refresh Page",
      showRefresh: true
    }
  };
};

// Loading skeleton configurations
export const getSkeletonConfig = () => {
  return {
    characterCard: {
      height: "h-64",
      elements: ["image", "title", "description", "tags", "stats"],
    },
    creatorCard: {
      height: "h-32", 
      elements: ["avatar", "name", "bio", "stats"],
    },
    chatItem: {
      height: "h-20",
      elements: ["avatar", "name", "message", "time"],
    },
  };
};
