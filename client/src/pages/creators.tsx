import { useQuery } from "@tanstack/react-query";
import { CreatorCard } from "@/components/creator-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

interface Creator {
  id: string;
  userId?: number;
  displayName: string;
  followerCount: number;
  characterCount: number;
  totalMessages: number;
  badges?: string[];
}

interface User {
  id: number;
  username: string;
  email: string;
  password: string;
  avatar?: string;
  bio?: string;
  verified?: boolean;
  coins?: number;
  createdAt?: Date;
}

export default function CreatorsPage() {
  const { data: creators, isLoading } = useQuery<Creator[]>({
    queryKey: ["/api/creators"],
  });

  // Mock users data - in real app this would come from joined query
  const mockUsers: Record<number, User> = {
    1: { id: 1, username: "ArtistMika", email: "mika@example.com", password: "", avatar: "https://images.unsplash.com/photo-1494790108755-2616c46b4ee2?w=200", bio: "Creating beautiful AI companions", verified: true, coins: 2500, createdAt: new Date() },
    2: { id: 2, username: "AnimeCreator", email: "anime@example.com", password: "", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200", bio: "Anime character specialist", verified: true, coins: 1800, createdAt: new Date() },
    3: { id: 3, username: "FantasyWorld", email: "fantasy@example.com", password: "", avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200", bio: "Fantasy and mythology expert", verified: false, coins: 950, createdAt: new Date() },
    4: { id: 4, username: "SciFiMaster", email: "scifi@example.com", password: "", avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200", bio: "Future worlds and AI personalities", verified: true, coins: 3200, createdAt: new Date() },
    5: { id: 5, username: "RomanceWriter", email: "romance@example.com", password: "", avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200", bio: "Crafting romantic storylines", verified: false, coins: 1400, createdAt: new Date() },
    6: { id: 6, username: "CyberPunk", email: "cyber@example.com", password: "", avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200", bio: "Cyberpunk aesthetics and rebels", verified: true, coins: 2100, createdAt: new Date() }
  };

  if (isLoading) {
    return (
      <div>
        <div className="mb-8">
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-4">
              <Skeleton className="h-32 w-full rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">Top Creators</h1>
        <p className="text-zinc-400">
          Discover the most talented character creators
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-4 mb-6 border-b border-orange-500/20">
        <Button variant="ghost" className="border-b-2 border-orange-600 text-orange-400">
          Trending Creators
        </Button>
        <Button variant="ghost" className="text-zinc-400 hover:text-orange-300">
          Most Followed
        </Button>
        <Button variant="ghost" className="text-zinc-400 hover:text-orange-300">
          New Creators
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {creators?.map((creator) => (
          <CreatorCard 
            key={creator.id} 
            creator={creator} 
            user={mockUsers[creator.userId!]}
          />
        ))}
      </div>
    </div>
  );
}
