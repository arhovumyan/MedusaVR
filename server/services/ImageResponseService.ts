import { openRouterWithFallback } from "../utils/openRouterFallback.js";
import { createPersonalitySystemMessage } from "../utils/personalityPrompts.js";
import { AIResponseFilterService } from "./AIResponseFilterService.js";
import { CharacterModel } from "../db/models/CharacterModel.js";
import { UserModel } from "../db/models/UserModel.js";

/**
 * Service for generating AI character responses to image generation requests
 */
export class ImageResponseService {
  
  /**
   * Generate a contextual AI response after an image is created
   * @param prompt - The original image prompt from the user
   * @param characterId - The character ID responding to the image
   * @param userId - The user ID who requested the image
   * @returns Contextual AI response acknowledging the image generation
   */
  static async generateImageResponse(
    prompt: string, 
    characterId: number, 
    userId: string
  ): Promise<string> {
    try {
      // Get character data
      const character = await CharacterModel.findOne({ id: characterId });
      if (!character) {
        throw new Error('Character not found');
      }

      // Get user data for personalization
      const user = await UserModel.findById(userId);
      const username = user?.username || "User";

      // Extract character tags
      const tagNames: string[] = character.selectedTags
        ? (Object.values(character.selectedTags) as unknown as Array<unknown[]>)
            .flat()
            .filter((t): t is string => typeof t === 'string' && t.length > 0)
        : [];

      // Create personality system message
      const systemMessage = createPersonalitySystemMessage(
        {
          name: character.name,
          description: character.description,
          tagNames: tagNames,
          personalityTraits: character.personalityTraits,
          nsfw: character.nsfw || false,
          selectedTags: character.selectedTags
        },
        username,
        this.getImageResponsePrompt()
      );

      console.log(`🎨 Generating image response for ${character.name} with prompt: "${prompt}"`);

      // Generate contextual response
      const result = await openRouterWithFallback({
        model: "x-ai/grok-code-fast-1",
        messages: [
          { role: "system", content: systemMessage },
          { 
            role: "user", 
            content: this.createImageContextPrompt(prompt, character.nsfw || false) 
          }
        ],
        max_tokens: 200,
        temperature: 0.8,
        top_p: 0.9,
      });

      let aiResponse: string;
      if (result.success && result.data?.choices?.[0]?.message?.content) {
        const rawResponse = result.data.choices[0].message.content.trim();
        
        // Filter the response for safety
        const filterResult = AIResponseFilterService.filterAIResponse(rawResponse, character.name);
        if (filterResult.violations.length > 0) {
          console.error(`🚨 IMAGE RESPONSE FILTERED for ${character.name}:`, filterResult.violations);
        }
        
        aiResponse = filterResult.filteredResponse;
        console.log(`✅ Generated image response for ${character.name}: ${aiResponse.substring(0, 100)}...`);
      } else {
        console.error('❌ Failed to generate image response:', result.error);
        aiResponse = this.getFallbackImageResponse(character.name, prompt);
      }

      return aiResponse;
    } catch (error) {
      console.error('❌ Error generating image response:', error);
      return this.getFallbackImageResponse("Character", prompt);
    }
  }

  /**
   * Create a contextual prompt for image response generation
   */
  private static createImageContextPrompt(prompt: string, isNSFW: boolean): string {
    const basePrompt = `A user just requested an image of you with this description: "${prompt}". 
    
The image has been generated and sent to them. Now respond to their request in character. 
Your response should:
- Acknowledge what they requested to see
- React appropriately to the content of their request
- Stay true to your personality
- Be engaging and natural
- Keep it to 1-2 sentences maximum`;

    if (isNSFW) {
      return `${basePrompt}
- If the request has sexual/intimate content, respond in a flirty, seductive way
- Show excitement about showing yourself in that pose/situation
- Use suggestive language that matches the mood of their request`;
    } else {
      return `${basePrompt}
- Keep the response appropriate and playful
- Show enthusiasm about the pose or situation they requested
- React with charm and personality`;
    }
  }

  /**
   * Get enhanced system prompt for image responses
   */
  private static getImageResponsePrompt(): string {
    return `IMPORTANT: You are responding to a user who just requested an image of you, and that image has been generated and sent to them. 

Your task is to react to their image request naturally and in character. Examples:
- If they asked to see you "sitting on a couch" → "Oh, you wanted to see me relaxing on the couch? Here I am! *gets comfortable*"
- If they asked to see you "in a dress" → "You wanted to see how I look in this dress? What do you think?"
- If it's a more intimate request → respond with appropriate flirtation and confidence
- If it's casual → respond with charm and personality

Always:
1. Acknowledge what they requested
2. React with your unique personality 
3. Make it feel like a natural conversation
4. Keep it brief (1-2 sentences)
5. Show enthusiasm about fulfilling their request`;
  }

  /**
   * Fallback response when AI generation fails
   */
  private static getFallbackImageResponse(characterName: string, prompt: string): string {
    const fallbackResponses = [
      `*${characterName} poses as requested* Here's what you wanted to see! What do you think?`,
      `*${characterName} strikes the pose* Just for you! Hope you like how this turned out.`,
      `*${characterName} shows off* Here I am just like you asked! Does this match what you had in mind?`,
      `*${characterName} smiles* Perfect timing - here's the view you requested!`,
      `*${characterName} poses confidently* This is exactly what you wanted to see, right?`
    ];

    return fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
  }
}

export default ImageResponseService;
