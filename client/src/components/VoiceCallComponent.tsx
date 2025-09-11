import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Mic, MicOff, Phone, PhoneOff, Volume2, VolumeX } from 'lucide-react';
import { useVoiceCall, VoiceTranscript, VoiceAIResponse, VoiceAudio } from '@/hooks/useVoiceCall';
import { useToast } from '@/hooks/use-toast';

interface VoiceCallComponentProps {
  characterId: string;
  characterName: string;
  className?: string;
}

export const VoiceCallComponent: React.FC<VoiceCallComponentProps> = ({
  characterId,
  characterName,
  className = ''
}) => {
  const { toast } = useToast();
  const [transcripts, setTranscripts] = useState<VoiceTranscript[]>([]);
  const [aiResponses, setAIResponses] = useState<VoiceAIResponse[]>([]);
  const [isVolumeOn, setIsVolumeOn] = useState(true);

  const {
    isCallActive,
    isConnecting,
    isRecording,
    isMuted,
    connectionStatus,
    error,
    sessionId,
    startCall,
    endCall,
    toggleMute
  } = useVoiceCall({
    characterId,
    characterName,
    onTranscript: (transcript) => {
      setTranscripts(prev => [...prev.slice(-9), transcript]); // Keep last 10 transcripts
    },
    onAIResponse: (response) => {
      setAIResponses(prev => [...prev.slice(-4), response]); // Keep last 5 responses
    },
    onAudioReceived: (audio) => {
      console.log('🔊 Audio received from:', audio.characterName);
    },
    onError: (errorMessage) => {
      toast({
        title: 'Voice Call Error',
        description: errorMessage,
        variant: 'destructive'
      });
    }
  });

  // Show error toast when error state changes
  useEffect(() => {
    if (error) {
      toast({
        title: 'Voice Call Error',
        description: error,
        variant: 'destructive'
      });
    }
  }, [error, toast]);

  const handleStartCall = async () => {
    const success = await startCall();
    if (success) {
      toast({
        title: 'Voice Call Started',
        description: `Connected to ${characterName}`,
        variant: 'default'
      });
    }
  };

  const handleEndCall = async () => {
    const success = await endCall();
    if (success) {
      toast({
        title: 'Voice Call Ended',
        description: `Disconnected from ${characterName}`,
        variant: 'default'
      });
      // Clear transcripts and responses
      setTranscripts([]);
      setAIResponses([]);
    }
  };

  const getConnectionStatusBadge = () => {
    const statusConfig = {
      disconnected: { variant: 'secondary' as const, text: 'Disconnected' },
      connecting: { variant: 'outline' as const, text: 'Connecting...' },
      connected: { variant: 'default' as const, text: 'Connected' },
      error: { variant: 'destructive' as const, text: 'Error' }
    };

    const config = statusConfig[connectionStatus];
    return (
      <Badge variant={config.variant} className="ml-2">
        {config.text}
      </Badge>
    );
  };

  return (
    <Card className={`w-full max-w-md mx-auto ${className}`}>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center">
            🎤 Voice Call
            {getConnectionStatusBadge()}
          </span>
          {sessionId && (
            <Badge variant="outline" className="text-xs">
              Session Active
            </Badge>
          )}
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Talk to {characterName} using voice
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Call Controls */}
        <div className="flex gap-2 justify-center">
          {!isCallActive ? (
            <Button
              onClick={handleStartCall}
              disabled={isConnecting}
              className="flex items-center gap-2"
              size="lg"
            >
              <Phone className="w-4 h-4" />
              {isConnecting ? 'Connecting...' : 'Start Call'}
            </Button>
          ) : (
            <>
              <Button
                onClick={handleEndCall}
                variant="destructive"
                className="flex items-center gap-2"
                size="lg"
              >
                <PhoneOff className="w-4 h-4" />
                End Call
              </Button>
              
              <Button
                onClick={toggleMute}
                variant={isMuted ? 'destructive' : 'outline'}
                className="flex items-center gap-2"
                size="lg"
              >
                {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                {isMuted ? 'Unmute' : 'Mute'}
              </Button>

              <Button
                onClick={() => setIsVolumeOn(!isVolumeOn)}
                variant={!isVolumeOn ? 'destructive' : 'outline'}
                className="flex items-center gap-2"
                size="lg"
              >
                {isVolumeOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </Button>
            </>
          )}
        </div>

        {/* Call Status */}
        {isCallActive && (
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-2">
              {isRecording && (
                <div className="flex items-center gap-2 text-green-600">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                  <span className="text-sm font-medium">Recording</span>
                </div>
              )}
              {isMuted && (
                <Badge variant="destructive" className="text-xs">
                  Muted
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Live Transcription */}
        {transcripts.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Live Transcription:</h4>
            <div className="max-h-32 overflow-y-auto space-y-1 p-2 bg-muted rounded-md">
              {transcripts.slice(-5).map((transcript, index) => (
                <div
                  key={index}
                  className={`text-xs p-1 rounded ${
                    transcript.isFinal ? 'bg-background' : 'bg-muted-foreground/10'
                  }`}
                >
                  <span className="font-medium">{transcript.username}:</span>{' '}
                  {transcript.text}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* AI Responses */}
        {aiResponses.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">{characterName}&apos;s Responses:</h4>
            <div className="max-h-32 overflow-y-auto space-y-1 p-2 bg-muted rounded-md">
              {aiResponses.slice(-3).map((response, index) => (
                <div key={index} className="text-xs p-1 rounded bg-background">
                  <span className="font-medium text-blue-600">{response.characterName}:</span>{' '}
                  {response.text}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="p-2 bg-destructive/10 text-destructive text-sm rounded-md">
            ⚠️ {error}
          </div>
        )}

        {/* Instructions */}
        {!isCallActive && (
          <div className="text-xs text-muted-foreground space-y-1">
            <p>• Click &quot;Start Call&quot; to begin voice conversation</p>
            <p>• Speak naturally - AI will respond with voice</p>
            <p>• Use mute to temporarily stop recording</p>
            <p>• Powered by Deepgram &amp; {characterName}</p>
          </div>
        )}

        {/* Technical Info (Development Mode) */}
        {import.meta.env.DEV && isCallActive && (
          <details className="text-xs text-muted-foreground">
            <summary>Technical Details</summary>
            <div className="mt-2 space-y-1">
              <p>Session ID: {sessionId}</p>
              <p>Connection: {connectionStatus}</p>
              <p>Recording: {isRecording ? 'Active' : 'Inactive'}</p>
              <p>Muted: {isMuted ? 'Yes' : 'No'}</p>
            </div>
          </details>
        )}
      </CardContent>
    </Card>
  );
};

export default VoiceCallComponent;
