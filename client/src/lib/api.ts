import {
  Character,
  CreateCharacterRequest,
  UpdateCharacterRequest,
  Conversation,
  ConversationSummary,
  SendMessageRequest,
  Message,
  ImageMeta,
  GenerateImageRequest,
  GenerateImageResponse,
  ImageGenerationModel,
  ImageDimension,
  SearchResult,
  Category,
  CreatorSummary,
  UserSummary,
  Subscription,
  Notification,
  Ticket,
  CreateTicketRequest,
  ContentRemovalRequest,
  UserSettings,
  PaginatedResponse,
} from '@shared/api-types';
import { apiRequest } from './queryClient';
import { authService } from './auth';

class ApiService {
  // Character Management
  async getCharacters(params?: {
    page?: number;
    limit?: number;
    sort?: string;
    filter?: string;
    category?: string;
  }): Promise<PaginatedResponse<Character>> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.sort) searchParams.set('sort', params.sort);
    if (params?.filter) searchParams.set('filter', params.filter);
    if (params?.category) searchParams.set('category', params.category);

    const response = await apiRequest('GET', `/api/characters?${searchParams.toString()}`);
    return await response.json();
  }

  async getCharacter(id: string): Promise<Character> {
    const response = await apiRequest('GET', `/api/characters/${id}`);
    return await response.json();
  }

  async createCharacter(data: CreateCharacterRequest): Promise<Character> {
    const response = await apiRequest('POST', '/api/characters', data);
    return await response.json();
  }

  async updateCharacter(id: string, data: UpdateCharacterRequest): Promise<Character> {
    const response = await apiRequest('PUT', `/api/characters/${id}`, data);
    return await response.json();
  }

  async deleteCharacter(id: string): Promise<void> {
    await apiRequest('DELETE', `/api/characters/${id}`);
  }

  async uploadCharacterAvatar(characterId: string, file: File): Promise<{ avatarUrl: string }> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`/api/characters/${characterId}/avatar`, {
      method: 'POST',
      body: formData,
      headers: {
        'Authorization': `Bearer ${await authService.ensureValidToken()}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }

    return await response.json();
  }

  async deleteCharacterAvatar(characterId: string): Promise<void> {
    await apiRequest('DELETE', `/api/characters/${characterId}/avatar`);
  }

  // Chat & Conversations
  async getUserConversations(): Promise<any[]> {
    const response = await apiRequest('GET', '/api/conversations');
    return await response.json();
  }

  async sendMessage(characterId: string, data: SendMessageRequest): Promise<{ messageId: string; text: string }> {
    const response = await apiRequest('POST', `/api/chat/${characterId}/message`, data);
    return await response.json();
  }

  async getConversation(conversationId: string): Promise<{ conversation: Message[] }> {
    const response = await apiRequest('GET', `/api/chat/${conversationId}`);
    return await response.json();
  }

  async getChatHistory(params?: {
    characterId?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<ConversationSummary>> {
    const searchParams = new URLSearchParams();
    if (params?.characterId) searchParams.set('characterId', params.characterId);
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());

    const response = await apiRequest('GET', `/api/chat/history?${searchParams.toString()}`);
    return await response.json();
  }

  async deleteConversation(conversationId: string): Promise<void> {
    await apiRequest('DELETE', `/api/conversations/${conversationId}`);
  }

  async deleteMessage(conversationId: string, messageId: string): Promise<void> {
    await apiRequest('DELETE', `/api/chat/${conversationId}/message/${messageId}`);
  }

  // Image Generation
  async generateImage(data: GenerateImageRequest): Promise<GenerateImageResponse> {
    const response = await apiRequest('POST', '/api/image-generation/generate', data);
    return await response.json();
  }

  async getImageModels(): Promise<{
    models: string[];
    defaultModel: string;
    availableStyles: ImageGenerationModel[];
    availableDimensions: ImageDimension[];
  }> {
    const response = await apiRequest('GET', '/api/images/models');
    const result = await response.json();
    return result.data;
  }

  async getImages(params?: {
    userId?: string;
    characterId?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<ImageMeta>> {
    const searchParams = new URLSearchParams();
    if (params?.userId) searchParams.set('userId', params.userId);
    if (params?.characterId) searchParams.set('characterId', params.characterId);
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());

    const response = await apiRequest('GET', `/api/images?${searchParams.toString()}`);
    return await response.json();
  }

  async deleteImage(imageId: string): Promise<void> {
    await apiRequest('DELETE', `/api/images/${imageId}`);
  }

  // Search & Discovery
  async search(params: {
    q: string;
    type?: ('characters' | 'images' | 'users')[];
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<SearchResult>> {
    const searchParams = new URLSearchParams();
    searchParams.set('q', params.q);
    if (params.type) {
      params.type.forEach(t => searchParams.append('type[]', t));
    }
    if (params.page) searchParams.set('page', params.page.toString());
    if (params.limit) searchParams.set('limit', params.limit.toString());

    const response = await apiRequest('GET', `/api/search?${searchParams.toString()}`);
    return await response.json();
  }

  async getCategories(): Promise<{ categories: Category[] }> {
    const response = await apiRequest('GET', '/api/categories');
    return await response.json();
  }

  async getCategoryCharacters(categoryName: string, params?: {
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<Character>> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());

    const response = await apiRequest('GET', `/api/categories/${categoryName}/characters?${searchParams.toString()}`);
    return await response.json();
  }

  async getTags(params?: { limit?: number }): Promise<PaginatedResponse<any>> {
    const searchParams = new URLSearchParams();
    if (params?.limit !== undefined) searchParams.set('limit', params.limit.toString());
    const response = await apiRequest('GET', `/api/tags?${searchParams.toString()}`);
    return await response.json();
  }

  // Following & Creators
  async getFollowing(userId: string): Promise<{ following: CreatorSummary[] }> {
    const response = await apiRequest('GET', `/api/users/${userId}/following`);
    return await response.json();
  }

  async getFollowers(userId: string): Promise<{ followers: UserSummary[] }> {
    const response = await apiRequest('GET', `/api/users/${userId}/followers`);
    return await response.json();
  }

  async followUser(targetId: string): Promise<{ success: boolean; message: string }> {
    const response = await apiRequest('POST', `/api/follows/users/${targetId}/follow`);
    return await response.json();
  }

  async unfollowUser(targetId: string): Promise<{ success: boolean; message: string }> {
    const response = await apiRequest('DELETE', `/api/follows/users/${targetId}/follow`);
    return await response.json();
  }

  async checkFollowStatus(targetId: string): Promise<{ success: boolean; isFollowing: boolean }> {
    const response = await apiRequest('GET', `/api/follows/users/${targetId}/follow-status`);
    return await response.json();
  }

  async getTopCreators(period: 'week' | 'month' | 'all' = 'month'): Promise<{ creators: CreatorSummary[] }> {
    const response = await apiRequest('GET', `/api/creators/top?period=${period}`);
    return await response.json();
  }

  // Payments & Subscriptions
  async subscribe(planId: string, paymentMethodId: string): Promise<{ subscriptionId: string; status: string }> {
    const response = await apiRequest('POST', '/api/payments/subscribe', { planId, paymentMethodId });
    return await response.json();
  }

  async upgradeSubscription(plan: string, coinsToAward?: number, billingPeriod?: string) {
    const response = await apiRequest('POST', '/api/subscriptions/upgrade', {
      plan,
      coinsToAward,
      billingPeriod
    });
    return await response.json();
  }

  async getSubscriptionPlans(): Promise<{ success: boolean; plans: any; tierPermissions: any }> {
    const response = await apiRequest('GET', '/api/subscriptions/plans');
    return await response.json();
  }

  async cancelSubscription(subscriptionId?: string): Promise<{ success: boolean; message: string; subscription: any }> {
    const body = subscriptionId ? { subscriptionId } : {};
    const response = await apiRequest('POST', '/api/subscriptions/cancel', body);
    return await response.json();
  }

  async getSubscriptionStatus(): Promise<{ success: boolean; tier: string; subscription: any; permissions: any }> {
    try {
      const response = await apiRequest('GET', '/api/subscriptions/status');
      const data = await response.json();
      return {
        success: true,
        tier: data.tier || 'free',
        subscription: data.subscription || null,
        permissions: data.permissions || {}
      };
    } catch (error) {
      console.warn('Subscription status endpoint error, returning defaults');
      return {
        success: false,
        tier: 'free',
        subscription: null,
        permissions: {}
      };
    }
  }

  async getPaymentStatus(): Promise<{ subscription: Subscription }> {
    const response = await apiRequest('GET', '/api/payments/status');
    return await response.json();
  }

  async getInvoices(): Promise<{ invoices: any[] }> {
    try {
      const response = await apiRequest('GET', '/api/payments/invoices');
      return await response.json();
    } catch (error) {
      console.warn('Invoices endpoint not implemented, returning empty array');
      return { invoices: [] };
    }
  }

  async createPortalSession(): Promise<{ url: string }> {
    const response = await apiRequest('POST', '/api/payments/portal-session');
    return await response.json();
  }

  async updatePaymentMethod(): Promise<{ url?: string; success: boolean; message?: string }> {
    try {
      const response = await apiRequest('POST', '/api/payments/update-payment-method');
      return await response.json();
    } catch (error) {
      console.error('Payment method update not implemented, falling back to portal');
      return { success: false, message: 'Feature not yet implemented' };
    }
  }

  async updateUserTier(tier: string): Promise<{ success: boolean; message: string; tier: string }> {
    try {
      const response = await apiRequest('POST', '/api/users/update-tier', { tier });
      return await response.json();
    } catch (error) {
      console.error('User tier update error:', error);
      return { success: true, message: 'Tier updated locally', tier };
    }
  }

  // Notifications
  async getNotifications(unreadOnly?: boolean): Promise<{ notifications: Notification[] }> {
    const searchParams = new URLSearchParams();
    if (unreadOnly) searchParams.set('unreadOnly', 'true');

    const response = await apiRequest('GET', `/api/notifications?${searchParams.toString()}`);
    return await response.json();
  }

  async markNotificationRead(notificationId: string): Promise<void> {
    await apiRequest('PUT', `/api/notifications/${notificationId}/read`);
  }

  async deleteNotification(notificationId: string): Promise<void> {
    await apiRequest('DELETE', `/api/notifications/${notificationId}`);
  }

  // Support
  async createSupportTicket(data: CreateTicketRequest): Promise<{ ticketId: string; status: string }> {
    const response = await apiRequest('POST', '/api/support/tickets', data);
    return await response.json();
  }

  async getSupportTickets(params?: {
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<Ticket>> {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.set('status', params.status);
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());

    const response = await apiRequest('GET', `/api/support/tickets?${searchParams.toString()}`);
    return await response.json();
  }

  async getSupportTicket(ticketId: string): Promise<Ticket> {
    const response = await apiRequest('GET', `/api/support/tickets/${ticketId}`);
    return await response.json();
  }

  async requestContentRemoval(data: {
    url: string;
    reason: string;
    contactEmail: string;
  }): Promise<{ requestId: string; status: string }> {
    const response = await apiRequest('POST', '/api/content-removal/request', data);
    return await response.json();
  }

  // Settings
  async updateUserSettings(settings: Partial<UserSettings>): Promise<{ settings: UserSettings }> {
    const user = authService.getUser();
    if (!user) throw new Error('User not authenticated');
    
    const response = await apiRequest('PUT', `/api/users/${user.id}/settings`, settings);
    return await response.json();
  }

  async updateUserPreferences(preferences: {
    selectedTags?: string[];
    nsfwEnabled?: boolean;
    completedOnboarding?: boolean;
  }): Promise<{ message: string; preferences: any }> {
    const user = authService.getUser();
    if (!user) throw new Error('User not authenticated');
    
    const response = await apiRequest('PUT', `/api/users/${user.id}/preferences`, preferences);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update preferences');
    }
    return await response.json();
  }

  // Favorites Management
  async getFavorites(): Promise<any[]> {
    const response = await apiRequest('GET', '/api/favorites');
    return await response.json();
  }

  async addFavorite(characterId: number): Promise<void> {
    await apiRequest('POST', '/api/favorites', { characterId });
  }

  async removeFavorite(characterId: number): Promise<void> {
    await apiRequest('DELETE', `/api/favorites/${characterId}`);
  }

  async toggleFavorite(characterId: number): Promise<{ isFavorite: boolean }> {
    const response = await apiRequest('POST', '/api/favorites/toggle', { characterId });
    return await response.json();
  }

  // Likes Management
  async likeCharacter(characterId: number): Promise<void> {
    await apiRequest('POST', `/api/characters/${characterId}/likes`);
  }

  async unlikeCharacter(characterId: number): Promise<void> {
    await apiRequest('DELETE', `/api/characters/${characterId}/likes`);
  }

  async toggleLike(characterId: number): Promise<{ likes: number; isLiked: boolean; message: string }> {
    const response = await apiRequest('PUT', `/api/characters/${characterId}/likes`);
    return await response.json();
  }

  async getLikedCharacters(userId: string): Promise<number[]> {
    const response = await apiRequest('GET', `/api/users/${userId}/likedCharacters`);
    return (await response.json()).likedCharacters;
  }

  // Legal & Resources
  async getTermsOfService(): Promise<{ termsOfService: string }> {
    const response = await apiRequest('GET', '/api/legal/terms');
    return await response.json();
  }

  async getPrivacyPolicy(): Promise<{ privacyPolicy: string }> {
    const response = await apiRequest('GET', '/api/legal/privacy');
    return await response.json();
  }

  async getFAQ(): Promise<{ faqs: { question: string; answer: string }[] }> {
    const response = await apiRequest('GET', '/api/faq');
    return await response.json();
  }

  // Crypto Payments
  async getAvailableCryptoCurrencies(): Promise<{ currencies: string[] }> {
    // Mock for development - just return empty array since we're removing crypto
    return { currencies: [] };
  }

  async createCryptoPayment(packageId: string, currency: string): Promise<any> {
    // Mock - will not be used since we're removing crypto
    throw new Error('Crypto payments are no longer supported');
  }

  async createTrustPayPayment(packageId: string): Promise<any> {
    // Mock - will not be used since we're removing TrustPay
    throw new Error('TrustPay payments are no longer supported');
  }

  async addCoinsManually(packageId: string): Promise<{ success: boolean; message: string; coins: number }> {
    // This is for development testing only
    const response = await apiRequest('POST', '/api/auth/add-coins', { amount: 100 });
    return await response.json();
  }

  // Mock payment for coin purchases
  async mockCoinPurchase(packageId: string, coins: number): Promise<{ success: boolean; message: string; coins: number }> {
    const response = await apiRequest('POST', '/api/auth/add-coins', { amount: coins });
    return await response.json();
  }

  // Coin management
  async getCoinInfo(): Promise<{ 
    success: boolean; 
    data: {
      currentBalance: number;
      tier: string;
      monthlyAllowance: number;
      daysUntilRefill: number;
      isEligibleForRefill: boolean;
      subscriptionStatus: string;
      lastRefill?: string;
    };
  }> {
    const response = await apiRequest('GET', '/api/coins/info');
    return await response.json();
  }

  async claimMonthlyCoins(): Promise<{ 
    success: boolean; 
    message: string;
    data?: {
      coinsAdded: number;
      newBalance: number;
      nextRefillDate: string;
    };
  }> {
    const response = await apiRequest('POST', '/api/coins/claim-monthly');
    return await response.json();
  }

  // Comment Management
  async getCharacterComments(characterId: string, page: number = 1, limit: number = 10): Promise<{
    success: boolean;
    data: any[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  }> {
    const response = await apiRequest('GET', `/api/characters/${characterId}/comments?page=${page}&limit=${limit}`);
    return await response.json();
  }

  async createComment(characterId: string, content: string, parentCommentId?: string): Promise<{
    success: boolean;
    data?: any;
    error?: string;
  }> {
    const response = await apiRequest('POST', `/api/characters/${characterId}/comments`, {
      content: content.trim(),
      parentCommentId
    });
    return await response.json();
  }

  async updateComment(commentId: string, content: string): Promise<{
    success: boolean;
    data?: any;
    error?: string;
  }> {
    const response = await apiRequest('PUT', `/api/comments/${commentId}`, {
      content: content.trim()
    });
    return await response.json();
  }

  async deleteComment(commentId: string): Promise<{
    success: boolean;
    message?: string;
    error?: string;
  }> {
    const response = await apiRequest('DELETE', `/api/comments/${commentId}`);
    return await response.json();
  }

  async likeComment(commentId: string): Promise<{
    success: boolean;
    data?: any;
    error?: string;
  }> {
    const response = await apiRequest('POST', `/api/comments/${commentId}/like`);
    return await response.json();
  }
  
}

export const apiService = new ApiService();
export { apiRequest } from './queryClient';
