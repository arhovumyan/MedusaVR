import React from 'react';
import { useParams } from 'wouter';
import VoiceCallComponent from '@/components/VoiceCallComponent';
import { AuthGuard } from '@/components/AuthGuard';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'wouter';

interface Character {
  id: number;
  name: string;
  avatar: string;
  description: string;
}

export default function VoiceTestPage() {
  const { characterId } = useParams();

  // Validate characterId
  if (!characterId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-800 to-orange-900/20 text-white flex items-center justify-center">
        <Alert className="max-w-md">
          <AlertDescription>
            Character ID is required for voice testing.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <AuthGuard>
      <VoiceTestPageContent characterId={characterId} />
    </AuthGuard>
  );
}

function VoiceTestPageContent({ characterId }: { characterId: string }) {
  // Fetch character data
  const { data: character, isLoading, error } = useQuery<Character>({
    queryKey: ['character', characterId],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/characters/${characterId}`);
      return await response.json();
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-800 to-orange-900/20 text-white flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !character) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-800 to-orange-900/20 text-white flex items-center justify-center">
        <Alert className="max-w-md">
          <AlertDescription>
            Failed to load character data. Please try again.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-800 to-orange-900/20 text-white">
      {/* Background effects */}
      <div className="fixed inset-0 bg-gradient-to-br from-orange-500/5 via-transparent to-amber-500/5 pointer-events-none"></div>
      <div className="fixed top-1/4 left-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl opacity-30 pointer-events-none"></div>
      <div className="fixed bottom-1/4 right-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl opacity-30 pointer-events-none"></div>

      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href={`/chat/${characterId}`}>
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Chat
            </Button>
          </Link>
          <div className="flex items-center gap-4">
            <img 
              src={character.avatar || '/default-avatar.png'} 
              alt={character.name}
              className="w-12 h-12 rounded-full object-cover border-2 border-orange-500/30"
            />
            <div>
              <h1 className="text-2xl font-bold">Voice Call Test</h1>
              <p className="text-zinc-400">Testing voice functionality with {character.name}</p>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Voice Call Component */}
          <div className="space-y-6">
            <VoiceCallComponent 
              characterId={characterId}
              characterName={character.name}
              className="w-full"
            />
          </div>

          {/* Character Info & Instructions */}
          <div className="space-y-6">
            {/* Character Card */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">About {character.name}</h2>
              <div className="flex items-start gap-4">
                <img 
                  src={character.avatar || '/default-avatar.png'} 
                  alt={character.name}
                  className="w-16 h-16 rounded-lg object-cover border border-orange-500/30"
                />
                <div className="flex-1">
                  <h3 className="font-medium mb-2">{character.name}</h3>
                  <p className="text-sm text-zinc-400 leading-relaxed">
                    {character.description || 'A character ready for voice conversation.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Instructions */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">🎤 Voice Call Instructions</h2>
              <div className="space-y-3 text-sm text-zinc-300">
                <div className="flex items-start gap-2">
                  <span className="text-orange-400 font-bold">1.</span>
                  <span>Click "Start Call" to begin voice conversation</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-orange-400 font-bold">2.</span>
                  <span>Allow microphone access when prompted</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-orange-400 font-bold">3.</span>
                  <span>Speak naturally - your speech will be transcribed in real-time</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-orange-400 font-bold">4.</span>
                  <span>{character.name} will respond with both text and voice</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-orange-400 font-bold">5.</span>
                  <span>Use the mute button to temporarily stop recording</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-orange-400 font-bold">6.</span>
                  <span>Click "End Call" when finished</span>
                </div>
              </div>
            </div>

            {/* Technical Info */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">🔧 Technical Details</h2>
              <div className="space-y-2 text-sm text-zinc-400">
                <p><strong>AI Model:</strong> nothingiisreal/mn-celeste-12b</p>
                <p><strong>Speech-to-Text:</strong> Deepgram Nova 2</p>
                <p><strong>Text-to-Speech:</strong> Deepgram Aura</p>
                <p><strong>Audio Format:</strong> 16kHz Linear PCM</p>
                <p><strong>Real-time Processing:</strong> WebSocket + Streaming</p>
              </div>
            </div>

            {/* Environment Variables Check */}
            {import.meta.env.DEV && (
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                <h3 className="text-yellow-300 font-medium mb-2">Development Environment</h3>
                <div className="text-xs text-yellow-200 space-y-1">
                  <p>This is a development environment. Check that these environment variables are set:</p>
                  <ul className="list-disc list-inside ml-2 space-y-1">
                    <li>DEEPGRAM_API_KEY</li>
                    <li>OPENROUTER_API_KEY</li>
                    <li>DEEPGRAM_PROJECT_ID</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
