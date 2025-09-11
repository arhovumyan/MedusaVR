# Voice Call Bug Fixes - Todo List

## Problems Identified

### 🗣️ Voice Cutting Issue (Critical)
**Problem**: AI response text doesn't match TTS audio output
- AI Response: "*Oh, hello there!*" 
- TTS Audio: "I understand."
- **Root Cause**: TTS conversion is getting wrong text or cached text

### 🤖 Conversation Flow Issues (Critical)  
**Problem**: AI gives nonsensical responses that don't follow conversation context
- User: "Hey. How's it going?"
- AI: "*Curious* What's my name?"
- **Root Cause**: AI model context/prompting issues

### ❌ Session Cleanup Error (High)
**Problem**: `ReferenceError: require is not defined` in disconnect handler
- **Root Cause**: ES modules can't use `require()` syntax

### 🔄 Response Processing Issues (Medium)
**Problem**: TTS is processing wrong text even when AI response is correct

## Todo Items

### ✅ Analysis Phase
- [x] Analyze logs to identify issues
- [x] Review voice processing flow
- [x] Identify root causes

### 🔧 Critical Fixes
- [ ] Fix TTS text extraction from AI responses  
- [ ] Fix conversation context in AI prompts
- [ ] Replace require() with ES module imports in disconnect handler
- [ ] Add conversation history to voice calls

### 🧪 Voice Processing Fixes
- [ ] Review TTS text processing logic
- [ ] Fix text filtering for actions vs speech
- [ ] Ensure proper text extraction from AI responses
- [ ] Add debugging for TTS input text

### 🤖 AI Response Improvements
- [ ] Review AI prompting system for voice calls
- [ ] Add proper conversation context
- [ ] Fix character personality consistency
- [ ] Ensure responses make sense in context

### 🧹 Code Quality Fixes
- [ ] Fix ES module import issues
- [ ] Add better error handling
- [ ] Improve logging for debugging

### 🧪 Testing Phase
- [ ] Test voice TTS accuracy
- [ ] Test conversation flow
- [ ] Test session cleanup
- [ ] Test error handling

## Key Files to Fix
- `/server/services/DeepgramVoiceService.ts` - TTS processing logic
- `/server/config/socket.ts` - Session cleanup error
- Voice prompting system - AI context issues
- Audio processing pipeline - Text extraction

## Implementation Strategy
1. **Fix TTS Processing**: Ensure correct text is sent to TTS
2. **Fix AI Context**: Improve conversation prompting 
3. **Fix Module Imports**: Replace require() with import
4. **Add Debugging**: Better logging for troubleshooting
5. **Test Thoroughly**: Verify all fixes work correctly
