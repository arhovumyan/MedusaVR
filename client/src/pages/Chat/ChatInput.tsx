// src/components/ChatInput.tsx
import { useState, useEffect } from "react";
import {
  Image as ImageIcon,
  ChevronDown,
  Send,
  SlidersHorizontal,
  Mic,
  MicOff,
  Phone,
  PhoneOff,
  AlertTriangle,
} from "lucide-react";
import { useVoiceCall } from "@/hooks/useVoiceCall";
import { useToast } from "@/hooks/use-toast";
import { useLora } from "../../hooks/useLora";
import ChatOptionsMenu from "./ChatOptionsMenu";
import { ChatLoRAOption } from "../../types/lora";
import { CHAT_LORA_OPTIONS } from "../../config/loraConfig";
import { filterContent, filterContentLenient, ViolationSeverity } from '@shared/content-filter';
import { violationTracker } from '@shared/violation-tracker';
import { checkProhibitedWords, WordFilterResult } from '@/lib/prohibitedWordsFilter';

interface ChatInputProps {
  onSendMessage: (content: string, loraContext?: any) => Promise<boolean>;
  onImageGenerated?: (imageUrl: string, prompt: string) => void;
  onOpenImageModal?: () => void;
  onLoRAContextChange?: (context: any) => void;
  disabled?: boolean;
  placeholder?: string;
  characterId: string;
  characterName: string;
  characterAvatar?: string;
  user?: { id: string; username?: string }; // Add user context
}

