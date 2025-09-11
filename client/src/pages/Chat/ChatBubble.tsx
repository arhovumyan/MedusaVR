// src/components/chat/ChatBubble.tsx
import React, { useState } from "react";
import ImageZoomModal from "./ImageZoomModal";

interface ChatBubbleProps {
  avatarUrl: string;
  speakerName: string;
  message?: string;
  imageUrl?: string;
  imagePrompt?: string;
  isUser?: boolean;
  isTyping?: boolean;
  isImageLoading?: boolean;
}

export default function ChatBubble({ 
  avatarUrl, 
  speakerName, 
  message,
  imageUrl,
  imagePrompt, 
  isUser = false,
  isTyping = false,
  isImageLoading = false 
}: ChatBubbleProps) {
  const [isZoomOpen, setIsZoomOpen] = useState(false);

  return (
    <>
      <div className={`flex items-start space-x-3 mt-6 px-4 ${isUser ? 'flex-row-reverse space-x-reverse' : ''}`}>
        {/* Avatar - always show on the left for AI, right for user */}
        <div className="relative flex-shrink-0">
          <div className={`w-10 h-10 rounded-full overflow-hidden border-2 shadow-lg ${
            isUser 
              ? 'border-blue-500/50 shadow-blue-500/30' 
              : 'border-orange-500/50 shadow-orange-500/30'
          }`}>
            <img src={avatarUrl} alt={speakerName} className="w-full h-full object-cover object-center" />
          </div>
          {/* Subtle glow effect */}
          <div className={`absolute inset-0 rounded-full blur-sm opacity-30 ${
            isUser ? 'bg-blue-500/30' : 'bg-orange-500/30'
          }`}></div>
        </div>
        
        {/* Message bubble with modern design */}
        <div className="relative max-w-2xl">
          <div className={`backdrop-blur-xl border rounded-2xl shadow-xl ${
            isUser 
              ? 'bg-gradient-to-br from-blue-600/80 to-blue-700/80 border-blue-500/40 text-white' 
              : 'bg-gradient-to-br from-zinc-800/90 to-zinc-900/90 border-orange-500/30 text-zinc-100'
          } ${imageUrl || isImageLoading ? 'p-2' : 'px-4 py-3'}`}>
            {isTyping ? (
              <div className="flex items-center space-x-2 px-2 py-1">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
                <span className="text-zinc-400 text-sm ml-2">{speakerName} is typing...</span>
              </div>
            ) : isImageLoading ? (
              /* Loading image bubble */
              <div className="space-y-2">
                <div className="w-64 h-96 bg-zinc-700/50 rounded-lg flex flex-col items-center justify-center border-2 border-dashed border-zinc-600">
                  <div className="flex items-center space-x-2 mb-3">
                    <div className="w-3 h-3 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-3 h-3 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '200ms' }}></div>
                    <div className="w-3 h-3 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '400ms' }}></div>
                  </div>
                  <span className="text-zinc-300 text-sm font-medium">One sec</span>
                    <span className="text-zinc-400 text-xs mt-1">Generations take longer in chat</span>
                </div>
                {imagePrompt && (
                  <div className="px-2 pb-1">
                    <p className="text-xs text-zinc-400 italic">"{imagePrompt}"</p>
                  </div>
                )}
              </div>
            ) : imageUrl ? (
              /* Image bubble */
              <div className="space-y-2">
                <img
                  src={imageUrl}
                  alt={imagePrompt || "Generated image"}
                  className="max-w-full h-auto rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => setIsZoomOpen(true)}
                />
                {imagePrompt && (
                  <div className="px-2 pb-1">
                    <p className="text-xs text-zinc-400 italic">"{imagePrompt}"</p>
                  </div>
                )}
              </div>
            ) : message ? (
              /* Text bubble */
              <div className="whitespace-pre-line leading-relaxed">
                {!isUser ? (
                  // For character messages, format text with asterisks as thoughts/actions
                  message.split(/(\*.*?\*)/).map((part, index) => {
                    if (part.startsWith('*') && part.endsWith('*')) {
                      return (
                        <span key={index} className="text-sm text-gray-400 opacity-75 italic">
                          {part}
                        </span>
                      );
                    }
                    return part;
                  })
                ) : (
                  // For user messages, show plain text without formatting
                  message
                )}
              </div>
            ) : null}
          </div>
          
          {/* Message timestamp - removed for cleaner UI */}
        </div>
      </div>

      {/* Image Zoom Modal */}
      {imageUrl && (
        <ImageZoomModal
          isOpen={isZoomOpen}
          onClose={() => setIsZoomOpen(false)}
          imageUrl={imageUrl}
          prompt={imagePrompt}
        />
      )}
    </>
  );
}
