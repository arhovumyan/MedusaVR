// src/components/chat/ChatPage.tsx
import React, { useEffect, useRef, useState } from "react";
import { useParams } from "wouter";
import HeaderNotice from "./HeaderNotice";
import CharacterHeader from "./CharacterHeader";
import ChatBubble from "./ChatBubble";
import ChatInput from "./ChatInput";
import ImageGenerationModal from "./ImageGenerationModal";
import BanModal from "@/components/BanModal";
import { useChat } from "@/hooks/useChat";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Loader2, Wifi, WifiOff } from "lucide-react";
import { AuthGuard } from "@/components/AuthGuard";
import { useAuth } from "@/hooks/useAuth";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

// Character interface
interface Character {
  id: number;
  name: string;
  avatar: string;
  description: string;
  isNsfw?: boolean;
  nsfw?: boolean;
}

export default function ChatPage() {
  const { characterId } = useParams();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Validate characterId
  if (!characterId) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-zinc-900 via-zinc-800 to-orange-900/20 text-white flex items-center justify-center">
        <Alert className="max-w-md">
          <AlertDescription>
            Character ID is required to start a chat.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <AuthGuard>
      <ChatPageContent characterId={characterId} messagesEndRef={messagesEndRef} />
    </AuthGuard>
  );
}

