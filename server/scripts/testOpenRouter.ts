import fetch from 'node-fetch';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Add type definitions for OpenRouter API response
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

async function testModelWithFallback(model: string, modelIndex: number, totalModels: number): Promise<boolean> {
  console.log(`🔧 Testing model ${modelIndex}/${totalModels}: ${model}`);
  
  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: "user", content: "Hello, this is a test message." }
        ],
        max_tokens: 50
      }),
    });
    
    console.log(`📡 Response Status: ${response.status}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Model ${model} failed:`, errorText);
      
      // Check if it's a "model is busy" error
      if (errorText.includes('busy') || errorText.includes('502')) {
        console.log(`⏳ Model ${model} is busy, trying next fallback...`);
        return false;
      }
      
      return false;
    }
    
    const data = await response.json() as OpenRouterResponse;
    
    // Check for error in response data
    if (data.error) {
      console.error(`❌ Model ${model} error:`, data.error.message);
      if (data.error.message.includes('busy') || data.error.code === 502) {
        console.log(`⏳ Model ${model} is busy, trying next fallback...`);
        return false;
      }
      return false;
    }
    
    console.log(`✅ Model ${model} successful!`);
    console.log('📝 Test Response:', data.choices?.[0]?.message?.content || 'No content received');
    return true;
    
  } catch (error) {
    console.error(`❌ Connection error with ${model}:`, error);
    return false;
  }
}

async function testOpenRouterConnection() {
  console.log('🔧 Testing OpenRouter API connection with fallback models...');
  
  // Check if API key is configured
  if (!process.env.OPENROUTER_API_KEY) {
    console.error('❌ OPENROUTER_API_KEY environment variable is not set');
    console.log('Please add your OpenRouter API key to your .env file:');
    console.log('OPENROUTER_API_KEY=your_api_key_here');
    return;
  }
  
  console.log('✅ OpenRouter API key found');
  
  // Define backup models in priority order
  const models = [
    "x-ai/grok-code-fast-1",
    "mistralai/mistral-small-3.2-24b-instruct", 
    "mistralai/mistral-small-24b-instruct-2501",
    "mistralai/pixtral-12b"
  ];
  
  console.log('📋 Available models (in priority order):');
  models.forEach((model, index) => {
    console.log(`   ${index + 1}. ${model}`);
  });
  console.log('');
  
  // Try each model until one works
  for (let i = 0; i < models.length; i++) {
    const success = await testModelWithFallback(models[i], i + 1, models.length);
    
    if (success) {
      console.log(`🎉 Successfully connected using model: ${models[i]}`);
      console.log(`💡 This model should be used as the primary choice.`);
      return;
    }
    
    // Add a small delay between attempts
    if (i < models.length - 1) {
      console.log('⏱️ Waiting 2 seconds before trying next model...\n');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  console.error('❌ All models failed or are busy. Please try again later.');
  console.log('💡 You may want to check the OpenRouter status page or try different models.');
}

// Run the test
testOpenRouterConnection(); 