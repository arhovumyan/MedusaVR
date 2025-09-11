import fetch, { Response as FetchResponse } from 'node-fetch';

// Type definitions for OpenRouter API response
interface OpenRouterChoice {
  message?: {
    content?: string;
  };
}

interface OpenRouterResponse {
  choices?: OpenRouterChoice[];
  error?: {
    message: string;
    code: number;
  };
}

interface OpenRouterRequestBody {
  model: string;
  messages: Array<{ role: string; content: string }>;
  max_tokens?: number;
  temperature?: number;
  top_p?: number;
  stream?: boolean;
}

// Fallback models in priority order
const FALLBACK_MODELS = [
  "x-ai/grok-code-fast-1",
  "mistralai/mistral-small-3.2-24b-instruct", 
  "mistralai/mistral-small-24b-instruct-2501",
  "mistralai/pixtral-12b"
];

/**
 * Tests if a model is available and working
 */
async function testModel(model: string, requestBody: OpenRouterRequestBody): Promise<{ success: boolean; response?: FetchResponse; data?: any; error?: string }> {
  console.log(`🔍 [PRODUCTION DEBUG] Testing model: ${model}`);
  
  try {
    console.log(`🔍 [PRODUCTION DEBUG] Making fetch request to OpenRouter...`);
    
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...requestBody,
        model
      }),
    });

    console.log(`🔍 [PRODUCTION DEBUG] Fetch response received:`, {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.log(`🔍 [PRODUCTION DEBUG] Error response text: ${errorText}`);
      
      // Check if it's a "model is busy" error
      if (errorText.includes('busy') || errorText.includes('502')) {
        console.log(`⏳ Model ${model} is busy, trying next fallback...`);
        return { success: false, error: 'busy' };
      }
      
      return { success: false, error: `HTTP ${response.status}: ${errorText}` };
    }

    // For streaming responses, return the response object
    if (requestBody.stream) {
      console.log(`🔍 [PRODUCTION DEBUG] Returning streaming response`);
      return { success: true, response };
    }

    // For non-streaming responses, parse JSON
    console.log(`🔍 [PRODUCTION DEBUG] Parsing JSON response...`);
    const data = await response.json() as OpenRouterResponse;
    
    console.log(`🔍 [PRODUCTION DEBUG] Parsed response data:`, {
      hasChoices: !!data.choices,
      choicesLength: data.choices?.length,
      hasError: !!data.error,
      errorMessage: data.error?.message
    });
    
    // Check for error in response data
    if (data.error) {
      console.log(`🔍 [PRODUCTION DEBUG] Response contains error: ${data.error.message}`);
      if (data.error.message.includes('busy') || data.error.code === 502) {
        console.log(`⏳ Model ${model} is busy, trying next fallback...`);
        return { success: false, error: 'busy' };
      }
      return { success: false, error: data.error.message };
    }

    console.log(`🔍 [PRODUCTION DEBUG] ✅ Model test successful for: ${model}`);
    return { success: true, data };
    
  } catch (error) {
    console.error(`❌ Connection error with ${model}:`, error);
    console.log(`🔍 [PRODUCTION DEBUG] ❌ Exception in testModel:`, error);
    return { success: false, error: `Connection error: ${error}` };
  }
}

/**
 * Makes an OpenRouter API call with automatic fallback to backup models
 * @param requestBody - The OpenRouter request body
 * @param primaryModel - Optional primary model to try first (defaults to current model)
 * @returns Promise with the response
 */
export async function openRouterWithFallback(
  requestBody: OpenRouterRequestBody,
  primaryModel?: string
): Promise<{ success: boolean; response?: FetchResponse; data?: any; error?: string; modelUsed?: string }> {
  
  console.log(`🔍 [PRODUCTION DEBUG] OpenRouter fallback called`);
  console.log(`🔍 [PRODUCTION DEBUG] Environment: ${process.env.NODE_ENV || 'unknown'}`);
  console.log(`🔍 [PRODUCTION DEBUG] API Key present: ${!!process.env.OPENROUTER_API_KEY}`);
  console.log(`🔍 [PRODUCTION DEBUG] Primary model: ${primaryModel || requestBody.model}`);

  // Use provided primary model or the model from request body
  const modelsToTry = primaryModel 
    ? [primaryModel, ...FALLBACK_MODELS.filter(m => m !== primaryModel)]
    : [requestBody.model, ...FALLBACK_MODELS.filter(m => m !== requestBody.model)];

  console.log(`🔧 OpenRouter fallback system activated. Models to try: ${modelsToTry.length}`);
  console.log(`🔍 [PRODUCTION DEBUG] Models queue: ${modelsToTry.join(', ')}`);
  
  for (let i = 0; i < modelsToTry.length; i++) {
    const model = modelsToTry[i];
    console.log(`🔧 Trying model ${i + 1}/${modelsToTry.length}: ${model}`);
    console.log(`🔍 [PRODUCTION DEBUG] About to test model: ${model}`);
    
    const result = await testModel(model, requestBody);
    
    console.log(`🔍 [PRODUCTION DEBUG] Model ${model} test result:`, {
      success: result.success,
      error: result.error,
      hasResponse: !!result.response,
      hasData: !!result.data
    });
    
    if (result.success) {
      console.log(`✅ Successfully connected using model: ${model}`);
      console.log(`🔍 [PRODUCTION DEBUG] ✅ Returning successful result for model: ${model}`);
      return { 
        success: true, 
        response: result.response, 
        data: result.data, 
        modelUsed: model 
      };
    }
    
    console.error(`❌ Model ${model} failed:`, result.error);
    console.log(`🔍 [PRODUCTION DEBUG] ❌ Model ${model} failed with error: ${result.error}`);
    
    // Add a small delay between attempts (except for the last one)
    if (i < modelsToTry.length - 1) {
      console.log('⏱️ Waiting 2 seconds before trying next model...');
      console.log(`🔍 [PRODUCTION DEBUG] Waiting before trying next model...`);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  console.error('❌ All models failed or are busy. Please try again later.');
  console.log(`🔍 [PRODUCTION DEBUG] ❌ ALL MODELS FAILED - no fallback worked`);
  return { 
    success: false, 
    error: 'All fallback models failed or are busy' 
  };
}

/**
 * Quick test function to check if OpenRouter is working
 */
export async function testOpenRouterConnection(): Promise<boolean> {
  const testRequest: OpenRouterRequestBody = {
    model: FALLBACK_MODELS[0], // Will be replaced by fallback system
    messages: [
      { role: "user", content: "Hello, this is a test message." }
    ],
    max_tokens: 50
  };

  const result = await openRouterWithFallback(testRequest);
  return result.success;
}
