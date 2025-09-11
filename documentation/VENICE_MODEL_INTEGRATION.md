# AI Model Configuration - Venice Uncensored

## Model Update Summary

**Date:** July 19, 2025  
**Previous Model:** `mistralai/mistral-7b-instruct` and `pygmalionai/mythalion-13b`  
**New Model:** `nothingiisreal/mn-celeste-12b`

## Venice Uncensored Model Details

### Model Information
- **Provider:** OpenRouter.ai
- **Model Name:** Dolphin Mistral 24B Venice Edition
- **Type:** Uncensored large language model
- **Parameters:** 24 billion (significantly larger than previous 7B and 13B models)
- **Pricing:** Free tier available
- **API Endpoint:** `https://openrouter.ai/nothingiisreal/mn-celeste-12b`
### Key Features
- **Uncensored:** Minimal content filtering for more open conversations
- **Large Context:** Better understanding and memory retention
- **Enhanced Roleplay:** Specifically optimized for character interactions
- **Better Instruction Following:** Improved adherence to character personas

### Configuration Parameters
```json
{
  "model": "nothingiisreal/mn-celeste-12b",
  "max_tokens": 350,
  "temperature": 0.8,
  "top_p": 0.9,
  "stream": true
}
```

### Parameter Explanations
- **max_tokens: 350** - Increased from 250 to allow for more detailed responses
- **temperature: 0.8** - Balanced creativity vs coherence (0.0 = deterministic, 1.0 = very creative)
- **top_p: 0.9** - Nucleus sampling for quality control
- **stream: true** - Real-time response streaming for better UX

## Files Modified

### 1. Socket Configuration (`server/config/socket.ts`)
- **Line ~268:** Updated model in main chat streaming endpoint
- **Purpose:** Real-time chat conversations via WebSocket

### 2. REST API Route (`server/routes/chats.ts`)
- **Line ~212:** Updated model in fallback REST endpoint
- **Purpose:** Fallback chat when WebSocket isn't available

## Testing the Integration

### 1. Start Development Server
```bash
npm run dev:server
```

### 2. Test Chat Functionality
- Navigate to `/chat/:characterId` in your application
- Send a message to verify the Venice model is responding
- Check server logs for OpenRouter API calls

### 3. Monitor Response Quality
- Verify character consistency
- Check response length and detail
- Ensure personality traits are maintained

## Expected Improvements

1. **Better Character Roleplay** - More consistent character personalities
2. **Longer Responses** - Up to 350 tokens vs previous 250
3. **Enhanced Creativity** - More engaging and varied responses
4. **Reduced Censorship** - More open conversations within platform guidelines
5. **Better Context Understanding** - 24B parameter model provides superior comprehension

## API Key Requirements

Ensure your `.env` file contains:
```env
OPENROUTER_API_KEY=your_openrouter_api_key_here
```

## Monitoring and Logs

The system logs will show:
- `OpenRouter Request Body` - Full request details
- `Messages sent to OpenRouter` - Conversation history
- `OpenRouter Response Status` - API response status
- Response streaming details

## Rollback Plan

If issues occur, revert to previous models by changing:
```typescript
// Socket endpoint
model: "mistralai/mistral-7b-instruct"

// REST endpoint  
model: "pygmalionai/mythalion-13b"
```

## Performance Notes

- Venice model may have slightly longer response times due to larger parameter count
- Free tier has rate limits - monitor usage
- Consider upgrading to paid tier for production use if needed

## Character Chat Integration

The Venice model works with your existing character system:
- Character personas are included in system messages
- User preferences and character tags are respected
- Conversation history is maintained
- Coin deduction system remains unchanged

Your chat functionality at `/chat/:characterId` now uses the Venice Uncensored model for enhanced character interactions! 🎭✨
