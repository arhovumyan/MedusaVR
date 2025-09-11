// src/pages/RecentChats.tsx
import React from "react";
import { useNavigate, Link } from "react-router-dom";
import { Cat as ChatBubbleIcon, MoreVertical } from "lucide-react";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiService } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { LoadingSpinner } from '@/components/ui/loading-spinner';

interface ChatItem {
  id: string;
  characterId: string;
  name: string;
  avatarUrl: string;
  snippet: string;
  lastTime: string;
  unreadCount: number;
}

export default function RecentChats() {
  const navigate = useNavigate();

  const queryClient = useQueryClient();

  const { data: chats, isLoading, error } = useQuery<ChatItem[]>({ 
    queryKey: ["userConversations"], 
    queryFn: () => apiService.getUserConversations(),
  });

  const handleDeleteConversation = async (conversationId: string) => {
    if (window.confirm("Are you sure you want to delete this conversation?")) {
      try {
        await apiService.deleteConversation(conversationId);
        queryClient.invalidateQueries({ queryKey: ["userConversations"] }); // Refetch chats after deletion
      } catch (err) {
        console.error("Failed to delete conversation:", err);
        alert("Failed to delete conversation.");
      }
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-800 to-orange-900/20 text-white p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center py-32">
            <LoadingSpinner size="xl" text="Loading recent chats..." />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center pt-10 min-h-screen text-gray-200 flex-col">
        <div className="text-center text-red-500">Error loading chats: {error.message}</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-zinc-900/95 text-gray-200 p-4 sm:p-6">
      <h1 className="text-3xl font-bold text-center mb-8 text-orange-400">Recent Chats</h1>
      <div className="flex-1 overflow-y-auto w-full">
        <ul className="space-y-4">
          {chats && chats.length > 0 ? (
            chats.map((chat: ChatItem) => (
              <li
                key={chat.id}
                onClick={() => navigate(`/chat/${chat.characterId}`)}
                className="w-full flex items-center p-4 rounded-lg bg-zinc-800/50 border border-orange-500/20 shadow-lg shadow-orange-500/10 cursor-pointer hover:bg-zinc-700/50 transition-all duration-300 ease-in-out"
              >
                <img
                  src={chat.avatarUrl}
                  alt={`${chat.name} avatar`}
                  className="w-12 h-12 rounded-full object-cover flex-shrink-0 border-2 border-orange-400"
                />

                <div className="ml-4 flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h2 className="text-lg font-semibold leading-tight truncate text-orange-200">
                      {chat.name}
                    </h2>
                    <div className="flex items-center space-x-1 text-xs text-gray-400">
                      <ChatBubbleIcon size={12} className="text-orange-400" />
                      <span>{chat.unreadCount}</span>
                      <span>·</span>
                      <span>{new Date(chat.lastTime).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <p className="mt-1 text-sm text-gray-300 line-clamp-2">
                    {chat.snippet}
                  </p>
                  {chat.snippet.length > 100 && (
                    <span className="text-orange-400 text-xs cursor-pointer hover:underline mt-1 block">
                      Read more
                    </span>
                  )}
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      onClick={(e) => e.stopPropagation()}
                      className="ml-auto p-2 text-gray-400 hover:text-orange-400 transition-colors rounded-full hover:bg-zinc-700"
                    >
                      <MoreVertical size={18} />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="bg-zinc-800 border border-orange-500/30 text-gray-200">
                    <DropdownMenuItem 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteConversation(chat.id);
                      }}
                      className="text-red-400 focus:bg-red-500/20 focus:text-red-300 cursor-pointer"
                    >
                      Delete Conversation
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </li>
            ))
          ) : (
            <div className="text-center py-12 rounded-lg bg-zinc-800/50 border border-orange-500/20 shadow-lg shadow-orange-500/10">
              <p className="text-gray-400 text-lg">No recent chats found.</p>
              <Link
                to="/ForYouPage"
                className="mt-4 inline-block text-orange-400 hover:underline"
              >
                🔍 Start a new conversation!
              </Link>
            </div>
          )}
        </ul>
      </div>

      <div className="px-4 pb-10 py-4 text-center text-gray-500 mt-auto w-full">
        <Link
          to="/ForYouPage"
          className="block break-words text-orange-400 hover:underline"
        >
          🔍 Click here to explore more characters to chat with
        </Link>
      </div>
    </div>
  );
}