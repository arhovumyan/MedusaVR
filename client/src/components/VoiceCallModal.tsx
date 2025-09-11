import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/button';
import { Phone, PhoneOff } from 'lucide-react';
import { useVoiceCall, VoiceTranscript, VoiceAIResponse } from '@/hooks/useVoiceCall';

interface VoiceCallModalProps {
  isOpen: boolean;
  onClose: () => void;
  characterId: string;
  characterName: string;
  characterAvatar?: string;
}

export const VoiceCallModal: React.FC<VoiceCallModalProps> = ({
  isOpen,
  onClose,
  characterId,
  characterName,
  characterAvatar
}) => {
  const [transcripts, setTranscripts] = useState<VoiceTranscript[]>([]);
  const [aiResponses, setAIResponses] = useState<VoiceAIResponse[]>([]);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isTalking, setIsTalking] = useState(false);
  const [hasStartedCall, setHasStartedCall] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  const {
    isCallActive,
    isRecording,
    connectionStatus,
    error,
    startCall,
    endCall
  } = useVoiceCall({
    characterId,
    characterName,
    onTranscript: (transcript) => {
      setTranscripts(prev => [...prev.slice(-9), transcript]);
    },
    onAIResponse: (response) => {
      setAIResponses(prev => [...prev.slice(-4), response]);
      // Trigger talking animation
      setIsTalking(true);
      setTimeout(() => setIsTalking(false), 3000); // Stop after 3 seconds
    },
    onAudioReceived: (audio) => {
      console.log('🔊 Audio received from:', audio.characterName);
      setIsTalking(true);
      setTimeout(() => setIsTalking(false), 3000);
    },
    onError: (errorMessage) => {
      console.error('Voice call error:', errorMessage);
      setConnectionError(errorMessage);
      setIsConnecting(false);
      setHasStartedCall(false);
    }
  });

  // Handle modal opening - simulate calling
  useEffect(() => {
    if (isOpen && !isCallActive && !hasStartedCall) {
      console.log('🎬 Voice Modal: Opening modal for character:', characterName);
      setIsConnecting(true);
      setHasStartedCall(true);
      
      // Simulate connecting delay
      const connectTimeout = setTimeout(async () => {
        console.log('🎬 Voice Modal: Starting voice call...');
        console.log('🎬 Voice Modal: startCall function available:', typeof startCall);
        setIsConnecting(false);
        
        try {
          const result = await startCall();
          console.log('🎬 Voice Modal: Start call result:', result);
        } catch (error) {
          console.error('🎬 Voice Modal: Failed to start call:', error);
          setConnectionError((error as Error).message || 'Failed to start call');
          setIsConnecting(false);
          setHasStartedCall(false);
        }
      }, 2000); // 2 second connecting simulation

      return () => clearTimeout(connectTimeout);
    }
  }, [isOpen, isCallActive, hasStartedCall, startCall]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setHasStartedCall(false);
      setIsConnecting(false);
      setTranscripts([]);
      setAIResponses([]);
      setIsTalking(false);
      setConnectionError(null);
    }
  }, [isOpen]);

  // Handle call ending
  const handleEndCall = () => {
    if (isCallActive) {
      endCall();
    }
    setHasStartedCall(false);
    setIsConnecting(false);
    onClose();
  };

  // Don't render if modal is not open
  if (!isOpen) return null;

  console.log('🎬 Voice Modal: Rendering modal for character:', characterName, 'isOpen:', isOpen);

  const modalContent = (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black bg-opacity-80 p-4"
         style={{ zIndex: 999999 }}>
      <div className="bg-gray-800 border-2 border-orange-500 rounded-lg p-8 max-w-md w-full text-center shadow-2xl"
           style={{ transform: 'translateY(-50px)' }}>
        
        {/* Character Avatar */}
        <div className="mb-6">
          <div className={`
            w-32 h-32 mx-auto rounded-full border-4 border-orange-500 overflow-hidden
            ${(isTalking || isConnecting) ? 'animate-pulse' : ''}
            transition-all duration-300
          `}>
            {characterAvatar ? (
              <img 
                src={characterAvatar} 
                alt={characterName}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center">
                <span className="text-white text-4xl font-bold">
                  {characterName.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Character Name */}
        <h2 className="text-xl font-semibold text-white mb-2">{characterName}</h2>

        {/* Status Text */}
        <div className="mb-6 text-gray-300">
          {isConnecting && (
            <div className="flex items-center justify-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-500"></div>
              <span>Calling...</span>
            </div>
          )}
          {isCallActive && !isConnecting && !connectionError && (
            <div className="text-green-400">Connected</div>
          )}
          {connectionError && (
            <div className="text-red-400">
              {connectionError.includes('already active') ? 'Call in progress...' : 'Connection failed'}
            </div>
          )}
        </div>

        {/* Recording Indicator */}
        {isCallActive && isRecording && (
          <div className="mb-4 flex items-center justify-center space-x-2 text-green-400">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-sm">Listening...</span>
          </div>
        )}

        {/* Recent Conversation */}
        {isCallActive && (transcripts.length > 0 || aiResponses.length > 0) && (
          <div className="mb-6 max-h-32 overflow-y-auto bg-gray-700 rounded-lg p-3 text-left">
            {transcripts.slice(-2).map((transcript, index) => (
              <div key={index} className="text-blue-300 text-sm mb-1">
                You: {transcript.text}
              </div>
            ))}
            {aiResponses.slice(-2).map((response, index) => (
              <div key={index} className="text-orange-300 text-sm mb-1">
                {characterName}: {response.text}
              </div>
            ))}
          </div>
        )}

        {/* Hang Up Button */}
        <Button
          onClick={handleEndCall}
          variant="destructive"
          size="lg"
          className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-700 border-2 border-red-500"
        >
          <PhoneOff className="w-8 h-8" />
        </Button>
      </div>
    </div>
  );

  // Use portal to render at document root, avoiding z-index stacking context issues
  return createPortal(modalContent, document.body);
};
