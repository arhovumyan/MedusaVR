import { Link } from "wouter";
import { CheckCircle, Users, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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
  avatar?: string;
  bio?: string;
  verified?: boolean;
}

interface CreatorCardProps {
  creator: Creator;
  user?: User;
}

export function CreatorCard({ creator, user }: CreatorCardProps) {
  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  return (
    <Card className="hover:ring-2 hover:ring-primary/50 transition-all duration-300">
      <CardContent className="p-6">
        <div className="flex items-start space-x-4">
          <div className="relative">
            <img
              src={user?.avatar || "/placeholder-avatar.png"}
              alt={creator.displayName}
              className="w-16 h-16 rounded-full object-cover ring-2 ring-primary/30"
            />
            {user?.verified && (
              <div className="absolute -bottom-1 -right-1 bg-blue-500 rounded-full p-1">
                <CheckCircle className="w-4 h-4 text-white" />
              </div>
            )}
          </div>

          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-1">
              <h3 className="font-semibold text-lg">{creator.displayName}</h3>
              {creator.badges && creator.badges.length > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {creator.badges[0]}
                </Badge>
              )}
            </div>
            
            <p className="text-sm text-muted-foreground mb-3">
              {user?.bio || "Creator on GirlfriendGPT"}
            </p>

            <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-4">
              <div className="flex items-center space-x-1">
                <Users className="w-4 h-4" />
                <span>{formatNumber(creator.followerCount)} followers</span>
              </div>
              <div className="flex items-center space-x-1">
                <Bot className="w-4 h-4" />
                <span>{creator.characterCount} characters</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Link href={`/creators/${creator.id}`}>
                <Button variant="outline" size="sm" className="border-orange-600/50 text-orange-400 hover:bg-orange-700/10 hover:text-orange-300">
                  View Profile
                </Button>
              </Link>
              
              <Button size="sm" className="bg-gradient-to-r from-orange-700 to-red-700 hover:from-orange-800 hover:to-red-800">
                Follow
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
