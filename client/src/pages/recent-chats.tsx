import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Clock } from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";

interface ChatWithCharacter {
  id: number;
  characterId: number;
  name: string;
  avatarUrl?: string;
  snippet: string;
  lastTime: Date;
  unreadCount: number;
}

export default function RecentChatsPage() {
  const { user } = useAuth();
  
  const { data: chats, isLoading } = useQuery<ChatWithCharacter[]>({
    queryKey: ['conversations'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/conversations', undefined, {}, 'medium');
      return await response.json() as ChatWithCharacter[];
    },
    enabled: !!user, // Only fetch if user is authenticated
  });

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - new Date(date).getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return "Just now";
    } else if (diffInHours < 24) {
      return `${diffInHours} hours ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    }
  };

  if (isLoading) {
    return (
      <div>
        <div className="mb-8">
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (!chats || chats.length === 0) {
    return (
      <div>
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">Recent Chats</h1>
          <p className="text-zinc-400">
            Continue your conversations
          </p>
        </div>

        <div className="max-w-md mx-auto bg-gradient-to-br from-zinc-800/50 to-zinc-900/50 backdrop-blur-lg border border-orange-500/20 rounded-2xl shadow-2xl shadow-orange-500/10">
          <div className="p-8 text-center">
            <MessageCircle className="w-16 h-16 text-orange-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2 text-zinc-200">No recent chats</h3>
            <p className="text-zinc-400 mb-6">
              Start a conversation with your favorite characters
            </p>
            <Link href="/ForYouPage">
              <Button className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700">
                Discover Characters
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">Recent Chats</h1>
        <p className="text-zinc-400">
          Continue your conversations
        </p>
      </div>

      <div className="space-y-4">
        {chats.map((chat) => (
          <div key={chat.id} className="bg-gradient-to-br from-zinc-800/50 to-zinc-900/50 backdrop-blur-lg border border-orange-500/20 rounded-xl shadow-lg shadow-orange-500/10 hover:shadow-orange-500/20 transition-all cursor-pointer hover:border-orange-500/40">
            <div className="p-4">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <img
                    src={chat.avatarUrl || '/medusaSnake.png'}
                    alt={chat.name || 'Character'}
                    className="w-12 h-12 rounded-full object-cover ring-2 ring-orange-500/30"
                    onError={(e) => {
                      e.currentTarget.src = '/medusaSnake.png';
                    }}
                  />
                  {chat.unreadCount > 0 && (
                    <div className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
                      {chat.unreadCount}
                    </div>
                  )}
                </div>

                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold text-lg text-zinc-200">{chat.name}</h3>
                    <div className="flex items-center text-sm text-zinc-400">
                      <Clock className="w-4 h-4 mr-1" />
                      {formatTimeAgo(chat.lastTime)}
                    </div>
                  </div>
                  
                  <p className="text-zinc-400 text-sm mb-2 line-clamp-1">
                    {chat.snippet || "Start a conversation..."}
                  </p>
                  
                  <div className="flex flex-wrap gap-1">
                    {/* Tags are not included in backend response, removing for now */}
                  </div>
                </div>

                <div className="flex flex-col items-end space-y-2">
                  {chat.unreadCount > 0 && (
                    <div className="w-3 h-3 bg-orange-500 rounded-full" />
                  )}
                  <Link href={`/chat/${chat.characterId}`}>
                    <Button size="sm" className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700">
                      Continue Chat
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
