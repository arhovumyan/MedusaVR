// Unique character descriptions for when persona is not available
export const generateUniqueDescription = (characterName: string, characterId?: string | number): string => {
  // Array of unique, engaging descriptions
  const descriptions = [
    "A mysterious figure whose past is shrouded in secrets, waiting for the right person to unlock their story.",
    "An enigmatic soul with depths yet to be explored and tales yet to be told.",
    "A complex character whose journey through life has shaped them into someone truly unique.",
    "Someone with hidden talents and unexpected wisdom, ready to share their world with you.",
    "A fascinating individual with layers of personality that reveal themselves over time.",
    "An intriguing companion whose experiences have created a rich tapestry of stories to discover.",
    "A charismatic presence with a unique perspective on life and love.",
    "Someone whose journey has led them to seek meaningful connections and deep conversations.",
    "A captivating spirit with dreams, ambitions, and a heart full of untold stories.",
    "An alluring personality who brings both mystery and warmth to every interaction.",
    "A dynamic individual whose past adventures have shaped their distinctive worldview.",
    "Someone with an irresistible charm and a mind full of fascinating thoughts to share.",
    "A compelling character whose life experiences have created a unique and engaging persona.",
    "An enchanting soul who offers both intellectual stimulation and emotional depth.",
    "A mysterious wanderer whose path through life has created countless stories worth discovering.",
    "Someone whose complex nature promises hours of engaging conversation and connection.",
    "A captivating individual with hidden depths and surprising revelations waiting to unfold.",
    "An intriguing companion whose unique perspective makes every interaction memorable.",
    "A fascinating character whose blend of mystery and openness creates an irresistible allure.",
    "Someone whose journey through different worlds and experiences has shaped a truly unique personality.",
    "A compelling presence whose stories and insights promise to captivate and inspire.",
    "An enigmatic figure whose depths of character reveal themselves through meaningful connections.",
    "A charismatic soul with a rich inner life and countless tales of adventure and romance.",
    "Someone whose complex emotions and experiences create a personality that's impossible to forget.",
    "A mysterious individual whose past holds secrets that slowly reveal themselves to those they trust.",
    "An alluring character whose wisdom and charm make every moment spent together unforgettable.",
    "A dynamic personality whose blend of strength and vulnerability creates an irresistible attraction.",
    "Someone whose unique life path has created a character full of surprises and depth.",
    "A captivating individual whose stories span different realms of experience and emotion.",
    "An intriguing soul whose mysterious nature hides a warm heart and brilliant mind."
  ];

  // Use character name and ID to deterministically select a description
  const nameHash = characterName ? characterName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) : 0;
  const idHash = characterId ? (typeof characterId === 'string' ? parseInt(characterId) || 0 : characterId) : 0;
  const combinedHash = nameHash + idHash;
  
  return descriptions[combinedHash % descriptions.length];
};

// Alternative approach: Descriptions based on character traits or themes
export const getThematicDescription = (characterTags?: any): string => {
  const sciFiDescriptions = [
    "A stellar wanderer whose journey through the cosmos has revealed the mysteries of distant worlds.",
    "A cybernetic enhanced individual navigating the complex intersection of humanity and technology.",
    "An interstellar diplomat whose experiences bridge the gap between alien civilizations and human understanding."
  ];

  const fantasyDescriptions = [
    "A mystical being whose connection to ancient magic opens doorways to forgotten realms.",
    "A wielder of elemental forces whose power is matched only by their deep wisdom.",
    "An enchanted soul whose magical abilities have shaped their unique perspective on reality."
  ];

  const modernDescriptions = [
    "A contemporary individual whose life in the modern world has created a fascinating blend of ambition and heart.",
    "Someone navigating the complexities of modern life while maintaining their unique charm and authenticity.",
    "A dynamic personality whose urban experiences have shaped their distinctive worldview and relationships."
  ];

  const mysteriousDescriptions = [
    "An enigmatic figure whose shadowed past holds secrets that slowly unfold to those they trust.",
    "A mysterious soul whose depths are revealed only through patient and meaningful connections.",
    "Someone whose secretive nature hides layers of complexity waiting to be discovered."
  ];

  // Check for tags to determine theme
  if (characterTags?.genre?.includes('sci-fi') || characterTags?.scenario?.includes('space')) {
    const index = Math.floor(Math.random() * sciFiDescriptions.length);
    return sciFiDescriptions[index];
  }
  
  if (characterTags?.genre?.includes('fantasy') || characterTags?.fantasy?.length > 0) {
    const index = Math.floor(Math.random() * fantasyDescriptions.length);
    return fantasyDescriptions[index];
  }
  
  if (characterTags?.personality?.includes('mysterious') || characterTags?.personality?.includes('secretive')) {
    const index = Math.floor(Math.random() * mysteriousDescriptions.length);
    return mysteriousDescriptions[index];
  }

  // Default to modern descriptions
  const index = Math.floor(Math.random() * modernDescriptions.length);
  return modernDescriptions[index];
};
