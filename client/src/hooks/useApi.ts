import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { apiService } from '@/lib/api';
import type { 
  Character, 
  CreateCharacterRequest, 
  UpdateCharacterRequest,
  SendMessageRequest,
  GenerateImageRequest,
  GenerateImageResponse,
  ImageGenerationModel,
  ImageDimension,
  CreateTicketRequest,
  PaginatedResponse 
} from '@shared/api-types';

// Character hooks
export const useCharacters = (params?: {
  page?: number;
  limit?: number;
  sort?: string;
  filter?: string;
  category?: string;
}) => {
  return useQuery({
    queryKey: ['characters', params],
    queryFn: () => apiService.getCharacters(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useInfiniteCharacters = (params?: {
  limit?: number;
  sort?: string;
  filter?: string;
  category?: string;
}) => {
  return useInfiniteQuery({
    queryKey: ['characters', 'infinite', params],
    queryFn: ({ pageParam = 1 }) => 
      apiService.getCharacters({ ...params, page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.hasMore ? allPages.length + 1 : undefined;
    },
    staleTime: 5 * 60 * 1000,
  });
};

export const useCharacter = (id: string | undefined) => {
  return useQuery({
    queryKey: ['characters', id],
    queryFn: () => apiService.getCharacter(id!),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
};

export const useCreateCharacter = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: apiService.createCharacter,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['characters'] });
    },
  });
};

export const useUpdateCharacter = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCharacterRequest }) => 
      apiService.updateCharacter(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['characters', id] });
      queryClient.invalidateQueries({ queryKey: ['characters'] });
    },
  });
};

export const useDeleteCharacter = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: apiService.deleteCharacter,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['characters'] });
    },
  });
};

export const useUploadCharacterAvatar = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ characterId, file }: { characterId: string; file: File }) => 
      apiService.uploadCharacterAvatar(characterId, file),
    onSuccess: (_, { characterId }) => {
      queryClient.invalidateQueries({ queryKey: ['characters', characterId] });
    },
  });
};

// Chat hooks
export const useSendMessage = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ characterId, data }: { characterId: string; data: SendMessageRequest }) => 
      apiService.sendMessage(characterId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat'] });
    },
  });
};

export const useConversation = (conversationId: string | undefined) => {
  return useQuery({
    queryKey: ['chat', 'conversation', conversationId],
    queryFn: () => apiService.getConversation(conversationId!),
    enabled: !!conversationId,
    refetchInterval: 5000, // Poll every 5 seconds for new messages
  });
};

export const useChatHistory = (params?: {
  characterId?: string;
  page?: number;
  limit?: number;
}) => {
  return useQuery({
    queryKey: ['chat', 'history', params],
    queryFn: () => apiService.getChatHistory(params),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

export const useDeleteConversation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: apiService.deleteConversation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat'] });
    },
  });
};

// Image generation hooks
export const useGenerateImage = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: apiService.generateImage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['images'] });
    },
  });
};

export const useImageModels = () => {
  return useQuery({
    queryKey: ['imageModels'],
    queryFn: () => apiService.getImageModels(),
    staleTime: 24 * 60 * 60 * 1000, // 24 hours - models don't change often
  });
};

export const useImages = (params?: {
  userId?: string;
  characterId?: string;
  page?: number;
  limit?: number;
}) => {
  return useQuery({
    queryKey: ['images', params],
    queryFn: () => apiService.getImages(params),
    staleTime: 5 * 60 * 1000,
  });
};

export const useDeleteImage = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: apiService.deleteImage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['images'] });
    },
  });
};

// Search hooks
export const useSearch = (params: {
  q: string;
  type?: ('characters' | 'images' | 'users')[];
  page?: number;
  limit?: number;
}) => {
  return useQuery({
    queryKey: ['search', params],
    queryFn: () => apiService.search(params),
    enabled: !!params.q && params.q.length >= 2,
    staleTime: 2 * 60 * 1000,
  });
};

export const useCategories = () => {
  return useQuery({
    queryKey: ['categories'],
    queryFn: apiService.getCategories,
    staleTime: 30 * 60 * 1000, // 30 minutes
  });
};

export const useCategoryCharacters = (categoryName: string, params?: {
  page?: number;
  limit?: number;
}) => {
  return useQuery({
    queryKey: ['categories', categoryName, 'characters', params],
    queryFn: () => apiService.getCategoryCharacters(categoryName, params),
    enabled: !!categoryName,
    staleTime: 5 * 60 * 1000,
  });
};

// Following hooks
export const useFollowing = (userId: string | undefined) => {
  return useQuery({
    queryKey: ['users', userId, 'following'],
    queryFn: () => apiService.getFollowing(userId!),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });
};

export const useFollowers = (userId: string | undefined) => {
  return useQuery({
    queryKey: ['users', userId, 'followers'],
    queryFn: () => apiService.getFollowers(userId!),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });
};

export const useFollowUser = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: apiService.followUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['creators'] });
    },
  });
};

export const useUnfollowUser = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: apiService.unfollowUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['creators'] });
    },
  });
};

export const useTopCreators = (period: 'week' | 'month' | 'all' = 'month') => {
  return useQuery({
    queryKey: ['creators', 'top', period],
    queryFn: () => apiService.getTopCreators(period),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Subscription hooks
export const useSubscribe = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ planId, paymentMethodId }: { planId: string; paymentMethodId: string }) => 
      apiService.subscribe(planId, paymentMethodId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
    },
  });
};

export const usePaymentStatus = () => {
  return useQuery({
    queryKey: ['payments', 'status'],
    queryFn: apiService.getPaymentStatus,
    staleTime: 5 * 60 * 1000,
  });
};

export const useInvoices = () => {
  return useQuery({
    queryKey: ['payments', 'invoices'],
    queryFn: apiService.getInvoices,
    staleTime: 10 * 60 * 1000,
  });
};

// Notification hooks
export const useNotifications = (unreadOnly?: boolean) => {
  return useQuery({
    queryKey: ['notifications', { unreadOnly }],
    queryFn: () => apiService.getNotifications(unreadOnly),
    refetchInterval: 30000, // Refetch every 30 seconds
  });
};

export const useMarkNotificationRead = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: apiService.markNotificationRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
};

// Support hooks
export const useCreateSupportTicket = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: apiService.createSupportTicket,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['support', 'tickets'] });
    },
  });
};

export const useSupportTickets = (params?: {
  status?: string;
  page?: number;
  limit?: number;
}) => {
  return useQuery({
    queryKey: ['support', 'tickets', params],
    queryFn: () => apiService.getSupportTickets(params),
    staleTime: 5 * 60 * 1000,
  });
};

export const useSupportTicket = (ticketId: string | undefined) => {
  return useQuery({
    queryKey: ['support', 'tickets', ticketId],
    queryFn: () => apiService.getSupportTicket(ticketId!),
    enabled: !!ticketId,
    staleTime: 2 * 60 * 1000,
  });
};

export const useApi = () => {
  return apiService;
};