function ChatPageContent({ characterId, messagesEndRef }: { characterId: string; messagesEndRef: React.RefObject<HTMLDivElement> }) {
  const { user } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [loraContext, setLoraContext] = useState<any>(null);

  // Fetch character data
  const { data: character, isLoading: isLoadingCharacter, error: characterError } = useQuery<Character>({
    queryKey: ['character', characterId],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/characters/${characterId}`);
      return response.json();
    },
  });

  // Initialize chat
  const {
    messages,
    isTyping,
    typingCharacter,
    chatError,
    connectionStatus,
    sendMessage,
    addImageMessage,
    addLoadingImageMessage,
    updateImageMessage,
    removeMessage,
    clearError,
    banInfo,
    showBanModal,
    closeBanModal,
  } = useChat({ characterId, characterName: character?.name });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Image generation handlers
  const handleImageGenerationStarted = (prompt: string, jobId: string) => {
    // Add loading message to chat immediately 
    const messageId = addLoadingImageMessage(prompt, jobId);
    return messageId;
  };

  const handleImageGenerated = (imageUrl: string, prompt: string, messageId?: string) => {
    if (messageId) {
      // Update existing loading message
      updateImageMessage(messageId, imageUrl);
    } else {
      // Fallback: add new image message (for backward compatibility)
      addImageMessage(imageUrl, prompt);
    }
  };

  const handleImageGenerationFailed = (messageId?: string) => {
    if (messageId) {
      removeMessage(messageId);
    }
  };
  // Loading state
  if (isLoadingCharacter) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-zinc-900 via-zinc-800 to-orange-900/20 text-white overflow-hidden" style={{ zIndex: 35 }}>
        <div className="h-full flex items-center justify-center">
          <LoadingSpinner size="xl" text="Loading character..." />
        </div>
      </div>
    );
  }

  // Error state
  if (characterError || !character) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-zinc-900 via-zinc-800 to-orange-900/20 text-white flex items-center justify-center">
        <Alert className="max-w-md border-red-500/20 bg-red-500/10">
          <AlertDescription>
            Failed to load character. Please try again.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-zinc-900 via-zinc-800 to-orange-900/20 text-white overflow-hidden" style={{ zIndex: 35 }}>
      {/* Glowy background effects */}
      <div className="fixed inset-0 bg-gradient-to-br from-orange-500/5 via-transparent to-amber-500/5 pointer-events-none"></div>
      <div className="fixed top-1/4 left-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl opacity-30 pointer-events-none"></div>
      <div className="fixed bottom-1/4 right-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl opacity-30 pointer-events-none"></div>

      {/* Connection status indicator */}
      <div className="fixed top-4 right-4 z-50">
        <Badge 
          variant={connectionStatus === 'connected' ? 'default' : 'destructive'}
          className={`flex items-center gap-2 ${
            connectionStatus === 'connected' 
              ? 'bg-green-500/20 text-green-300 border-green-500/30' 
              : connectionStatus === 'connecting'
              ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
              : 'bg-red-500/20 text-red-300 border-red-500/30'
          }`}
        >
          {connectionStatus === 'connected' ? (
            <Wifi className="w-3 h-3" />
          ) : connectionStatus === 'connecting' ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <WifiOff className="w-3 h-3" />
          )}
          {connectionStatus.charAt(0).toUpperCase() + connectionStatus.slice(1)}
        </Badge>
      </div>

      {/* Voice Call Component */}

      {/* Chat error display */}
      {chatError && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50">
          <Alert className="border-red-500/20 bg-red-500/10 text-red-300">
            <AlertDescription className="flex items-center justify-between">
              {typeof chatError === 'string' ? chatError : 'An error occurred'}
              <button 
                onClick={clearError}
                className="ml-4 text-red-400 hover:text-red-300"
              >
                ×
              </button>
            </AlertDescription>
          </Alert>
        </div>
      )}

      <div className="h-full overflow-y-auto relative z-10 pt-20 pb-48">
        {/* Character Header */}
        <CharacterHeader
          avatarUrl={character.avatar || '/api/characters/1/avatar'}
          title={character.name}
          isNsfw={character.isNsfw || character.nsfw || false}
          characterId={characterId} // Pass the character ID for navigation
          subtitle={
            <div>
              <p className={`transition-all duration-300 ${isExpanded ? 'max-h-full' : 'max-h-20 overflow-hidden'}`}>
                {character.description || 'Ready to chat!'}
              </p>
              {character.description && character.description.length > 100 && (
                <button 
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="text-orange-400 hover:text-orange-300 text-sm mt-1"
                >
                  {isExpanded ? 'Read Less' : 'Read More'}
                </button>
              )}
            </div>
          }
        />

        {/* Chat Messages */}
        <div className="space-y-6 mt-8">
          {messages.map((message) => (
            <div key={message.id} className={`flex px-4 ${message.senderType === 'user' ? 'justify-end' : 'justify-start'}`}>
              <ChatBubble
                avatarUrl={
                  message.senderType === 'ai' 
                    ? character.avatar || '/api/characters/1/avatar'
                    : user?.avatarUrl || '/medusaSnake.png'
                }
                speakerName={
                  message.senderType === 'ai' 
                    ? message.characterName || character.name 
                    : 'You'
                }
                message={message.content}
                imageUrl={message.imageUrl}
                imagePrompt={message.imagePrompt}
                isUser={message.senderType === 'user'}
                isImageLoading={message.isImageLoading}
              />
            </div>
          ))}

          {/* Typing indicator */}
          {isTyping && (
            <div className="flex justify-start px-4">
              <ChatBubble
                avatarUrl={character.avatar || '/api/characters/1/avatar'}
                speakerName={typingCharacter || character.name}
                message="..."
                isTyping={true}
              />
            </div>
          )}

          {/* Empty state */}
          {messages.length === 0 && (
            <div className="flex justify-center px-4">
              <div className="text-center text-zinc-400 max-w-md">
                <p className="text-lg mb-2">Start your conversation!</p>
                <p className="text-sm">
                  Send a message to {character.name} to begin chatting.
                </p>
              </div>
            </div>
          )}
          
          {/* Scroll anchor */}
          <div ref={messagesEndRef} />
        </div>

        {/* Extra padding to ensure messages are never covered */}
        <div className="h-8"></div>
      </div>

      {/* Fixed input at the bottom */}
      <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-zinc-900/95 to-zinc-900/80 backdrop-blur-xl border-t border-orange-500/30 px-4 shadow-2xl shadow-orange-500/10" style={{ zIndex: 45 }}>
        <ChatInput 
          onSendMessage={(content: string, loraContextFromInput?: any) => {
            // Use LoRA context from ChatInput if provided, otherwise use current context
            const contextToUse = loraContextFromInput || loraContext;
            return (sendMessage as (text: string, loraContext?: any) => Promise<boolean>)(content, contextToUse);
          }}
          disabled={connectionStatus === 'disconnected'}
          placeholder={
            connectionStatus === 'connected' 
              ? `Message ${character.name}...`
              : connectionStatus === 'connecting'
              ? 'Connecting...'
              : 'Reconnecting...'
          }
          characterId={characterId}
          characterName={character.name}
          characterAvatar={character.avatar}
          user={user || undefined}
          onImageGenerated={handleImageGenerated}
          onOpenImageModal={() => setIsImageModalOpen(true)}
          onLoRAContextChange={setLoraContext}
        />
      </div>

      {/* Image Generation Modal - positioned in chat area */}
      <ImageGenerationModal
        isOpen={isImageModalOpen}
        onClose={() => setIsImageModalOpen(false)}
        onImageGenerated={handleImageGenerated}
        onImageGenerationStarted={handleImageGenerationStarted}
        onImageGenerationFailed={handleImageGenerationFailed}
        characterId={characterId}
        characterName={character.name}
        disabled={connectionStatus === 'disconnected'}
        loraContext={loraContext}
      />

      {/* Ban Modal - shows when user gets banned */}
      {banInfo && (
        <BanModal
          isOpen={showBanModal}
          banType={banInfo.banType}
          message={banInfo.message}
          violationCount={banInfo.violationCount}
          violationType={banInfo.violationType}
          action={banInfo.action}
          onClose={closeBanModal}
        />
      )}
    </div>
  );
}
