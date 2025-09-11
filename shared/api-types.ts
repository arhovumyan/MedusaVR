// Types for the comprehensive API structure
export interface User {
  id: string;
  email: string;
  username: string;
  displayName?: string;
  bio?: string;
  language?: string;
  timezone?: string;
  avatar?: string; // Legacy field for backward compatibility
  avatarUrl?: string;
  isVerified: boolean;
  role: 'user' | 'creator' | 'admin';
  coins?: number;
  likedCharacters?: number[];
  preferences?: {
    selectedTags: string[];
    nsfwEnabled: boolean;
    completedOnboarding: boolean;
  };
  // Social features
  followingCount?: number;
  followersCount?: number;
  // User activity tracking
  stats?: {
    charactersCreated?: number;
    imagesGenerated?: number;
    conversationsStarted?: number;
    totalMessages?: number;
    joinDate?: string;
  };
  // New tiered subscription system
  tier: 'free' | 'artist' | 'virtuoso' | 'icon';
  subscription?: {
    status: 'none' | 'active' | 'canceled' | 'past_due' | 'unpaid';
    plan?: 'artist' | 'virtuoso' | 'icon';
    startDate?: string;
    endDate?: string;
    paymentId?: string;
    autoRenew?: boolean;
    billingPeriod?: 'monthly' | 'yearly';
  };
  createdAt: string;
  updatedAt: string;
}

export interface TierPermissions {
  canCreateCharacters: boolean;
  canGenerateImages: boolean;
  canAccessPremiumFeatures: boolean;
  charactersLimit: number;
  imagesPerMonth: number;
}

export interface SubscriptionPlanDetails {
  name: string;
  price: number;
  currency: string;
  interval: string;
  description: string;
  features: string[];
}

export interface SubscriptionPlansResponse {
  success: boolean;
  plans: Record<string, SubscriptionPlanDetails>;
  tierPermissions: Record<string, TierPermissions>;
}

export interface SubscriptionUpgradeRequest {
  plan: 'artist' | 'virtuoso' | 'icon';
}

