// Docker WebSocket workaround service
import https from 'https';
import fs from 'fs';

export class DockerWebSocketWorkaround {
  private static isDockerEnvironment(): boolean {
    return process.env.DEEPGRAM_USE_DOCKER_WORKAROUND === 'true' || 
           fs.existsSync('/.dockerenv') ||
           process.env.NODE_ENV === 'production';
  }

  /**
   * Test if we're in a Docker environment with WebSocket restrictions
   */
  static async testDockerWebSocketCapability(): Promise<{canUseWebSocket: boolean, reason: string}> {
    if (!this.isDockerEnvironment()) {
      return { canUseWebSocket: true, reason: 'Not in Docker environment' };
    }

    // Test WebSocket capability with a quick connection test
    const { createClient } = await import('@deepgram/sdk');
    const deepgram = createClient(process.env.DEEPGRAM_API_KEY || '');
    
    console.log('🐳 Docker environment detected - testing WebSocket capability...');
    
    return new Promise((resolve) => {
      try {
        const testLive = deepgram.listen.live({
          model: 'nova-2',
          language: 'en-US',
          encoding: 'linear16',
          sample_rate: 16000,
          keepalive: true
        });

        let resolved = false;
        const timeout = setTimeout(() => {
          if (!resolved) {
            resolved = true;
            console.log('🐳 WebSocket test timeout - Docker blocking detected');
            resolve({ 
              canUseWebSocket: false, 
              reason: 'Docker environment blocks WebSocket connections' 
            });
          }
        }, 3000); // Quick 3 second test

        testLive.on('open', () => {
          if (!resolved) {
            resolved = true;
            clearTimeout(timeout);
            testLive.finish();
            console.log('🐳 WebSocket test successful in Docker');
            resolve({ 
              canUseWebSocket: true, 
              reason: 'WebSocket connections working in Docker' 
            });
          }
        });

        testLive.on('error', (error) => {
          if (!resolved) {
            resolved = true;
            clearTimeout(timeout);
            console.log('🐳 WebSocket test failed in Docker:', error.message);
            resolve({ 
              canUseWebSocket: false, 
              reason: `Docker WebSocket error: ${error.message}` 
            });
          }
        });

      } catch (error) {
        console.log('🐳 WebSocket test exception in Docker:', error);
        resolve({ 
          canUseWebSocket: false, 
          reason: `Docker WebSocket exception: ${error}` 
        });
      }
    });
  }

  /**
   * Alternative HTTP-based approach for Docker environments
   * Uses Deepgram's synchronous API instead of streaming WebSocket
   */
  static async createHttpBasedVoiceService(apiKey: string) {
    const { createClient } = await import('@deepgram/sdk');
    const deepgram = createClient(apiKey);

    return {
      transcribeAudio: async (audioBuffer: Buffer) => {
        try {
          console.log('🐳 Using HTTP-based transcription (Docker workaround)');
          
          const response = await deepgram.listen.prerecorded.transcribeFile(
            audioBuffer,
            {
              model: 'nova-2',
              language: 'en-US',
              smart_format: true,
              punctuate: true,
              numerals: true
            }
          );

          return response;
        } catch (error) {
          console.error('🐳 HTTP transcription error:', error);
          throw error;
        }
      },

      synthesizeSpeech: async (text: string) => {
        try {
          console.log('🐳 Using HTTP-based speech synthesis (Docker workaround)');
          
          const response = await deepgram.speak.request(
            { text },
            {
              model: 'aura-asteria-en',
              encoding: 'linear16',
              sample_rate: 24000
            }
          );

          return response;
        } catch (error) {
          console.error('🐳 HTTP synthesis error:', error);
          throw error;
        }
      }
    };
  }
}
