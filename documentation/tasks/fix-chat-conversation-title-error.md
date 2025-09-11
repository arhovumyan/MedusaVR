# Fix Chat Conversation Title Validation Error

## Problem
WebSocket connection works and authentication is successful, but messages fail to save due to a Mongoose validation error:
```
ValidationError: Conversation validation failed: title: Path `title` is required.
```

## Analysis
- WebSocket connection: ✅ Working
- Authentication: ✅ Working  
- Message sending: ❌ Failing due to missing `title` field in Conversation model
- The conversation document is being created without a required `title` field

## Plan

### Todo Items
- [ ] 1. **Examine the Conversation model** to understand the title field requirement
- [ ] 2. **Find the Socket.IO message handler** that creates/saves conversations
- [ ] 3. **Add title generation logic** when creating new conversations
- [ ] 4. **Test the fix** by sending a message in chat
- [ ] 5. **Rebuild and verify** the solution works without errors

### Implementation Strategy
- Keep changes minimal and focused on the validation error
- Generate a simple title based on character name or message content
- Ensure backwards compatibility with existing conversations

## Expected Outcome
- Messages should save successfully to the database
- Chat functionality should work properly
- No validation errors in backend logs
