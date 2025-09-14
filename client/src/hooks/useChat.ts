// src/hooks/useChat.ts
import { useEffect, useRef, useState } from "react"; //manage component state
import { io, Socket } from "socket.io-client"; //socket.io client library
import { useAuth } from "./useAuth"; // custom hook to manage authentication

// Define the structure of a message
interface Message {
  id: string;
  content: string;
  senderType: "user" | "ai";
  characterName?: string;
  timestamp?: Date;
  imageUrl?: string;
  imagePrompt?: string;
  isImageLoading?: boolean;
  jobId?: string; // For tracking image generation jobs
}

// Define the options for the useChat hook
interface UseChatOptions {
  characterId: string;
  characterName?: string;
}

// Define the return type for the useChat hook
interface BanInfo {
  banned: boolean;
  banType: 'temporary' | 'permanent';
  message: string;
  action?: string;
  violationCount?: number;
  violationType?: string;
}

interface UseChatReturn {
  messages: Message[];
  isTyping: boolean;
  typingCharacter: string | null;
  chatError: string | null;
  connectionStatus: 'connected' | 'disconnected' | 'connecting';
  sendMessage: (text: string, loraContext?: any) => Promise<boolean>;
  addImageMessage: (imageUrl: string, prompt: string) => void;
  addLoadingImageMessage: (prompt: string, jobId: string) => string; // Returns message ID
  updateImageMessage: (messageId: string, imageUrl: string) => void;
  removeMessage: (messageId: string) => void;
  clearError: () => void;
  coinBalance: number | null;
  banInfo: BanInfo | null;
  showBanModal: boolean;
  closeBanModal: () => void;
}

// Global socket instance
let socket: Socket | null = null;

