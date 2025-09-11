import { openRouterWithFallback } from './openRouterFallback.js';

/**
 * Validates production environment configuration for voice calls
 */
export async function validateProductionEnvironment(): Promise<{
  success: boolean;
  errors: string[];
  warnings: string[];
  details: Record<string, any>;
}> {
  const errors: string[] = [];
  const warnings: string[] = [];
  const details: Record<string, any> = {};

  console.log('🔍 [ENV VALIDATION] Starting production environment validation...');

  // Check required environment variables
  const requiredEnvVars = [
    'OPENROUTER_API_KEY',
    'DEEPGRAM_API_KEY',
    'DEEPGRAM_PROJECT_ID',
    'NODE_ENV'
  ];

  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      errors.push(`Missing required environment variable: ${envVar}`);
    } else {
      details[envVar] = envVar === 'OPENROUTER_API_KEY' || envVar === 'DEEPGRAM_API_KEY' 
        ? `${process.env[envVar]?.substring(0, 10)}...` 
        : process.env[envVar];
    }
  }

  // Check optional but recommended variables
  const optionalEnvVars = [
    'VOICE_AI_MODEL',
    'MONGODB_URI',
    'JWT_SECRET'
  ];

  for (const envVar of optionalEnvVars) {
    if (!process.env[envVar]) {
      warnings.push(`Optional environment variable not set: ${envVar}`);
    } else {
      details[envVar] = envVar.includes('SECRET') || envVar.includes('URI')
        ? `${process.env[envVar]?.substring(0, 10)}...`
        : process.env[envVar];
    }
  }

  // Test OpenRouter connectivity
  console.log('🔍 [ENV VALIDATION] Testing OpenRouter connectivity...');
  try {
    const testRequest = {
      model: process.env.VOICE_AI_MODEL || "x-ai/grok-code-fast-1",
      messages: [
        { role: "user", content: "Hello, this is a test message for production validation." }
      ],
      max_tokens: 10,
      temperature: 0.7
    };

    const result = await openRouterWithFallback(testRequest);
    
    if (result.success) {
      details.openRouterTest = {
        status: 'success',
        modelUsed: result.modelUsed,
        responsePreview: result.data?.choices?.[0]?.message?.content?.substring(0, 50)
      };
      console.log('✅ [ENV VALIDATION] OpenRouter connectivity test passed');
    } else {
      errors.push(`OpenRouter connectivity test failed: ${result.error}`);
      details.openRouterTest = {
        status: 'failed',
        error: result.error
      };
      console.error('❌ [ENV VALIDATION] OpenRouter connectivity test failed:', result.error);
    }
  } catch (error) {
    errors.push(`OpenRouter connectivity test error: ${error}`);
    details.openRouterTest = {
      status: 'error',
      error: String(error)
    };
    console.error('❌ [ENV VALIDATION] OpenRouter connectivity test error:', error);
  }

  // Network and production-specific checks
  details.environment = {
    nodeEnv: process.env.NODE_ENV,
    platform: process.platform,
    nodeVersion: process.version,
    timestamp: new Date().toISOString()
  };

  const success = errors.length === 0;
  
  console.log(`🔍 [ENV VALIDATION] Validation complete:`, {
    success,
    errorCount: errors.length,
    warningCount: warnings.length
  });

  return {
    success,
    errors,
    warnings,
    details
  };
}

/**
 * Quick health check for voice call functionality
 */
export async function quickVoiceCallHealthCheck(): Promise<boolean> {
  try {
    console.log('🏥 [HEALTH CHECK] Running quick voice call health check...');
    
    // Check essential components
    const hasOpenRouterKey = !!process.env.OPENROUTER_API_KEY;
    const hasDeepgramKey = !!process.env.DEEPGRAM_API_KEY;
    const hasVoiceModel = !!process.env.VOICE_AI_MODEL;
    
    console.log('🏥 [HEALTH CHECK] Component status:', {
      openRouterKey: hasOpenRouterKey,
      deepgramKey: hasDeepgramKey,
      voiceModel: hasVoiceModel
    });
    
    if (!hasOpenRouterKey || !hasDeepgramKey) {
      console.error('❌ [HEALTH CHECK] Missing essential API keys');
      return false;
    }
    
    // Quick OpenRouter test
    const testRequest = {
      model: process.env.VOICE_AI_MODEL || "x-ai/grok-code-fast-1",
      messages: [{ role: "user", content: "test" }],
      max_tokens: 5
    };
    
    const result = await openRouterWithFallback(testRequest);
    
    if (result.success) {
      console.log('✅ [HEALTH CHECK] Voice call health check passed');
      return true;
    } else {
      console.error('❌ [HEALTH CHECK] OpenRouter test failed:', result.error);
      return false;
    }
  } catch (error) {
    console.error('❌ [HEALTH CHECK] Health check error:', error);
    return false;
  }
}
