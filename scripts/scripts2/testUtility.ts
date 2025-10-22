import { openRouterWithFallback, testOpenRouterConnection } from '../utils/openRouterFallback';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

async function testUtilityFunction() {
  console.log(' Testing OpenRouter utility function...');
  
  // Test the utility function
  const result = await openRouterWithFallback({
    model: "x-ai/grok-code-fast-1", // This will be used as primary
    messages: [
      { role: "user", content: "Hello, testing the fallback utility!" }
    ],
    max_tokens: 50
  });

  if (result.success) {
    console.log(` Utility function successful using model: ${result.modelUsed}`);
    console.log(' Response:', result.data?.choices?.[0]?.message?.content);
  } else {
    console.error(' Utility function failed:', result.error);
  }

  // Test the quick connection check
  console.log('\n Testing quick connection check...');
  const isWorking = await testOpenRouterConnection();
  console.log(` OpenRouter connection status: ${isWorking ? 'Working' : 'Failed'}`);
}

testUtilityFunction();
