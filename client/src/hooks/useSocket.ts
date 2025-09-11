import { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "./useAuth";
import { auth } from "@/components/firebase/firebase.config";

export interface ChatMessage {
  id: string;
  senderId: string;
  senderType: "user" | "ai";
  content: string;
  timestamp: Date;
  characterId: string;
  characterName?: string;
}

export function useSocket(
  characterId: string, 
  onMessage: (msg: ChatMessage) => void, 
  onTyping?: (name: string) => void
) {
  const { isAuthenticated } = useAuth();
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    if (!characterId || !isAuthenticated) return;

    const connectSocket = async () => {
      try {
        setIsConnecting(true);
        
        // Get Firebase ID token
        const user = auth.currentUser;
        if (!user) {
          console.error('No Firebase user available for socket connection');
          setIsConnecting(false);
          return;
        }

        const token = await user.getIdToken();
        
        if (!token) {
          console.error('No auth token available for socket connection');
          setIsConnecting(false);
          return;
        }

        // Socket.IO specific URL resolution
        const getSocketUrl = (): string => {
          const hostname = window.location.hostname;
          const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
          const isDevelopment = import.meta.env.DEV || import.meta.env.VITE_APP_ENV === 'development' || hostname === 'localhost';
          
          if (import.meta.env.DEV || import.meta.env.VITE_APP_ENV === 'development') {
            console.log('🔍 Socket URL resolution:', {
              hostname,
              isLocalhost,
              isDevelopment,
              VITE_SOCKET_URL: import.meta.env.VITE_SOCKET_URL,
              VITE_API_URL: import.meta.env.VITE_API_URL
            });
          }
          
          // 1. First check for VITE_SOCKET_URL specifically for Socket.IO
          if (import.meta.env.VITE_SOCKET_URL) {
            if (import.meta.env.DEV || import.meta.env.VITE_APP_ENV === 'development') {
              console.log('✅ Using VITE_SOCKET_URL:', import.meta.env.VITE_SOCKET_URL);
            }
            return import.meta.env.VITE_SOCKET_URL;
          }
          
          // 2. Check for Docker environment (when running via Docker compose)
          // In Docker, the frontend runs on localhost:80 and backend on localhost:5002
          if (isLocalhost && window.location.port === '80') {
            if (import.meta.env.DEV || import.meta.env.VITE_APP_ENV === 'development') {
              console.log('✅ Using Docker localhost backend URL');
            }
            return 'http://localhost:5002';
          }
          
          // 3. For local development (running with npm run dev)
          if (isLocalhost && isDevelopment) {
            if (import.meta.env.DEV || import.meta.env.VITE_APP_ENV === 'development') {
              console.log('✅ Using localhost development URL');
            }
            return 'http://localhost:5002';
          }
          
          // 4. Fallback to API URL if available
          if (import.meta.env.VITE_API_URL) {
            if (import.meta.env.DEV || import.meta.env.VITE_APP_ENV === 'development') {
              console.log('✅ Using VITE_API_URL:', import.meta.env.VITE_API_URL);
            }
            return import.meta.env.VITE_API_URL;
          }
          
          // 5. Production fallback: use Railway backend URL
          if (hostname.includes('vercel.app') || !isLocalhost) {
            if (import.meta.env.DEV || import.meta.env.VITE_APP_ENV === 'development') {
              console.log('✅ Using production Railway URL');
            }
            return 'https://vrfansbackend.up.railway.app';
          }
          
          // 6. Last resort: use localhost with port
          if (import.meta.env.DEV || import.meta.env.VITE_APP_ENV === 'development') {
            console.log('⚠️ Using last resort localhost URL');
          }
          return 'http://localhost:5002';
        };

        const socketUrl = getSocketUrl();

        if (import.meta.env.DEV || import.meta.env.VITE_APP_ENV === 'development') {
          console.log('🔌 Socket.IO Configuration:', {
            'VITE_SOCKET_URL': import.meta.env.VITE_SOCKET_URL,
            'VITE_API_URL': import.meta.env.VITE_API_URL,
            'DEV': import.meta.env.DEV,
            'hostname': window.location.hostname,
            'socketUrl': socketUrl,
            'characterId': characterId
          });
        }

        const socket = io(socketUrl, {
          auth: { 
            token, 
            characterId 
          },
          transports: ['websocket', 'polling'],
          timeout: 10000,
          reconnection: true,
          reconnectionAttempts: 5,
          reconnectionDelay: 1000,
          forceNew: true, // Force a new connection
        });

        socketRef.current = socket;

        socket.on("connect", () => {
          if (import.meta.env.DEV || import.meta.env.VITE_APP_ENV === 'development') {
            console.log('✅ Socket connected');
          }
          setIsConnected(true);
          setIsConnecting(false);
        });

        socket.on("disconnect", (reason) => {
          if (import.meta.env.DEV || import.meta.env.VITE_APP_ENV === 'development') {
            console.log('❌ Socket disconnected:', reason);
          }
          setIsConnected(false);
          setIsConnecting(false);
        });

        socket.on("connect_error", (error) => {
          if (import.meta.env.DEV || import.meta.env.VITE_APP_ENV === 'development') {
            console.error('❌ Socket connection error:', error.message);
            console.error('❌ Full error:', error);
          }
          setIsConnected(false);
          setIsConnecting(false);
        });

        socket.on("receive-message", (data) => {
          if (import.meta.env.DEV || import.meta.env.VITE_APP_ENV === 'development') {
            console.log('📨 Received message:', data);
          }
          onMessage({
            id: data.id,
            senderId: data.senderId,
            senderType: data.senderType,
            content: data.content,
            timestamp: new Date(data.timestamp),
            characterId: data.characterId,
            characterName: data.characterName
          });
        });

        socket.on("typing", (data) => {
          if (import.meta.env.DEV || import.meta.env.VITE_APP_ENV === 'development') {
            console.log('⌨️ Typing indicator:', data);
          }
          if (onTyping && data.characterName) {
            onTyping(data.characterName);
          }
        });

        socket.on("reconnect", () => {
          if (import.meta.env.DEV || import.meta.env.VITE_APP_ENV === 'development') {
            console.log('🔄 Socket reconnected');
          }
          setIsConnected(true);
          setIsConnecting(false);
        });

        socket.on("reconnect_error", (error) => {
          if (import.meta.env.DEV || import.meta.env.VITE_APP_ENV === 'development') {
            console.error('❌ Socket reconnection error:', error);
          }
        });

      } catch (error) {
        if (import.meta.env.DEV || import.meta.env.VITE_APP_ENV === 'development') {
          console.error('❌ Socket setup error:', error);
        }
        setIsConnected(false);
        setIsConnecting(false);
      }
    };

    connectSocket();

    return () => {
      if (socketRef.current) {
        console.log('🔌 Disconnecting socket');
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      setIsConnected(false);
      setIsConnecting(false);
    };
  }, [characterId, isAuthenticated, onMessage, onTyping]);

  const sendMessage = useCallback((content: string) => {
    if (!socketRef.current || !isConnected) {
      console.log('❌ Cannot send message: socket not connected');
      return false;
    }

    try {
      const message = {
        content,
        characterId,
        timestamp: new Date().toISOString(),
      };

      console.log('📤 Sending message:', message);
      socketRef.current.emit("send-message", message);
      return true;
    } catch (error) {
      console.error('❌ Error sending message:', error);
      return false;
    }
  }, [isConnected, characterId]);

  return { 
    isConnected, 
    isConnecting, 
    sendMessage 
  };
}
