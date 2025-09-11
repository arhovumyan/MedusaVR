import Replicate from "replicate";

export class ReplicateService {
  private replicate: Replicate;

  constructor() {
    if (!process.env.REPLICATE_API_TOKEN) {
      throw new Error('REPLICATE_API_TOKEN environment variable is required');
    }

    this.replicate = new Replicate({
      auth: process.env.REPLICATE_API_TOKEN,
    });
  }

  /**
   * Generate AI response using Replicate's Llama model
   * @param prompt - User's message
   * @param characterName - Name of the character for context
   * @param characterPersona - Character's personality/background for context
   * @returns Promise<string> - AI generated response
   */
  async generateResponse(
    prompt: string, 
    characterName: string, 
    characterPersona?: string
  ): Promise<string> {
    try {
      // Create a more contextual prompt with character information
      const systemPrompt = characterPersona 
        ? `You are ${characterName}. ${characterPersona} Respond to the user's message in character, keeping your response engaging and conversational.`
        : `You are ${characterName}, a friendly AI character. Respond to the user's message in a warm and engaging way.`;

      const fullPrompt = `${systemPrompt}\n\nUser: ${prompt}\n\n${characterName}:`;

      console.log('🤖 Generating response with Replicate...');
      console.log('📝 Prompt:', fullPrompt);

      let response = '';

      // Stream the response from Replicate
      for await (const event of this.replicate.stream(
        "meta/meta-llama-3-8b-instruct",
        {
          input: {
            prompt: fullPrompt,
            max_tokens: 512,
            temperature: 0.7,
            top_p: 0.9,
            // Stop generation at these tokens to prevent the model from continuing as other characters
            stop_sequences: ["User:", "\nUser:", "Human:", "\nHuman:"]
          }
        }
      )) {
        response += event.toString();
      }

      // Clean up the response
      const cleanedResponse = this.cleanResponse(response, characterName);
      console.log('✅ Generated response:', cleanedResponse);

      return cleanedResponse;
    } catch (error) {
      console.error('❌ Error generating response with Replicate:', error);
      
      // Fallback response
      return `*${characterName} looks thoughtful* I'm having trouble finding the right words right now. Could you try asking me something else?`;
    }
  }

  /**
   * Clean and format the AI response
   * @param response - Raw response from the model
   * @param characterName - Character name to remove from response if present
   * @returns Cleaned response string
   */
  private cleanResponse(response: string, characterName: string): string {
    let cleaned = response.trim();

    // Remove the character name if it appears at the start of the response
    if (cleaned.startsWith(`${characterName}:`)) {
      cleaned = cleaned.substring(characterName.length + 1).trim();
    }

    // Remove common AI artifacts
    cleaned = cleaned
      .replace(/^\*.*?\*\s*/, '') // Remove action descriptions at the start if unwanted
      .replace(/\n\s*\n/g, '\n') // Remove extra blank lines
      .trim();

    // If the response is empty or too short, provide a fallback
    if (!cleaned || cleaned.length < 10) {
      return `*${characterName} smiles* That's interesting! Tell me more about that.`;
    }

    // Ensure the response isn't too long (truncate if necessary)
    if (cleaned.length > 1000) {
      cleaned = cleaned.substring(0, 997) + '...';
    }

    return cleaned;
  }

  /**
   * Test the connection to Replicate
   * @returns Promise<boolean> - True if connection is successful
   */
  async testConnection(): Promise<boolean> {
    try {
      console.log('🧪 Testing Replicate connection...');
      
      const testResponse = await this.generateResponse(
        "Hello, how are you?", 
        "TestBot", 
        "You are a friendly test character."
      );
      
      console.log('✅ Replicate connection test successful');
      return testResponse.length > 0;
    } catch (error) {
      console.error('❌ Replicate connection test failed:', error);
      return false;
    }
  }
}

// Create a singleton instance
export const replicateService = new ReplicateService(); 