# Word Counting System Implementation

This document describes the implementation of the word counting system for tracking all words exchanged between users and AI characters.

## Overview

The word counting system tracks every word sent by users and AI responses, storing the total word count in each character's `chatCount` field. This replaces the previous simple message counting approach with a more meaningful metric.

## Key Components

### 1. Word Counting Utility (`server/utils/wordCountUtils.ts`)

- **`countWords(text: string)`**: Core function that counts words in any text
- **`updateCharacterWordCount(characterId: number)`**: Updates a specific character's word count
- **`updateAllCharacterWordCounts()`**: Batch updates all characters (for maintenance)

### 2. Automatic Updates

Word counts are automatically updated when messages are sent through:

- **Chat Routes** (`server/routes/chats.ts`): Updates when messages are sent via REST API
- **Conversation Service** (`server/services/ConversationService.ts`): Updates for the newer conversation system
- **Message Routes** (`server/routes/messages.ts`): Uses ConversationService, so automatically included

### 3. Data Sources

The system counts words from multiple data sources to ensure completeness:

- **Conversations Collection**: New conversation system with embedded messages
- **Messages Collection**: Separate messages linked to conversations  
- **Chats Collection**: Legacy chat system data

### 4. Frontend Display

The character cards (`client/src/components/ui/cards.tsx`) display word counts with fallback logic:

```tsx
{(char as any).totalWords ? (
  (char as any).totalWords > 1000 
    ? `${((char as any).totalWords / 1000).toFixed(1)}K` 
    : (char as any).totalWords.toLocaleString()
) : (char.chatCount ? (char.chatCount > 1000 
  ? `${(char.chatCount / 1000).toFixed(1)}K` 
  : char.chatCount.toLocaleString()
) : '0')}
```

## API Endpoints

### Word Statistics Routes (`server/routes/wordStats.ts`)

- **`GET /api/word-stats/character/:characterId`**: Get word stats for a specific character
- **`GET /api/word-stats/all-characters`**: Get word stats for all characters (used by frontend)
- **`GET /api/word-stats/user/:characterId`**: Get user-specific word stats (requires auth)
- **`POST /api/word-stats/update-chat-counts`**: Manually trigger word count updates for all characters
- **`POST /api/word-stats/update-chat-count/:characterId`**: Update a specific character's word count

## How It Works

1. **Message Sending**: When a user sends a message and receives an AI response:
   - Both messages are saved to the database
   - `updateCharacterWordCount()` is called asynchronously to recalculate total words
   - The character's `chatCount` field is updated with the new total

2. **Word Counting**: The system:
   - Finds all conversations and messages for the character
   - Counts words in both user and AI messages
   - Sums up the total word count
   - Updates the character's `chatCount` field

3. **Frontend Display**: Character cards:
   - Fetch word statistics via the `/api/word-stats/all-characters` endpoint
   - Display `totalWords` if available, otherwise fall back to `chatCount`
   - Format large numbers (e.g., "1.2K" for 1,200 words)

## Database Schema

The `characters` collection now uses the `chatCount` field to store total word counts instead of simple message counts:

```javascript
{
  id: 794977,
  name: "Character Name",
  chatCount: 1523, // Total words exchanged with this character
  // ... other fields
}
```

## Performance Considerations

- Word count updates run asynchronously to avoid blocking message sending
- The system is designed to be eventually consistent
- Batch updates are available for maintenance but should be used sparingly
- Frontend caching reduces database queries for word statistics

## Migration

Existing characters will have their `chatCount` values updated from message counts to word counts when:

1. New messages are sent (automatic)
2. Manual update endpoints are called
3. The frontend fetches word statistics

## Monitoring

- All word count operations include logging for debugging
- Failed word count updates are logged but don't block message sending
- The system gracefully handles missing or corrupted data

## Example Usage

```typescript
// Count words in a text
import { countWords } from '../utils/wordCountUtils.js';
const words = countWords("Hello world"); // Returns 2

// Update a character's word count
import { updateCharacterWordCount } from '../utils/wordCountUtils.js';
await updateCharacterWordCount(794977);

// Batch update all characters  
import { updateAllCharacterWordCounts } from '../utils/wordCountUtils.js';
const result = await updateAllCharacterWordCounts();
console.log(`Updated ${result.updatedCount} characters`);
```
