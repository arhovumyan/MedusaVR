import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { apiRequest } from '@/lib/queryClient';

export interface Conversation {
  conversationId: string;
  characterId: number;
  characterName: string;
  characterAvatar: string;
  title: string;
  lastMessage: string;
  lastActivity: Date;
  messageCount: number;
  isFavorite: boolean;
  isArchived: boolean;
  createdAt: Date;
}

export interface Message {
  id: string;
  conversationId: string;
  sender: 'user' | 'ai';
  content: string;
  timestamp: Date;
  characterId?: number;
  characterName?: string;
  isRead: boolean;
}

export interface ConversationInfo {
  conversationId: string;
  characterId: number;
  title: string;
  messageCount: number;
}

export interface UseConversationsOptions {
  page?: number;
  limit?: number;
  archived?: boolean;
}

export function useConversations(options: UseConversationsOptions = {}) {
  const { user, isAuthenticated } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0
  });

  // Load conversations
  const loadConversations = useCallback(async () => {
    if (!isAuthenticated || !user) return;

    try {
      setIsLoading(true);
      setError(null);

      const { page = 1, limit = 20, archived = false } = options;
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        archived: archived.toString()
      });

      const response = await apiRequest('GET', `/api/conversations/${user.id}?${queryParams}`);
      const data = await response.json();

      setConversations(data.conversations || []);
      setPagination(data.pagination);
    } catch (err) {
      console.error('Failed to load conversations:', err);
      setError('Failed to load conversations');
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, user, options]);

  // Create new conversation
  const createConversation = useCallback(async (characterId: number): Promise<string | null> => {
    if (!isAuthenticated || !user) return null;

    try {
      setError(null);
      const response = await apiRequest('POST', '/api/conversations', {
        characterId
      });
      const data = await response.json();

      // Refresh conversations list
      await loadConversations();

      return data.conversationId;
    } catch (err) {
      console.error('Failed to create conversation:', err);
      setError('Failed to create conversation');
      return null;
    }
  }, [isAuthenticated, user, loadConversations]);

  // Update conversation
  const updateConversation = useCallback(async (
    conversationId: string, 
    updates: { title?: string; isFavorite?: boolean; isArchived?: boolean }
  ): Promise<boolean> => {
    if (!isAuthenticated || !user) return false;

    try {
      setError(null);
      await apiRequest('PUT', `/api/conversations/${conversationId}`, updates);

      // Update local state
      setConversations(prev => prev.map(conv => 
        conv.conversationId === conversationId 
          ? { ...conv, ...updates }
          : conv
      ));

      return true;
    } catch (err) {
      console.error('Failed to update conversation:', err);
      setError('Failed to update conversation');
      return false;
    }
  }, [isAuthenticated, user]);

  // Delete conversation
  const deleteConversation = useCallback(async (conversationId: string): Promise<boolean> => {
    if (!isAuthenticated || !user) return false;

    try {
      setError(null);
      await apiRequest('DELETE', `/api/conversations/${conversationId}`);

      // Remove from local state
      setConversations(prev => prev.filter(conv => conv.conversationId !== conversationId));

      return true;
    } catch (err) {
      console.error('Failed to delete conversation:', err);
      setError('Failed to delete conversation');
      return false;
    }
  }, [isAuthenticated, user]);

  // Get or create conversation with character
  const getOrCreateConversation = useCallback(async (characterId: number): Promise<string | null> => {
    if (!isAuthenticated || !user) return null;

    try {
      // First, check if we already have a conversation with this character
      const existingConversation = conversations.find(conv => conv.characterId === characterId);
      if (existingConversation) {
        return existingConversation.conversationId;
      }

      // If not, create a new one
      return await createConversation(characterId);
    } catch (err) {
      console.error('Failed to get or create conversation:', err);
      return null;
    }
  }, [isAuthenticated, user, conversations, createConversation]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Load conversations on mount and when dependencies change
  useEffect(() => {
    if (isAuthenticated && user) {
      loadConversations();
    }
  }, [loadConversations]);

  return {
    conversations,
    isLoading,
    error,
    pagination,
    createConversation,
    updateConversation,
    deleteConversation,
    getOrCreateConversation,
    loadConversations,
    clearError
  };
}

export interface UseConversationMessagesOptions {
  page?: number;
  limit?: number;
}

export function useConversationMessages(conversationId: string | null, options: UseConversationMessagesOptions = {}) {
  const { user, isAuthenticated } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversationInfo, setConversationInfo] = useState<ConversationInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0
  });

  // Load messages
  const loadMessages = useCallback(async () => {
    if (!isAuthenticated || !user || !conversationId) return;

    try {
      setIsLoading(true);
      setError(null);

      const { page = 1, limit = 50 } = options;
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString()
      });

      const response = await apiRequest('GET', `/api/messages/${conversationId}?${queryParams}`);
      const data = await response.json();

      setMessages(data.messages || []);
      setConversationInfo(data.conversationInfo);
      setPagination(data.pagination);
    } catch (err) {
      console.error('Failed to load messages:', err);
      setError('Failed to load messages');
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, user, conversationId, options]);

  // Send message
  const sendMessage = useCallback(async (content: string, sender: 'user' | 'ai' = 'user'): Promise<boolean> => {
    if (!isAuthenticated || !user || !conversationId) return false;

    try {
      setError(null);
      const response = await apiRequest('POST', '/api/messages', {
        conversationId,
        sender,
        content
      });
      const data = await response.json();

      // Add message to local state
      setMessages(prev => [...prev, {
        id: data.messageId,
        conversationId: data.conversationId,
        sender: data.sender,
        content: data.content,
        timestamp: new Date(data.timestamp),
        characterId: data.characterId,
        characterName: data.characterName,
        isRead: false
      }]);

      return true;
    } catch (err) {
      console.error('Failed to send message:', err);
      setError('Failed to send message');
      return false;
    }
  }, [isAuthenticated, user, conversationId]);

  // Add message to local state (for real-time updates)
  const addMessage = useCallback((message: Message) => {
    setMessages(prev => {
      // Check if message already exists
      const exists = prev.some(m => m.id === message.id);
      if (exists) return prev;
      
      return [...prev, message];
    });
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Load messages when conversation changes
  useEffect(() => {
    if (conversationId) {
      loadMessages();
    } else {
      setMessages([]);
      setConversationInfo(null);
    }
  }, [loadMessages]);

  return {
    messages,
    conversationInfo,
    isLoading,
    error,
    pagination,
    sendMessage,
    addMessage,
    loadMessages,
    clearError
  };
}