export interface SubscriptionUpgradeResponse {
  success: boolean;
  message: string;
  tier: string;
  subscription?: {
    status: string;
    plan?: string;
    startDate?: string;
    endDate?: string;
    paymentId?: string;
    autoRenew?: boolean;
  };
  permissions: TierPermissions;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface Tag {
  _id: string;
  name: string;
  displayName: string;
  description?: string;
  category: string;
  color: string;
  emoji?: string;
  isNSFW: boolean;
  usageCount: number;
}

export interface Character {
  id: string;
  name: string;
  persona: string;
  description?: string; // Main description field from database
  imageUrl?: string;
  profile_image?: string;
  avatarUrl?: string; // Alternative avatar URL field
  avatar?: string; // Alternative avatar field
  isUserCreated: boolean;
  selectedTags?: { [key: string]: string[] };
  tags?: string[]; // Legacy tags field
  tagNames?: string[]; // Legacy tag names field  
  nsfw?: boolean; // NSFW flag for content filtering
  isNsfw?: boolean; // Alternative NSFW field name
  rating?: string; // Content rating
  chatCount?: number; // Number of chats
  likes?: number; // Number of likes
  creatorId?: string; // Creator user ID
  creator?: {
    username?: string;
    avatarUrl?: string;
    verified?: boolean;
  }; // Creator information
  userId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  text: string;
  messageType: 'user' | 'character';
  timestamp: string;
  isEdited: boolean;
}

export interface Comment {
  _id: string;
  characterId: number;
  userId: {
    _id: string;
    username: string;
    avatarUrl?: string;
    verified?: boolean;
  };
  content: string;
  likes: number;
  replies: Comment[];
  parentCommentId?: string;
  isEdited: boolean;
  editedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Conversation {
  id: string;
  userId: string;
  characterId: string;
  title?: string;
  messages: Message[];
  createdAt: string;
  updatedAt: string;
}

export interface ConversationSummary {
  id: string;
  characterId: string;
  characterName: string;
  characterAvatar?: string;
  lastMessage: string;
  lastMessageAt: string;
  messageCount: number;
}

export interface ImageMeta {
  id: string;
  url: string;
  prompt: string;
  style?: string;
  width: number;
  height: number;
  userId: string;
  characterId?: string;
  createdAt: string;
}

export interface SearchResult {
  id: string;
  type: 'character' | 'image' | 'user';
  title: string;
  description?: string;
  imageUrl?: string;
  relevanceScore: number;
}

export interface Category {
  name: string;
  displayName: string;
  description?: string;
  count: number;
  emoji?: string;
}

export interface CreatorSummary {
  id: string;
  username: string;
  displayName?: string;
  avatarUrl?: string;
  characterCount: number;
  followerCount: number;
  isVerified: boolean;
}

export interface UserSummary {
  id: string;
  username: string;
  displayName?: string;
  avatarUrl?: string;
  isVerified: boolean;
}

export interface Subscription {
  id: string;
  planId: string;
  userId: string;
  status: 'active' | 'canceled' | 'past_due' | 'unpaid' | 'trialing' | 'incomplete';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  nextBillingDate?: string;
  cancelAtPeriodEnd?: boolean;
  canceledAt?: string;
}

export interface Invoice {
  id: string;
  subscriptionId: string;
  amount: number;
  currency: string;
  status: 'paid' | 'pending' | 'failed';
  paidAt?: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'follow' | 'character_like' | 'message' | 'system';
  title: string;
  message: string;
  isRead: boolean;
  data?: Record<string, any>;
  createdAt: string;
}

export interface Ticket {
  id: string;
  userId: string;
  subject: string;
  message: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  attachments?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ContentRemovalRequest {
  id: string;
  url: string;
  reason: string;
  contactEmail: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export interface UserSettings {
  notificationsEnabled: boolean;
  nsfwFilterLevel: 'none' | 'soft' | 'strict';
  chatPreferences: {
    autoSave: boolean;
    typingIndicators: boolean;
    readReceipts: boolean;
  };
  privacySettings: {
    profileVisibility: 'public' | 'followers' | 'private';
    showOnlineStatus: boolean;
  };
}

// API Response wrapper types
export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// Request body types
export interface RegisterRequest {
  email: string;
  username: string;
  password: string;
}

export interface LoginRequest {
  emailOrUsername: string;
  password: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface UpdateProfileRequest {
  displayName?: string;
  bio?: string;
  language?: string;
  timezone?: string;
  avatarUrl?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetConfirmRequest {
  token: string;
  newPassword: string;
}

export interface CreateCharacterRequest {
  // Basic character info
  name: string;
  description: string;
  quickSuggestion?: string;
  positivePrompt?: string;
  negativePrompt?: string;
  isNsfw?: boolean;
  isPublic?: boolean;
  
  // Enhanced character creation data
  personalityTraits?: {
    mainTrait?: string;
    subTraits?: string[];
    level3Traits?: string[];
  };
  
  artStyle?: {
    primaryStyle?: string;
  };
  
  scenario?: {
    environment?: string;
    setting?: string;
    mood?: string;
    timeOfDay?: string;
    weather?: string;
  };
  
  selectedTags?: {
    characterType?: string[];
    genre?: string[];
    personality?: string[];
    physicalTraits?: string[];
    appearance?: string[];
    other?: string[];
  };
  
  // Image generation options
  generateImage?: boolean;
  customPrompt?: string;
  
  // Legacy fields for backwards compatibility
  persona?: string;
  attributes?: Record<string, any>;
  category?: string;
  tags?: string[];
  avatar?: string;
  rating?: string;
  chatCount?: number;
  creatorId?: string;
}

export interface UpdateCharacterRequest {
  name?: string;
  persona?: string;
  scenario?: string;
  attributes?: Record<string, any>;
  category?: string;
  isNsfw?: boolean;
  isPublic?: boolean;
}

export interface CreateCharacterResponse {
  success: boolean;
  character?: EnhancedCharacter;
  message?: string;
  error?: string;
}

export interface EnhancedCharacter extends Omit<Character, 'scenario'> {
  // Enhanced character creation fields
  personalityTraits?: {
    mainTrait?: string;
    subTraits?: string[];
    level3Traits?: string[];
  };
  
  artStyle?: {
    primaryStyle?: string;
  };
  
  scenario?: {
    environment?: string;
    setting?: string;
    mood?: string;
    timeOfDay?: string;
    weather?: string;
  };
  
  selectedTags?: {
    characterType?: string[];
    genre?: string[];
    personality?: string[];
    physicalTraits?: string[];
    appearance?: string[];
    other?: string[];
  };
  
  // Image generation data
  imageGeneration?: {
    prompt?: string;
    negativePrompt?: string;
    seed?: number;
    characterSeed?: number;
    steps?: number;
    cfgScale?: number;
    width?: number;
    height?: number;
    model?: string;
    generationTime?: string;
    runpodJobId?: string;
  };
  
  // Image metadata
  imageMetadata?: {
    cloudinaryPublicId?: string;
    uploadedAt?: string;
    originalFilename?: string;
    generationType?: 'uploaded' | 'generated';
    originalImageUrl?: string;
    thumbnailUrl?: string;
    altVersions?: Array<{
      url: string;
      cloudinaryPublicId: string;
      prompt: string;
      seed: number;
    }>;
  };
  
  // Creation metadata
  creationProcess?: {
    stepCompleted?: number;
    totalSteps?: number;
    isDraft?: boolean;
    lastSavedAt?: string;
    timeSpent?: number;
  };
}

export interface SendMessageRequest {
  text: string;
  stream?: boolean;
}

export interface GenerateImageRequest {
  prompt: string;
  style?: string;
  artStyle?: string; // For character consistency - uses original character art style
  width?: number;
  height?: number;
  characterId?: string;
  characterName?: string;
  characterPersona?: string;
  nsfw?: boolean;
  model?: string;
  sampler?: string;
  steps?: number;
  cfgScale?: number;
  seed?: number;
  negativePrompt?: string;
  quantity?: number; // New field for number of images to generate
  useGothicLora?: boolean; // Simple toggle for Gothic LoRA
  loraStrength?: number; // LoRA strength (0.1-1.5)
}

export interface GenerateImageResponse {
  success: boolean;
  data?: {
    imageId: string;
    imageUrl: string;
    originalUrl?: string;
    prompt: string;
    style?: string;
    width: number;
    height: number;
    cloudinaryPublicId?: string;
  };
  error?: string;
}

export interface ImageGenerationModel {
  id: string;
  name: string;
  description: string;
}

export interface ImageDimension {
  width: number;
  height: number;
  name: string;
}

export interface CreateTicketRequest {
  subject: string;
  message: string;
  attachments?: string[];
}

// Upload response types
export interface UploadResponse {
  url: string;
  public_id: string;
  message: string;
}

export interface CharacterUploadResponse extends UploadResponse {
  character?: Character;
  metadata?: {
    cloudinaryPublicId: string;
    uploadedAt: string;
    originalFilename: string;
  };
}

// Image metadata for database storage
export interface ImageMetadata {
  cloudinaryPublicId?: string;
  uploadedAt?: Date;
  originalFilename?: string;
}

// Payment and Subscription Types
export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  prices: PlanPrice[];
  features: string[];
  metadata?: Record<string, any>;
}

export interface PlanPrice {
  id: string;
  amount: number;
  currency: string;
  interval?: 'month' | 'year';
  intervalCount?: number;
}

export interface CreateCheckoutSessionRequest {
  planId: string;
  priceId: string;
  billingPeriod?: 'monthly' | 'yearly';
}

export interface CheckoutSessionResponse {
  sessionId: string;
  url: string;
}

export interface PortalSessionResponse {
  url: string;
}

export interface SubscriptionStatusResponse {
  success: boolean;
  tier: string;
  subscription?: {
    status: string;
    plan?: string;
    startDate?: string;
    endDate?: string;
    paymentId?: string;
    autoRenew?: boolean;
  };
  permissions: TierPermissions;
}

export interface SubscriptionUpgradeRequest {
  plan: 'artist' | 'virtuoso' | 'icon';
}

export interface SubscriptionUpgradeResponse {
  success: boolean;
  message: string;
  tier: string;
  subscription?: {
    status: string;
    plan?: string;
    startDate?: string;
    endDate?: string;
    paymentId?: string;
    autoRenew?: boolean;
  };
  permissions: TierPermissions;
}

export interface PaymentMethodRequest {
  paymentMethodId: string;
}
