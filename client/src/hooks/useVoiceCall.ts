import { useState, useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '@/hooks/useAuth';

export interface VoiceCallState {
  isCallActive: boolean;
  isConnecting: boolean;
  isRecording: boolean;
  isMuted: boolean;
  connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'error';
  error: string | null;
  sessionId: string | null;
  characterName: string | null;
}

export interface VoiceTranscript {
  userId: string;
  username: string;
  text: string;
  isFinal: boolean;
  timestamp: Date;
}

export interface VoiceAIResponse {
  characterId: string;
  characterName: string;
  text: string;
  timestamp: Date;
}

export interface VoiceAudio {
  characterId: string;
  characterName: string;
  audio: string; // base64 encoded audio
  text: string;
  timestamp: Date;
}

export interface UseVoiceCallOptions {
  characterId: string;
  characterName: string;
  onTranscript?: (transcript: VoiceTranscript) => void;
  onAIResponse?: (response: VoiceAIResponse) => void;
  onAudioReceived?: (audio: VoiceAudio) => void;
  onError?: (error: string) => void;
}

// Helper function to create WAV blob from raw PCM data
function createWavBlob(pcmData: Uint8Array, sampleRate: number, numChannels: number): Blob {
  const byteRate = sampleRate * numChannels * 2; // 16-bit samples
  const blockAlign = numChannels * 2;
  const dataSize = pcmData.length;
  const chunkSize = 36 + dataSize;

  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  // WAV header
  // "RIFF" chunk descriptor
  view.setUint32(0, 0x52494646, false); // "RIFF"
  view.setUint32(4, chunkSize, true); // File size
  view.setUint32(8, 0x57415645, false); // "WAVE"

  // "fmt " sub-chunk
  view.setUint32(12, 0x666d7420, false); // "fmt "
  view.setUint32(16, 16, true); // Sub-chunk size
  view.setUint16(20, 1, true); // Audio format (PCM)
  view.setUint16(22, numChannels, true); // Number of channels
  view.setUint32(24, sampleRate, true); // Sample rate
  view.setUint32(28, byteRate, true); // Byte rate
  view.setUint16(32, blockAlign, true); // Block align
  view.setUint16(34, 16, true); // Bits per sample

  // "data" sub-chunk
  view.setUint32(36, 0x64617461, false); // "data"
  view.setUint32(40, dataSize, true); // Data size

  // Copy PCM data
  const samples = new Uint8Array(buffer, 44);
  samples.set(pcmData);

  return new Blob([buffer], { type: 'audio/wav' });
}

export function useVoiceCall({
  characterId,
  characterName,
  onTranscript,
  onAIResponse,
  onAudioReceived,
  onError
}: UseVoiceCallOptions) {
  const { user, isAuthenticated } = useAuth();
  const [state, setState] = useState<VoiceCallState>({
    isCallActive: false,
    isConnecting: false,
    isRecording: false,
    isMuted: false,
    connectionStatus: 'disconnected',
    error: null,
    sessionId: null,
    characterName: null
  });

  const socketRef = useRef<Socket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  // Get the API base URL
  const getApiBaseUrl = (): string => {
    // Check for explicit API URL from environment
    if (import.meta.env.VITE_API_URL) {
      return import.meta.env.VITE_API_URL;
    }
    
    const hostname = window.location.hostname;
    const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
    
    if (isLocalhost) {
      return 'http://localhost:5002';
    }
    
    // Production URLs - fix the backend URL
    if (hostname === 'medusavr.art') {
      return 'https://vrfansbackend.up.railway.app';
    }
    
    // Default fallback
    return 'https://vrfansbackend.up.railway.app';
  };

  // Get socket URL
  const getSocketUrl = (): string => {
    if (import.meta.env.VITE_SOCKET_URL) {
      return import.meta.env.VITE_SOCKET_URL;
    }
    return getApiBaseUrl();
  };

  // Initialize socket connection - OPTIMIZED
  const initializeSocket = useCallback(() => {
    if (!isAuthenticated || !user || socketRef.current) return;

    const token = localStorage.getItem('medusavr_access_token');
    if (!token) {
      setState(prev => ({ ...prev, error: 'Authentication token not found' }));
      return;
    }

    const socketUrl = getSocketUrl();
    console.log('🎤 Connecting to voice socket:', socketUrl);

    socketRef.current = io(socketUrl, {
      auth: { token, characterId },
      transports: ['websocket', 'polling'],
      timeout: 10000,
      reconnection: true,
      reconnectionAttempts: 3,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000
    });

    const socket = socketRef.current;

    // Enhanced connection events
    socket.on('connect', () => {
      console.log('🎤 Voice socket connected');
      setState(prev => ({ 
        ...prev, 
        connectionStatus: 'connected',
        error: null
      }));
    });

    socket.on('disconnect', (reason) => {
      console.log('🎤 Voice socket disconnected:', reason);
      setState(prev => ({ 
        ...prev, 
        connectionStatus: 'disconnected',
        isCallActive: false,
        sessionId: null,
        error: reason === 'io server disconnect' ? 'Server disconnected the voice call' : null
      }));
    });

    socket.on('connect_error', (error) => {
      console.error('❌ Voice socket connection error:', error);
      setState(prev => ({ 
        ...prev, 
        connectionStatus: 'error',
        error: `Connection failed: ${error.message}` 
      }));
      onError?.(`Connection failed: ${error.message}`);
    });

    socket.on('reconnect_failed', () => {
      console.error('❌ Voice socket reconnection failed');
      setState(prev => ({ 
        ...prev, 
        connectionStatus: 'error',
        error: 'Failed to reconnect to voice service'
      }));
      onError?.('Failed to reconnect to voice service');
    });

    // Voice-specific events
    socket.on('voice-transcript', (transcript: VoiceTranscript) => {
      console.log('📝 Voice transcript:', transcript);
      onTranscript?.(transcript);
    });

    socket.on('voice-ai-response', (response: VoiceAIResponse) => {
      console.log('🤖 Voice AI response:', response);
      onAIResponse?.(response);
    });

    socket.on('voice-audio', (audio: VoiceAudio) => {
      console.log('🔊 Voice audio received');
      playAudio(audio.audio);
      onAudioReceived?.(audio);
    });

    socket.on('voice-error', (error: { message: string; sessionKey?: string }) => {
      console.error('❌ Voice error:', error);
      const errorMessage = error.message || 'Voice service error';
      setState(prev => ({ ...prev, error: errorMessage }));
      onError?.(errorMessage);
    });

    // Enhanced room event handlers
    socket.on('voice-room-joined', (response: { success: boolean; sessionKey?: string; error?: string }) => {
      if (response.success) {
        console.log('🎤 Successfully joined voice room:', response.sessionKey);
      } else {
        console.error('❌ Failed to join voice room:', response.error);
        setState(prev => ({ ...prev, error: response.error || 'Failed to join voice room' }));
        onError?.(response.error || 'Failed to join voice room');
      }
    });

    socket.on('voice-room-left', (response: { success: boolean; error?: string }) => {
      if (response.success) {
        console.log('🔇 Successfully left voice room');
      } else {
        console.error('❌ Failed to leave voice room:', response.error);
      }
    });

    socket.on('voice-call-ended', () => {
      console.log('🔚 Voice call ended');
      setState(prev => ({
        ...prev,
        isCallActive: false,
        isRecording: false,
        sessionId: null
      }));
    });

    socket.on('voice-insufficient-coins', (data: { message: string; coinsSpent: number; duration: number }) => {
      console.log('💰 Voice call ended due to insufficient coins:', data);
      setState(prev => ({
        ...prev,
        isCallActive: false,
        isRecording: false,
        sessionId: null,
        error: `${data.message} (Duration: ${data.duration}s, Coins used: ${data.coinsSpent})`
      }));
      onError?.(`${data.message} (Duration: ${data.duration}s, Coins used: ${data.coinsSpent})`);
    });

  }, [isAuthenticated, user, characterId, onTranscript, onAIResponse, onAudioReceived, onError]);

  // Start voice call
  const startCall = async (): Promise<boolean> => {
    try {
      setState(prev => ({ ...prev, isConnecting: true, error: null }));

      // Initialize socket if not connected
      if (!socketRef.current || !socketRef.current.connected) {
        initializeSocket();
        
        // Wait for connection
        await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => reject(new Error('Connection timeout')), 10000);
          
          const checkConnection = () => {
            if (socketRef.current?.connected) {
              clearTimeout(timeout);
              resolve(void 0);
            } else {
              setTimeout(checkConnection, 100);
            }
          };
          
          checkConnection();
        });
      }

      // Start voice call via API
      const token = localStorage.getItem('medusavr_access_token');
      const response = await fetch(`${getApiBaseUrl()}/api/voice/start/${characterId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to start voice call');
      }

      const data = await response.json();
      console.log('🎤 Voice call started:', data);

      setState(prev => ({
        ...prev,
        isCallActive: true,
        isConnecting: false,
        sessionId: data.sessionId,
        characterName: data.characterName
      }));

      // Join voice room with callback confirmation
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Voice room join timeout'));
        }, 5000);

        socketRef.current?.emit('voice-join-room', { characterId }, (response: any) => {
          clearTimeout(timeout);
          if (response?.success) {
            console.log('🎤 Successfully joined voice room');
            resolve();
          } else {
            reject(new Error(response?.error || 'Failed to join voice room'));
          }
        });
      });

      // Start audio recording
      await startRecording();

      return true;
    } catch (error) {
      console.error('❌ Error starting voice call:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to start voice call';
      setState(prev => ({ 
        ...prev, 
        isConnecting: false, 
        error: errorMessage 
      }));
      onError?.(errorMessage);
      return false;
    }
  };

  // End voice call
  const endCall = async (): Promise<boolean> => {
    try {
      // Stop recording
      await stopRecording();

      // Leave voice room with callback confirmation
      if (socketRef.current?.connected) {
        await new Promise<void>((resolve) => {
          const timeout = setTimeout(() => {
            console.warn('⚠️ Voice room leave timeout - continuing anyway');
            resolve();
          }, 3000);

          socketRef.current?.emit('voice-leave-room', { characterId }, (response: any) => {
            clearTimeout(timeout);
            if (response?.success) {
              console.log('🔇 Successfully left voice room');
            } else {
              console.warn('⚠️ Voice room leave failed:', response?.error);
            }
            resolve();
          });
        });
      }

      // End voice call via API
      const token = localStorage.getItem('medusavr_access_token');
      const response = await fetch(`${getApiBaseUrl()}/api/voice/end/${characterId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to end voice call');
      }

      setState(prev => ({
        ...prev,
        isCallActive: false,
        isRecording: false,
        sessionId: null
      }));

      console.log('🔚 Voice call ended successfully');
      return true;
    } catch (error) {
      console.error('❌ Error ending voice call:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to end voice call';
      setState(prev => ({ ...prev, error: errorMessage }));
      onError?.(errorMessage);
      return false;
    }
  };

  // Start audio recording
  const startRecording = async (): Promise<void> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true
        }
      });

      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      // Send audio data in real-time
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0 && socketRef.current) {
          // Convert to ArrayBuffer and send
          event.data.arrayBuffer().then(buffer => {
            const audioData = new Uint8Array(buffer);
            socketRef.current?.emit('voice-audio-data', {
              characterId,
              audioData: Array.from(audioData)
            });
          });
        }
      };

      // Capture audio chunks every 250ms
      mediaRecorder.start(250);

      setState(prev => ({ ...prev, isRecording: true }));
      console.log('🎤 Audio recording started');
    } catch (error) {
      console.error('❌ Error starting audio recording:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to start recording';
      setState(prev => ({ ...prev, error: errorMessage }));
      onError?.(errorMessage);
    }
  };

  // Stop audio recording
  const stopRecording = async (): Promise<void> => {
    try {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }

      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }

      setState(prev => ({ ...prev, isRecording: false }));
      console.log('🎤 Audio recording stopped');
    } catch (error) {
      console.error('❌ Error stopping audio recording:', error);
    }
  };

  // Toggle mute
  const toggleMute = (): void => {
    const newMutedState = !state.isMuted;
    
    if (streamRef.current) {
      streamRef.current.getAudioTracks().forEach(track => {
        track.enabled = !newMutedState;
      });
    }

    setState(prev => ({ ...prev, isMuted: newMutedState }));
    
    // Notify other participants with callback confirmation
    if (socketRef.current?.connected) {
      socketRef.current.emit('voice-mute', { 
        characterId, 
        muted: newMutedState 
      }, (response: any) => {
        if (response?.success) {
          console.log(`🔇 Voice ${newMutedState ? 'muted' : 'unmuted'} confirmed`);
        } else {
          console.warn('⚠️ Voice mute confirmation failed:', response?.error);
        }
      });
    }

    console.log(`🔇 Voice ${newMutedState ? 'muted' : 'unmuted'}`);
  };

  // Play received audio
  const playAudio = (audioBase64: string): void => {
    try {
      // Decode base64 to get raw linear16 PCM data
      const rawAudioData = Uint8Array.from(atob(audioBase64), c => c.charCodeAt(0));
      
      // Convert linear16 PCM to WAV format
      const wavBlob = createWavBlob(rawAudioData, 16000, 1); // 16kHz, mono
      
      const audioUrl = URL.createObjectURL(wavBlob);
      
      if (audioPlayerRef.current) {
        audioPlayerRef.current.src = audioUrl;
        audioPlayerRef.current.play().catch(error => {
          console.error('❌ Error playing audio:', error);
        });
      } else {
        const audio = new Audio(audioUrl);
        audioPlayerRef.current = audio;
        audio.play().catch(error => {
          console.error('❌ Error playing audio:', error);
        });
      }
    } catch (error) {
      console.error('❌ Error processing audio:', error);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (state.isCallActive) {
        endCall();
      }
      
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Initialize socket when authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      initializeSocket();
    } else {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    }
  }, [isAuthenticated, user, initializeSocket]);

  // Connection health monitoring
  const checkConnectionHealth = useCallback(async (): Promise<boolean> => {
    if (!socketRef.current?.connected) {
      return false;
    }

    try {
      const startTime = Date.now();
      
      return new Promise((resolve) => {
        const timeout = setTimeout(() => {
          console.warn('⚠️ Voice connection health check timeout');
          resolve(false);
        }, 3000);

        socketRef.current?.emit('voice-ping', { 
          characterId, 
          timestamp: startTime 
        }, (response: any) => {
          clearTimeout(timeout);
          if (response?.success) {
            const latency = Date.now() - startTime;
            console.log(`🏥 Voice connection healthy (latency: ${latency}ms)`);
            resolve(true);
          } else {
            console.warn('⚠️ Voice connection health check failed');
            resolve(false);
          }
        });
      });
    } catch (error) {
      console.error('❌ Voice connection health check error:', error);
      return false;
    }
  }, [characterId]);

  // Periodic connection health monitoring during active calls
  useEffect(() => {
    if (!state.isCallActive) return;

    const healthCheckInterval = setInterval(async () => {
      const isHealthy = await checkConnectionHealth();
      if (!isHealthy && state.isCallActive) {
        console.warn('⚠️ Voice connection unhealthy during active call');
        setState(prev => ({ 
          ...prev, 
          error: 'Connection quality degraded' 
        }));
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(healthCheckInterval);
  }, [state.isCallActive, checkConnectionHealth]);

  return {
    ...state,
    startCall,
    endCall,
    toggleMute,
    checkConnectionHealth
  };
}