export default function ChatInput({ 
  onSendMessage, 
  onImageGenerated,
  onOpenImageModal,
  onLoRAContextChange,
  disabled = false, 
  placeholder = "Type a message...",
  characterId,
  characterName,
  characterAvatar,
  user
}: ChatInputProps) {
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const { toast } = useToast();

  // Content filtering state
  const [contentWarning, setContentWarning] = useState<string | null>(null);
  const [hasContentViolation, setHasContentViolation] = useState(false);

  // LoRA state management
  const { 
    selectedLora, 
    setSelectedLora, 
    clearSelection,
    isLoRAActive,
    loraContext 
  } = useLora();

  // Notify parent of LoRA context changes
  useEffect(() => {
    if (onLoRAContextChange) {
      onLoRAContextChange(loraContext);
    }
  }, [loraContext, onLoRAContextChange]);

  // Handle LoRA selection from options menu
  const handleLoRASelect = (loraOption: ChatLoRAOption) => {
    if (loraOption.optionId) {
      setSelectedLora(loraOption.loraModel);
      toast({
        title: 'LoRA Mode Activated',
        description: `${loraOption.label}: ${loraOption.description}`,
        variant: 'default'
      });
    } else {
      // Clear selection signal
      clearSelection();
      toast({
        title: 'LoRA Mode Cleared',
        description: 'Returned to normal chat mode',
        variant: 'default'
      });
    }
  };

  // Get current selected LoRA option ID for UI state
  const getSelectedLoRAId = (): number | undefined => {
    if (!selectedLora) return undefined;
    
    const matchingOption = CHAT_LORA_OPTIONS.find(
      (opt: ChatLoRAOption) => opt.loraModel.id === selectedLora.id
    );
    
    return matchingOption?.optionId;
  };

  const {
    isCallActive,
    isConnecting,
    isRecording,
    isMuted,
    connectionStatus,
    error,
    startCall,
    endCall,
    toggleMute
  } = useVoiceCall({
    characterId,
    characterName,
    onTranscript: (transcript) => {
      console.log('🎙️ Transcript:', transcript);
    },
    onAIResponse: (response) => {
      console.log('🤖 AI Response:', response);
    },
    onAudioReceived: (audio) => {
      console.log('🔊 Audio received from:', audio.characterName);
    },
    onError: (errorMessage) => {
      toast({
        title: 'Voice Call Error',
        description: errorMessage,
        variant: 'destructive'
      });
    }
  });

  const handleVoiceToggle = async () => {
    if (isCallActive) {
      const success = await endCall();
      if (success) {
        toast({
          title: 'Voice Call Ended',
          description: `Disconnected from ${characterName}`,
          variant: 'default'
        });
      }
    } else {
      const success = await startCall();
      if (success) {
        toast({
          title: 'Voice Call Started',
          description: `Connected to ${characterName}`,
          variant: 'default'
        });
      }
    }
  };

  const handleMicToggle = () => {
    if (isCallActive) {
      toggleMute();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim() || isSending || disabled || !user) return;

    const messageToSend = message.trim();

    // Check if user is currently restricted
    const restrictionCheck = violationTracker.isUserRestricted(user.id);
    if (restrictionCheck.isRestricted) {
      let restrictionMessage = '';
      switch (restrictionCheck.type) {
        case 'banned':
          restrictionMessage = `Your account has been permanently banned for severe content violations.`;
          break;
        case 'suspended':
          restrictionMessage = `Your account is suspended until ${restrictionCheck.expiresAt?.toLocaleString()}.`;
          break;
        case 'restricted':
          restrictionMessage = `Your account is restricted until ${restrictionCheck.expiresAt?.toLocaleString()}. You cannot send messages during this time.`;
          break;
        default:
          restrictionMessage = 'Your account has been restricted due to content violations.';
      }
      
      toast({
        title: "Account Restricted",
        description: restrictionMessage,
        variant: "destructive",
      });
      return;
    }

    // Content filtering check - both existing and prohibited words
    const contentCheck = filterContent(messageToSend);
    const prohibitedWordsCheck = checkProhibitedWords(messageToSend);

    // Check existing content filter first
    if (!contentCheck.isAllowed) {
      // Log the violation
      violationTracker.logViolation({
        userId: user.id,
        username: user.username,
        violationType: 'content_filter',
        severity: contentCheck.severity,
        content: messageToSend,
        blockedWords: contentCheck.blockedWords,
        context: 'chat',
        userAgent: navigator.userAgent
      });

      toast({
        title: contentCheck.severity === ViolationSeverity.CRITICAL ? "Account Banned" : "Message Blocked",
        description: contentCheck.message,
        variant: "destructive",
      });
      
      setContentWarning(contentCheck.message || null);
      setHasContentViolation(true);

      // For critical violations, immediately disable account
      if (contentCheck.shouldBan) {
        setTimeout(() => {
          toast({
            title: "Account Terminated",
            description: "Your account has been permanently terminated for attempting to use prohibited content.",
            variant: "destructive",
          });
        }, 2000);
      }

      return;
    }

    // Check prohibited words filter
    if (!prohibitedWordsCheck.isAllowed) {
      toast({
        title: "Message Blocked",
        description: prohibitedWordsCheck.message,
        variant: "destructive",
      });
      
      setContentWarning(prohibitedWordsCheck.message);
      setHasContentViolation(true);
      return;
    }

    // Clear any previous content warnings
    setContentWarning(null);
    setHasContentViolation(false);

    setMessage("");
    setIsSending(true);

    try {
      // Pass LoRA context along with the message if active
      const loraContextToSend = isLoRAActive && selectedLora ? loraContext : undefined;
      await onSendMessage(messageToSend, loraContextToSend);
    } catch (error) {
      console.error('Failed to send message:', error);
      // Restore message if send failed
      setMessage(messageToSend);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  return (
    <div className="pt-3 pb-2 w-full max-w-6xl mx-auto">
      {/* LoRA Status Indicator */}
      {isLoRAActive && selectedLora && (
        <div className="mb-2 flex items-center justify-center">
          <div className="inline-flex items-center space-x-2 px-3 py-1 bg-gradient-to-r from-orange-500/20 to-amber-500/20 border border-orange-500/30 rounded-full text-xs text-orange-300 backdrop-blur-sm">
            <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
            <span className="font-medium">LoRA Active:</span>
            <span>{selectedLora.name}</span>
          </div>
        </div>
      )}

      {/* ─────────── Main Chat Input Box ─────────── */}
      <form onSubmit={handleSubmit}>
        <div className="relative bg-gradient-to-br from-zinc-800/60 to-zinc-900/60 backdrop-blur-xl rounded-lg border border-orange-500/20 shadow-xl shadow-orange-500/10">
          {/* Main row: [ Ask button + Input field + Mic + Send button ] */}
          <div className="flex items-center px-3 py-2 space-x-2 min-w-0">
            {/* "Ask" button on the left */}
            {/* <button 
              type="button"
              className="flex items-center space-x-1 bg-zinc-700/50 hover:bg-orange-500/20 border border-orange-500/20 rounded-md px-2 py-1 text-zinc-300 text-sm transition-all duration-200 disabled:opacity-50 flex-shrink-0"
              disabled={disabled}
            >
              <ImageIcon size={16} className="text-orange-400" />
              <span>Ask</span>
              <ChevronDown size={12} className="text-zinc-400" />
            </button> */}

            {/* The actual text input */}
            <input
              type="text"
              value={message}
              onChange={(e) => {
                const newMessage = e.target.value;
                setMessage(newMessage);
                
                // Real-time content filtering (lenient for typing)
                if (newMessage.trim()) {
                  const contentCheck = filterContentLenient(newMessage);
                  const prohibitedWordsCheck = checkProhibitedWords(newMessage);
                  
                  // Show warning if either filter fails
                  if (!contentCheck.isAllowed) {
                    setContentWarning(contentCheck.message || 'Content violates our guidelines');
                    setHasContentViolation(true);
                  } else if (!prohibitedWordsCheck.isAllowed) {
                    setContentWarning(prohibitedWordsCheck.message);
                    setHasContentViolation(true);
                  } else {
                    setContentWarning(null);
                    setHasContentViolation(false);
                  }
                } else {
                  setContentWarning(null);
                  setHasContentViolation(false);
                }
              }}
              onKeyPress={handleKeyPress}
              placeholder={
                isLoRAActive && selectedLora
                  ? `Chat in ${selectedLora.name} mode...`
                  : placeholder
              }
              disabled={disabled || isSending}
              className={`flex-1 min-w-0 bg-transparent text-zinc-200 placeholder-zinc-400 outline-none text-sm py-2 px-2 focus:ring-1 rounded-md disabled:opacity-50 transition-colors ${
                hasContentViolation 
                  ? 'focus:ring-red-500/30 ring-1 ring-red-500/30' 
                  : 'focus:ring-orange-500/30'
              }`}
            />

            {/* Voice Call Controls */}
            <div className="flex items-center space-x-1 flex-shrink-0">
              {/* Voice Call Toggle Button */}
              <div className="relative">
                <button 
                  type="button"
                  onClick={handleVoiceToggle}
                  disabled={disabled || isConnecting}
                  className={`p-2 rounded-md transition-all duration-200 disabled:opacity-50 ${
                    isCallActive 
                      ? 'bg-red-500/20 hover:bg-red-500/30 text-red-400' 
                      : 'bg-green-500/20 hover:bg-green-500/30 text-green-400'
                  }`}
                  title={isCallActive ? `End call with ${characterName}` : `Start voice call with ${characterName}`}
                >
                  {isConnecting ? (
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  ) : isCallActive ? (
                    <PhoneOff size={16} />
                  ) : (
                    <Phone size={16} />
                  )}
                </button>
                
                {/* Beta Badge */}
                <div className="absolute -top-1 -right-1 bg-gradient-to-r from-orange-500 to-amber-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full shadow-lg border border-orange-400/50 z-10">
                  BETA
                </div>
              </div>

              {/* Microphone Toggle (only visible during call) */}
              {isCallActive && (
                <button 
                  type="button"
                  onClick={handleMicToggle}
                  className={`p-2 rounded-md transition-all duration-200 ${
                    isMuted 
                      ? 'bg-red-500/20 hover:bg-red-500/30 text-red-400' 
                      : 'bg-orange-500/20 hover:bg-orange-500/30 text-orange-400'
                  }`}
                  title={isMuted ? 'Unmute microphone' : 'Mute microphone'}
                >
                  {isMuted ? <MicOff size={16} /> : <Mic size={16} />}
                </button>
              )}
            </div>

            {/* Send button */}
            <button 
              type="submit"
              disabled={!message.trim() || isSending || disabled || hasContentViolation}
              className={`flex-shrink-0 p-2 rounded-lg transition-all duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed ${
                hasContentViolation
                  ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-red-500/20'
                  : 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-orange-500/20'
              }`}
              title={hasContentViolation ? 'Message contains restricted content' : 'Send message'}
            >
              {isSending ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : hasContentViolation ? (
                <AlertTriangle size={16} className="text-white" />
              ) : (
                <Send size={16} className="text-white" />
              )}
            </button>
          </div>

          {/* Bottom row: [ Options + Image Generation + Sliders icon ] */}
          <div className="flex items-center justify-between px-3 pb-2">
            <div className="flex items-center space-x-2">
              {/* Chat Options Menu with LoRA Integration */}
              <ChatOptionsMenu 
                disabled={disabled} 
                onLoRASelect={handleLoRASelect}
                selectedLoRAId={getSelectedLoRAId()}
              />
              
              {/* Image Generation Button */}
              <button
                type="button"
                onClick={onOpenImageModal}
                disabled={disabled}
                className="p-2 rounded-md bg-zinc-700/50 hover:bg-orange-500/20 text-zinc-400 hover:text-orange-400 transition-all duration-200 disabled:opacity-50"
                title="Generate Image"
              >
                <ImageIcon size={16} />
              </button>
            </div>
            
            <div className="flex items-center space-x-3">
              <SlidersHorizontal 
                size={16} 
                className={`hover:text-orange-400 cursor-pointer transition-colors ${
                  disabled ? 'text-orange-400/30' : 'text-orange-400/70'
                }`} 
              />
            </div>
          </div>

          {/* Content Warning Display */}
          {contentWarning && (
            <div className="mx-3 mb-2 p-2 bg-red-900/20 border border-red-500/50 rounded-lg">
              <div className="flex items-center gap-2 text-red-400">
                <AlertTriangle size={14} />
                <span className="text-xs font-medium">Content Warning</span>
              </div>
              <p className="text-xs text-red-300 mt-1">{contentWarning}</p>
            </div>
          )}
        </div>
      </form>
    </div>
  );
}