//grabs the current user and character information from the auth context
export function useChat({ characterId, characterName }: UseChatOptions): UseChatReturn {
  const { user, isAuthenticated } = useAuth(); 
  const [coinBalance, setCoinBalance] = useState<number | null>(user?.coins ?? null); 

  // State variables to manage chat messages, typing status, errors, and connection status
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [typingCharacter, setTypingCharacter] = useState<string | null>(null);
  const [chatError, setChatError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting'>('connecting');
  const [banInfo, setBanInfo] = useState<BanInfo | null>(null);
  const [showBanModal, setShowBanModal] = useState(false);
  const buffer = useRef<string>("");



  useEffect(() => {
    const fetchConversation = async () => {
      console.log(`Fetching conversation for characterId: ${characterId}`);
      try {
        const token = localStorage.getItem("medusavr_access_token");
        const response = await fetch(`/api/conversations/${characterId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        console.log("API Response Status:", response.status);

        if (response.ok) {
          const data = await response.json();
          console.log("Received conversation data:", data);
          if (Array.isArray(data)) {
            // Ensure each message has a senderType, defaulting if necessary
            const formattedMessages = data.map((msg: any) => ({
              id: msg.id || msg.messageId || crypto.randomUUID(), // Use messageId from backend or generate new
              content: msg.content,
              senderType: msg.senderType || (msg.sender === "user" ? "user" : "ai"), // Handle potential old 'sender' field
              timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date(),
              imageUrl: msg.imageUrl, // Add image URL support for persistence
              imagePrompt: msg.imagePrompt, // Add image prompt support for persistence
            }));
            setMessages(formattedMessages);
          } else {
            console.error("Received data is not an array:", data);
          }
        } else {
          const errorData = await response.text();
          console.error("Failed to fetch conversation. Status:", response.status, "Body:", errorData);
        }
      } catch (error) {
        console.error("Error fetching conversation:", error);
      }
    };

    if (isAuthenticated) {
      fetchConversation();
    }
  }, [characterId, isAuthenticated]);
  useEffect(() => {
    if (!isAuthenticated || !user || !characterName) {
      setConnectionStatus("disconnected");
      return;
    }

    // grabs the JWT token from localStorage
    const setupSocket = async () => {
      const token = localStorage.getItem("medusavr_access_token");

      // If the token is not available, set an error and disconnect
      if (!token) {
        setChatError("Missing auth token");
        setConnectionStatus("disconnected");
        return;
      }

      // Socket.IO URL configuration
      const getSocketUrl = (): string => {
        const hostname = window.location.hostname;
        const port = window.location.port;
        const protocol = window.location.protocol;
        const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
        const isDevelopment = import.meta.env.DEV || import.meta.env.MODE === 'development' || hostname === 'localhost';
        
        if (import.meta.env.DEV || import.meta.env.VITE_APP_ENV === 'development') {
          console.log('🔍 Socket URL resolution:', {
            hostname,
            port,
            protocol,
            isLocalhost,
            isDevelopment,
            MODE: import.meta.env.MODE,
            DEV: import.meta.env.DEV,
            VITE_SOCKET_URL: import.meta.env.VITE_SOCKET_URL,
            VITE_API_URL: import.meta.env.VITE_API_URL,
            currentOrigin: window.location.origin
          });
        }
        
        // 1. First check for VITE_SOCKET_URL specifically for Socket.IO
        if (import.meta.env.VITE_SOCKET_URL) {
          if (import.meta.env.DEV || import.meta.env.VITE_APP_ENV === 'development') {
            console.log('✅ Using VITE_SOCKET_URL:', import.meta.env.VITE_SOCKET_URL);
          }
          return import.meta.env.VITE_SOCKET_URL;
        }
        
        // 2. For local development - always connect directly to backend (bypass Vite proxy issues)
        if (isLocalhost && isDevelopment) {
          if (import.meta.env.DEV || import.meta.env.VITE_APP_ENV === 'development') {
            console.log('✅ Using direct backend connection for development');
          }
          return 'http://localhost:5002';
        }
        
        // 3. Fallback to API URL if available
        if (import.meta.env.VITE_API_URL) {
          if (import.meta.env.DEV || import.meta.env.VITE_APP_ENV === 'development') {
            console.log('✅ Using VITE_API_URL:', import.meta.env.VITE_API_URL);
          }
          return import.meta.env.VITE_API_URL;
        }
        
        // 4. Production fallback: use relative URLs to leverage Vercel proxy
        if (hostname.includes('vercel.app') || !isLocalhost) {
          if (import.meta.env.DEV || import.meta.env.VITE_APP_ENV === 'development') {
            console.log('✅ Using relative URLs for Vercel proxy');
          }
          return '';
        }
        
        // 5. Last resort: direct connection to backend
        if (import.meta.env.DEV || import.meta.env.VITE_APP_ENV === 'development') {
          console.log('⚠️ Using last resort backend connection');
        }
        return 'http://localhost:5002';
      };

      const socketUrl = getSocketUrl();
      
      if (import.meta.env.DEV || import.meta.env.VITE_APP_ENV === 'development') {
        console.log("🔌 Connecting to Socket.IO server:", {
          socketUrl,
          token: token ? "Present" : "Missing",
          characterId,
          transports: ["websocket", "polling"]
        });
      }
        
      socket = io(socketUrl, {
        path: "/socket.io",
        transports: ["websocket", "polling"], // Allow fallback to polling
        timeout: 10000,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        auth: {
          token,
          characterId: characterId,
        },
      });



      //Event liseners
      // Handles the socket connection and disconnection events
      socket.on("connect", () => {
        if (import.meta.env.DEV || import.meta.env.VITE_APP_ENV === 'development') {
          console.log("✅ Socket connected successfully");
        }
        setConnectionStatus("connected");
        setChatError(null);
      });
      
      socket.on("disconnect", (reason) => {
        if (import.meta.env.DEV || import.meta.env.VITE_APP_ENV === 'development') {
          console.log("❌ Socket disconnected:", reason);
        }
        setConnectionStatus("disconnected");
      });
      
      socket.on("connect_error", (err) => {
        if (import.meta.env.DEV || import.meta.env.VITE_APP_ENV === 'development') {
          console.error("❌ Socket connection error:", err);
          console.error("❌ Error details:", {
            message: err?.message,
            description: (err as any)?.description,
            context: (err as any)?.context,
            type: (err as any)?.type
          });
        }
        setConnectionStatus("disconnected");
        const errorMessage = err?.message || err?.toString() || "Connection failed";
        setChatError(errorMessage);
      });

      // Indicates the AI is starting to type
      socket.on("start", () => {
        setIsTyping(true);
        setTypingCharacter(characterName);
        buffer.current = "";
      });

      // Receives chunks of AI-generated text
      socket.on("token", (chunk: string) => {
        buffer.current += chunk;
      });

      // When the AI finishes sending the response, it emits an "end" event
      socket.on("end", () => {
        const aiMessage: Message = {
          id: crypto.randomUUID(),
          content: buffer.current,
          senderType: "ai",
          characterName: characterName,
        };
        setMessages((prev) => [...prev, aiMessage]);
        setIsTyping(false);
        buffer.current = "";
      });

      // Handles any errors that occur during the chat session
      socket.on("error", (errorData: any) => {
        const errorMessage = typeof errorData === 'string' 
          ? errorData 
          : errorData?.message || 'An error occurred';
        setChatError(errorMessage);
        setIsTyping(false);
      });

      // Handles account bans
      socket.on("account_banned", (banData: any) => {
        console.log("🚨 Account banned:", banData);
        
        setBanInfo({
          banned: banData.banned,
          banType: banData.banType,
          message: banData.message,
          action: banData.action,
          violationCount: banData.violationCount,
          violationType: banData.violationType
        });
        
        setShowBanModal(true);
        setIsTyping(false);
        
        // Clear any existing messages and errors
        setChatError(null);
      });

      // Handles AI responses to image generation
      socket.on("ai-image-response", (data: any) => {
        console.log("🎨 Received AI image response:", data);
        
        if (data.message && data.characterId === characterId) {
          const aiResponseMessage: Message = {
            id: data.message.id || crypto.randomUUID(),
            content: data.message.content,
            senderType: "ai",
            characterName: data.characterName || characterName,
            timestamp: data.message.timestamp ? new Date(data.message.timestamp) : new Date()
          };
          
          setMessages((prev) => [...prev, aiResponseMessage]);
          console.log(`✅ Added AI image response: "${aiResponseMessage.content.substring(0, 50)}..."`);
        }
      });
    };

    setupSocket();

    return () => {
      socket?.disconnect();
    };
  }, [characterId, user, isAuthenticated, characterName]); 

  // Function to send a message to the AI character
  // It takes the message text as input and returns a boolean indicating success or failure
  // It updates the messages state with the user's message and handles the AI response via socket events
  const sendMessage = async (text: string, loraContext?: any): Promise<boolean> => {
    if (coinBalance !== null && coinBalance < 1) {
      setChatError("Insufficient coins to send a message.");
      return false;
    }

    const userMessage: Message = {
      id: crypto.randomUUID(),
      content: text,
      senderType: "user",
    };

    // Optimistically add the user's message to the UI
    const newUserMessage: Message = {
      id: crypto.randomUUID(),
      content: text,
      senderType: "user",
    };

    let updatedMessages: Message[] = [];
    setMessages((prev) => {
      updatedMessages = [...prev, newUserMessage];
      return updatedMessages;
    });

    setIsTyping(true);
    setTypingCharacter(characterName || null);
    setChatError(null);

    if (coinBalance !== null) {
      setCoinBalance(coinBalance - 1);
    }

    // Ensure the socket is connected before emitting
    if (!socket) {
      setChatError("Socket not connected. Please try again.");
      setIsTyping(false);
      return false;
    }

    try {
      // Send the full, updated conversation history to the backend
      socket.emit("send-message", {
        content: text, // The current message content
        characterId,
        loraContext, // Include LoRA context if provided
        messages: updatedMessages.map((m) => ({
          // Map frontend Message to backend expected format (role, content)
          role: m.senderType === "user" ? "user" : "assistant",
          content: m.content,
        })),
      });
      return true;
    } catch (error: any) {
      setChatError("Failed to send message.");
      setIsTyping(false);
      return false;
    }
  };

  // Function to clear the chat error state
  const clearError = () => setChatError(null);

  // Function to add an image message to the chat
  const addImageMessage = async (imageUrl: string, prompt: string) => {
    const imageMessage: Message = {
      id: Date.now().toString(),
      content: '',
      senderType: 'ai', // Changed from 'user' to 'ai' so images appear on AI side
      timestamp: new Date(),
      imageUrl,
      imagePrompt: prompt
    };
    
    setMessages(prev => [...prev, imageMessage]);
    
    // Save image message to backend for persistence
    try {
      const token = localStorage.getItem("medusavr_access_token");
      await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          conversationId: 'temp-conversation-id', // TODO: Use actual conversation ID
          content: imageMessage.content,
          sender: imageMessage.senderType,
          characterId,
          characterName: imageMessage.characterName,
          timestamp: imageMessage.timestamp?.toISOString() || new Date().toISOString(),
          imageUrl: imageMessage.imageUrl,
          imagePrompt: imageMessage.imagePrompt
        }),
      });
      console.log('✅ Image message saved to backend');
    } catch (error) {
      console.error('❌ Failed to save image message:', error);
    }
  };

  // Function to add a loading image message to the chat
  const addLoadingImageMessage = (prompt: string, jobId: string): string => {
    const messageId = Date.now().toString();
    const loadingMessage: Message = {
      id: messageId,
      content: '',
      senderType: 'ai',
      timestamp: new Date(),
      imagePrompt: prompt,
      isImageLoading: true,
      jobId,
      characterName
    };
    
    setMessages(prev => [...prev, loadingMessage]);
    return messageId;
  };

  // Function to update a loading image message with the actual image URL
  const updateImageMessage = async (messageId: string, imageUrl: string) => {
    setMessages(prev => prev.map(msg => 
      msg.id === messageId 
        ? { ...msg, imageUrl, isImageLoading: false } 
        : msg
    ));

    // Save the completed image message to backend
    try {
      const token = localStorage.getItem("medusavr_access_token");
      const message = messages.find(m => m.id === messageId);
      if (message) {
        await fetch('/api/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            conversationId: 'temp-conversation-id', // TODO: Use actual conversation ID
            content: message.content,
            sender: message.senderType,
            characterId,
            characterName: message.characterName,
            timestamp: message.timestamp?.toISOString() || new Date().toISOString(),
            imageUrl,
            imagePrompt: message.imagePrompt
          }),
        });
        console.log('✅ Updated image message saved to backend');
      }
    } catch (error) {
      console.error('❌ Failed to save updated image message:', error);
    }
  };

  // Function to remove a message (useful for failed image generations)

  const removeMessage = (messageId: string) => {
    setMessages(prev => prev.filter(msg => msg.id !== messageId));
  };

  const closeBanModal = () => {
    setShowBanModal(false);
    // Redirect user away from chat
    if (banInfo?.banType === 'permanent') {
      window.location.href = '/';
    } else {
      window.location.href = '/profile';
    }
  };

  return {
    messages,
    isTyping,
    typingCharacter,
    chatError,
    sendMessage,
    addImageMessage,
    addLoadingImageMessage,
    updateImageMessage,
    removeMessage,
    clearError,
    connectionStatus,
    coinBalance,
    banInfo,
    showBanModal,
    closeBanModal,
  };
}
