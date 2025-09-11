import Cards from "@/components/ui/cards";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Users } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { Character } from "@shared/api-types";

export default function FollowingPage() {
  // Mock user ID - in real app this would come from auth context
  const userId = 1;
  
  const { data: characters, isLoading } = useQuery<Character[]>({
    queryKey: [`/api/characters/following/${userId}`],
  });

  if (isLoading) {
    return (
      <div>
        <div className="mb-8">
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-4">
              <Skeleton className="h-48 w-full rounded-lg" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!characters || characters.length === 0) {
    return (
      <div>
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">Following</h1>
          <p className="text-zinc-400">
            Characters from creators you follow
          </p>
        </div>

        <div className="max-w-md mx-auto bg-gradient-to-br from-zinc-800/50 to-zinc-900/50 backdrop-blur-lg border border-orange-500/20 rounded-2xl shadow-2xl shadow-orange-500/10">
          <div className="p-8 text-center">
            <Users className="w-16 h-16 text-orange-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2 text-zinc-200">No followed characters yet</h3>
            <p className="text-zinc-400 mb-6">
              Start following creators to see their characters here
            </p>
            <Link href="/creators">
              <Button className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700">
                Discover Creators
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
        <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">Following</h1>
        <p className="text-zinc-400">
          Characters from creators you follow
        </p>
      </div>

      <Cards 
        externalCharacters={characters}
        externalLoading={false}
        externalError={null}
      />
    </div>
  );
}
