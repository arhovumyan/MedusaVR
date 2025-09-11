import React, { useState } from 'react';
import { Save, Upload, X, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import CharacterImageGenerator from '@/components/CharacterImageGenerator';
import { personaTerms, type BroadTerm, type Trait } from '@/constants/personaTraits';
import { imageGenSuggestions } from '@/constants/ImageGenSuggestions';
import { checkProhibitedWords } from '@/lib/prohibitedWordsFilter';

// Tags data - matching the server tags.json structure
const tagsData = [
  {
    category: "Character Type",
    tags: [
      { name: "female", displayName: "Female", color: "#e84393", emoji: "👩‍🦰", isNSFW: false },
      { name: "male", displayName: "Male", color: "#0984e3", emoji: "👨‍🦰", isNSFW: false },
      { name: "non-human", displayName: "Non-human", color: "#6c5ce7", emoji: "🦄", isNSFW: false },
      { name: "non-binary", displayName: "Non-binary", color: "#fdcb6e", emoji: "🌈", isNSFW: false },
      { name: "myth", displayName: "Mythical", color: "#a29bfe", emoji: "🧜‍♀️", isNSFW: false },
      { name: "object", displayName: "Object", color: "#636e72", emoji: "🗿", isNSFW: false },
      { name: "queer", displayName: "Queer", color: "#fd79a8", emoji: "🏳️‍🌈", isNSFW: false }
    ]
  },
  {
    category: "Genre",
    tags: [
      { name: "scenario", displayName: "Scenario", color: "#00cec9", emoji: "🪢", isNSFW: false },
      { name: "fictional", displayName: "Fictional", color: "#74b9ff", emoji: "📚", isNSFW: false },
      { name: "multiple", displayName: "Multiple", color: "#fd79a8", emoji: "👭", isNSFW: false },
      { name: "rpg", displayName: "RPG", color: "#e17055", emoji: "🎲", isNSFW: false },
      { name: "anime", displayName: "Anime", color: "#fd79a8", emoji: "📺", isNSFW: false },
      { name: "magical", displayName: "Magical", color: "#a29bfe", emoji: "🔮", isNSFW: false },
      { name: "hentai", displayName: "Hentai", color: "#e84393", emoji: "🔞", isNSFW: true },
      { name: "royalty", displayName: "Royalty", color: "#fdcb6e", emoji: "👑", isNSFW: false },
      { name: "assistant", displayName: "Assistant", color: "#00b894", emoji: "💁", isNSFW: false },
      { name: "religion", displayName: "Religion", color: "#d63031", emoji: "⛪️", isNSFW: false },
      { name: "historical", displayName: "Historical", color: "#e17055", emoji: "🏰", isNSFW: false },
      { name: "action", displayName: "Action", color: "#ff4757", emoji: "💥", isNSFW: false },
      { name: "romantic", displayName: "Romantic", color: "#e84393", emoji: "💞", isNSFW: false },
      { name: "wholesome", displayName: "Wholesome", color: "#fdcb6e", emoji: "🤗", isNSFW: false },
      { name: "sci-fi", displayName: "Sci-Fi", color: "#0984e3", emoji: "🛸", isNSFW: false },
      { name: "horror", displayName: "Horror", color: "#2d3436", emoji: "👻", isNSFW: false },
      { name: "detective", displayName: "Detective", color: "#636e72", emoji: "🕵️‍♀️", isNSFW: false },
      { name: "philosophy", displayName: "Philosophy", color: "#6c5ce7", emoji: "📙", isNSFW: false },
      { name: "politics", displayName: "Politics", color: "#d63031", emoji: "📜", isNSFW: false },
      { name: "manga", displayName: "Manga", color: "#fd79a8", emoji: "📖", isNSFW: false },
      { name: "fandom", displayName: "Fandom", color: "#74b9ff", emoji: "⭐", isNSFW: false }
    ]
  },
  {
    category: "Personality",
    tags: [
      { name: "dominant", displayName: "Dominant", color: "#ff4757", emoji: "⛓️", isNSFW: false },
      { name: "submissive", displayName: "Submissive", color: "#3742fa", emoji: "🙇", isNSFW: false },
      { name: "milf", displayName: "MILF", color: "#e84393", emoji: "👩‍❤️‍👨", isNSFW: true },
      { name: "bully", displayName: "Bully", color: "#ff4757", emoji: "😈", isNSFW: false },
      { name: "switch", displayName: "Switch", color: "#fdcb6e", emoji: "🔄", isNSFW: false },
      { name: "femboy", displayName: "Femboy", color: "#fd79a8", emoji: "👦", isNSFW: false },
      { name: "tomboy", displayName: "Tomboy", color: "#00b894", emoji: "👧", isNSFW: false },
      { name: "villain", displayName: "Villain", color: "#2d3436", emoji: "🦹‍♂️", isNSFW: false },
      { name: "hero", displayName: "Hero", color: "#fdcb6e", emoji: "🦸‍♂️", isNSFW: false },
      { name: "tsundere", displayName: "Tsundere", color: "#fd79a8", emoji: "😤", isNSFW: false },
      { name: "yandere", displayName: "Yandere", color: "#e84393", emoji: "🔪", isNSFW: false },
      { name: "kuudere", displayName: "Kuudere", color: "#74b9ff", emoji: "❄️", isNSFW: false },
      { name: "deredere", displayName: "Deredere", color: "#fd79a8", emoji: "😊", isNSFW: false },
      { name: "dandere", displayName: "Dandere", color: "#fab1a0", emoji: "😳", isNSFW: false },
      { name: "sissy", displayName: "Sissy", color: "#fd79a8", emoji: "👗", isNSFW: true },
      { name: "dilf", displayName: "DILF", color: "#0984e3", emoji: "👨‍👧‍👦", isNSFW: true },
      { name: "shy", displayName: "Shy", color: "#fab1a0", emoji: "😊", isNSFW: false },
      { name: "confident", displayName: "Confident", color: "#ff6348", emoji: "💪", isNSFW: false },
      { name: "flirty", displayName: "Flirty", color: "#fd79a8", emoji: "😉", isNSFW: false },
      { name: "mysterious", displayName: "Mysterious", color: "#6c5ce7", emoji: "🎭", isNSFW: false },
      { name: "caring", displayName: "Caring", color: "#00b894", emoji: "🤗", isNSFW: false },
      { name: "rebellious", displayName: "Rebellious", color: "#636e72", emoji: "🔥", isNSFW: false },
      { name: "playful", displayName: "Playful", color: "#2ed573", emoji: "🎮", isNSFW: false }
    ]
  },
  {
    category: "Physical Traits",
    tags: [
      { name: "futa", displayName: "Futa", color: "#e84393", emoji: "🐌", isNSFW: true },
      { name: "petite", displayName: "Petite", color: "#fab1a0", emoji: "📏", isNSFW: false },
      { name: "bbw", displayName: "BBW", color: "#fd79a8", emoji: "🍔", isNSFW: true },
      { name: "monster", displayName: "Monster", color: "#2d3436", emoji: "👹", isNSFW: false },
      { name: "furry", displayName: "Furry", color: "#e17055", emoji: "🪮", isNSFW: false },
      { name: "elf", displayName: "Elf", color: "#00b894", emoji: "🧝‍♀️", isNSFW: false },
      { name: "robot", displayName: "Robot", color: "#636e72", emoji: "🤖", isNSFW: false },
      { name: "giant", displayName: "Giant", color: "#2d3436", emoji: "🧖🏼‍♀️", isNSFW: false },
      { name: "succubus", displayName: "Succubus", color: "#e84393", emoji: "😈", isNSFW: true },
      { name: "alien", displayName: "Alien", color: "#00cec9", emoji: "👽", isNSFW: false },
      { name: "maid", displayName: "Maid", color: "#636e72", emoji: "👩‍🍳", isNSFW: false },
      { name: "realistic", displayName: "Realistic", color: "#636e72", emoji: "📸", isNSFW: false },
      { name: "pregnant", displayName: "Pregnant", color: "#fd79a8", emoji: "🤰", isNSFW: true },
      { name: "shortstack", displayName: "Shortstack", color: "#fab1a0", emoji: "🧸", isNSFW: true },
      { name: "demi-human", displayName: "Demi-Human", color: "#a29bfe", emoji: "🐾", isNSFW: false },
      { name: "goth", displayName: "Goth", color: "#2d3436", emoji: "🖤", isNSFW: false },
      { name: "monster-girl", displayName: "Monster Girl", color: "#6c5ce7", emoji: "👧", isNSFW: false }
    ]
  },
  {
    category: "Appearance",
    tags: [
      { name: "blonde", displayName: "Blonde", color: "#fdcb6e", emoji: "👱‍♀️", isNSFW: false },
      { name: "brunette", displayName: "Brunette", color: "#8b4513", emoji: "👩‍🦱", isNSFW: false },
      { name: "redhead", displayName: "Redhead", color: "#e17055", emoji: "👩‍🦰", isNSFW: false },
      { name: "black-hair", displayName: "Black Hair", color: "#2d3436", emoji: "👩", isNSFW: false },
      { name: "tall", displayName: "Tall", color: "#74b9ff", emoji: "📏", isNSFW: false },
      { name: "curvy", displayName: "Curvy", color: "#fd79a8", emoji: "💃", isNSFW: false },
      { name: "athletic", displayName: "Athletic", color: "#55a3ff", emoji: "💪", isNSFW: false },
      { name: "blue-eyes", displayName: "Blue Eyes", color: "#0984e3", emoji: "👁️", isNSFW: false },
      { name: "green-eyes", displayName: "Green Eyes", color: "#00b894", emoji: "👁️", isNSFW: false }
    ]
  },
  {
    category: "Origin",
    tags: [
      { name: "original-character", displayName: "Original Character", color: "#74b9ff", emoji: "🧑‍🎨", isNSFW: false },
      { name: "game", displayName: "Game", color: "#00b894", emoji: "🎮", isNSFW: false },
      { name: "movie", displayName: "Movie", color: "#e17055", emoji: "🎥", isNSFW: false },
      { name: "vtuber", displayName: "VTuber", color: "#fd79a8", emoji: "👩🏼‍💻", isNSFW: false },
      { name: "books", displayName: "Books", color: "#636e72", emoji: "📚", isNSFW: false },
      { name: "folklore", displayName: "Folklore", color: "#a29bfe", emoji: "🧚‍♀️", isNSFW: false }
    ]
  },
  {
    category: "Sexuality",
    tags: [
      { name: "straight", displayName: "Straight", color: "#0984e3", emoji: "💙", isNSFW: false },
      { name: "bisexual", displayName: "Bisexual", color: "#e84393", emoji: "💖", isNSFW: false },
      { name: "gay", displayName: "Gay", color: "#fd79a8", emoji: "🏳️‍🌈", isNSFW: false },
      { name: "lesbian", displayName: "Lesbian", color: "#e84393", emoji: "👩‍❤️‍👩", isNSFW: false },
      { name: "asexual", displayName: "Asexual", color: "#636e72", emoji: "🖤", isNSFW: false }
    ]
  },
  {
    category: "Fantasy/Kink",
    tags: [
      { name: "breeding", displayName: "Breeding", color: "#e84393", emoji: "🥚", isNSFW: true },
      { name: "femdom", displayName: "Femdom", color: "#e84393", emoji: "👸", isNSFW: true },
      { name: "cheating", displayName: "Cheating", color: "#ff4757", emoji: "💔", isNSFW: true },
      { name: "chastity", displayName: "Chastity", color: "#74b9ff", emoji: "🔒", isNSFW: true },
      { name: "ntr", displayName: "NTR", color: "#ff4757", emoji: "😭", isNSFW: true },
      { name: "cnc", displayName: "CNC", color: "#636e72", emoji: "⚠️", isNSFW: true },
      { name: "hypno", displayName: "Hypno", color: "#6c5ce7", emoji: "😵‍💫", isNSFW: true },
      { name: "voyeur", displayName: "Voyeur", color: "#636e72", emoji: "👀", isNSFW: true },
      { name: "bdsm", displayName: "BDSM", color: "#2d3436", emoji: "🔗", isNSFW: true },
      { name: "bondage", displayName: "Bondage", color: "#2d3436", emoji: "⛓️", isNSFW: true },
      { name: "feet", displayName: "Feet", color: "#fab1a0", emoji: "🦶", isNSFW: true },
      { name: "worship", displayName: "Worship", color: "#fdcb6e", emoji: "🙏", isNSFW: true }
    ]
  },
  {
    category: "Content Rating",
    tags: [
      { name: "sfw", displayName: "SFW", color: "#00b894", emoji: "✅", isNSFW: false },
      { name: "nsfw", displayName: "NSFW", color: "#e84393", emoji: "🔞", isNSFW: true },
      { name: "mature", displayName: "Mature", color: "#fd79a8", emoji: "🔞", isNSFW: true }
    ]
  },
  {
    category: "Relationship",
    tags: [
      { name: "girlfriend", displayName: "Girlfriend", color: "#e84393", emoji: "💕", isNSFW: false },
      { name: "boyfriend", displayName: "Boyfriend", color: "#0984e3", emoji: "💙", isNSFW: false },
      { name: "friend", displayName: "Friend", color: "#fdcb6e", emoji: "👫", isNSFW: false },
      { name: "stranger", displayName: "Stranger", color: "#636e72", emoji: "❓", isNSFW: false },
      { name: "roommate", displayName: "Roommate", color: "#74b9ff", emoji: "🏠", isNSFW: false },
      { name: "colleague", displayName: "Colleague", color: "#a29bfe", emoji: "💼", isNSFW: false }
    ]
  },
  {
    category: "Ethnicity",
    tags: [
      { name: "arab", displayName: "Arab", color: "#e17055", emoji: "🕌", isNSFW: false },
      { name: "asian", displayName: "Asian", color: "#fdcb6e", emoji: "🥢", isNSFW: false },
      { name: "black", displayName: "Black", color: "#2d3436", emoji: "✊🏿", isNSFW: false },
      { name: "white", displayName: "White", color: "#ddd", emoji: "👩🏻", isNSFW: false },
      { name: "latina", displayName: "Latina", color: "#e17055", emoji: "💃🏽", isNSFW: false }
    ]
  },
  {
    category: "Scenario",
    tags: [
      { name: "fantasy", displayName: "Fantasy", color: "#a29bfe", emoji: "🧙‍♀️", isNSFW: false },
      { name: "modern", displayName: "Modern", color: "#00cec9", emoji: "🏙️", isNSFW: false },
      { name: "school", displayName: "School", color: "#fdcb6e", emoji: "🏫", isNSFW: false },
      { name: "office", displayName: "Office", color: "#636e72", emoji: "🏢", isNSFW: false },
      { name: "adventure", displayName: "Adventure", color: "#00b894", emoji: "🗺️", isNSFW: false },
      { name: "slice-of-life", displayName: "Slice of Life", color: "#fab1a0", emoji: "☕", isNSFW: false },
      { name: "post-apocalyptic", displayName: "Post-Apocalyptic", color: "#636e72", emoji: "☢️", isNSFW: false }
    ]
  }
];

const CreateCharacter = () => {
  const [characterData, setCharacterData] = useState({
    name: '',
    scenario: '',
    isNsfw: false,
    isPublic: true,
    isNameLocked: false, // New state for the toggle
  });

  
  const [avatarUrl, setAvatarUrl] = useState('');
  
  // Persona traits state
  const [selectedMainTrait, setSelectedMainTrait] = useState<BroadTerm | null>(null);
  const [selectedSubTraits, setSelectedSubTraits] = useState<Trait[]>([]);
  
  // Tags state
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // Image generation suggestions state
  const [displayedSuggestions, setDisplayedSuggestions] = useState<string[]>([]);
  const [imageDescription, setImageDescription] = useState<string>('');
  
  // Content filtering state
  const [contentWarnings, setContentWarnings] = useState<{[key: string]: string}>({});
  const [hasContentViolations, setHasContentViolations] = useState<{[key: string]: boolean}>({});
  
  // Art style section navigation state
  const [currentSection, setCurrentSection] = useState<string>('main'); // 'main', 'anime', 'cartoon', 'realistic', 'fantasy', 'fully-anime', etc.
  const [selectedSubStyle, setSelectedSubStyle] = useState<string>('');

  // Function to shuffle and pick 4 random suggestions
  const shuffleSuggestions = () => {
    const shuffled = [...imageGenSuggestions].sort(() => 0.5 - Math.random());
    setDisplayedSuggestions(shuffled.slice(0, 4));
  };

  // Initialize suggestions on component mount
  React.useEffect(() => {
    shuffleSuggestions();
  }, []);

  // Content filtering helper
  const checkContentField = (field: string, value: string) => {
    if (!value || !value.trim()) {
      setContentWarnings(prev => ({ ...prev, [field]: '' }));
      setHasContentViolations(prev => ({ ...prev, [field]: false }));
      return;
    }

    const prohibitedWordsCheck = checkProhibitedWords(value);
    setContentWarnings(prev => ({ 
      ...prev, 
      [field]: prohibitedWordsCheck.isAllowed ? '' : prohibitedWordsCheck.message 
    }));
    setHasContentViolations(prev => ({ 
      ...prev, 
      [field]: !prohibitedWordsCheck.isAllowed 
    }));
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setCharacterData(prev => ({
      ...prev,
      [field]: value
    }));

    // Check for prohibited words in text fields
    if (typeof value === 'string' && (field === 'name' || field === 'description' || field === 'scenario' || field === 'persona')) {
      checkContentField(field, value);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setImageDescription(prev => {
      if (prev.length > 0 && !prev.endsWith(', ')) {
        return prev + ', ' + suggestion;
      } else if (prev.length > 0 && prev.endsWith(', ')) {
        return prev + suggestion;
      } else {
        return suggestion;
      }
    });
  };

  // Art style section navigation functions
  const handleMainStyleSelect = (style: string) => {
    setCurrentSection(style);
    setSelectedSubStyle('');
  };

  const handleSubStyleSelect = (subStyle: string) => {
    setSelectedSubStyle(subStyle);
    // Here you can add logic to update the art style for character generation
  };

  const goBackToMain = () => {
    if (currentSection === 'fully-anime') {
      setCurrentSection('anime');
    } else {
      setCurrentSection('main');
    }
    setSelectedSubStyle('');
  };

  const handleMainTraitSelect = (trait: BroadTerm) => {
    if (selectedMainTrait?.id === trait.id) {
      // Deselect if clicking on already selected trait
      setSelectedMainTrait(null);
      setSelectedSubTraits([]);
    } else {
      // Select new main trait and clear sub-traits
      setSelectedMainTrait(trait);
      setSelectedSubTraits([]);
    }
  };

  const handleSubTraitToggle = (trait: Trait) => {
    setSelectedSubTraits(prev => {
      const isSelected = prev.some(t => t.id === trait.id);
      if (isSelected) {
        // Remove trait
        return prev.filter(t => t.id !== trait.id);
      } else if (prev.length < 3) {
        // Add trait if under limit
        return [...prev, trait];
      }
      return prev;
    });
  };

  const handleTagToggle = (tagName: string) => {
    setSelectedTags(prev => {
      const isSelected = prev.includes(tagName);
      if (isSelected) {
        return prev.filter(tag => tag !== tagName);
      } else {
        return [...prev, tagName];
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check for content violations before submitting
    const hasAnyViolations = Object.values(hasContentViolations).some(violation => violation);
    if (hasAnyViolations) {
      console.error('Cannot create character: Content violations detected');
      return;
    }
    
    // Build character persona from selected traits and additional info
    const persona = [
      selectedMainTrait?.name,
      ...selectedSubTraits.map(trait => trait.name),
      characterData.scenario
    ].filter(Boolean).join('. ');
    
    const formData = {
      ...characterData,
      persona,
      avatarUrl,
      personaTraits: {
        mainTrait: selectedMainTrait?.id || null,
        subTraits: selectedSubTraits.map(trait => trait.id)
      }
    };

    console.log('Creating character:', formData);
    // TODO: Implement API call to create character
  };

  const handlePreview = () => {
    console.log('Preview character:', { 
      ...characterData, 
      avatarUrl,
      personaTraits: {
        mainTrait: selectedMainTrait?.name || null,
        subTraits: selectedSubTraits.map(trait => trait.name)
      }
    });
    // TODO: Implement character preview
  };

  return (
    <div className='text-white min-h-screen'>
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="mb-12 text-center">
          <div className="relative inline-block">
            <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-lime-300 via-green-400 to-emerald-500 bg-clip-text text-transparent mb-6">
              Create Character
            </h1>
            <div className="absolute -inset-1 bg-gradient-to-r from-lime-600 to-emerald-600 rounded-lg blur opacity-20 animate-pulse"></div>
          </div>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
            Bring your imagination to life with our advanced AI character creator. 
            Design unique personalities, stories, and visual avatars.
          </p>
          <div className="mt-6 flex items-center justify-center gap-2 text-lime-400">
            <div className="w-2 h-2 bg-lime-400 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium">AI-Powered Generation</span>
            <div className="w-2 h-2 bg-lime-400 rounded-full animate-pulse delay-75"></div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <Card className="bg-[#333333] border-lime-500/30 backdrop-blur-sm shadow-2xl shadow-lime-500/20 hover:shadow-lime-500/30 transition-all duration-300 border">
            <CardHeader className="bg-gradient-to-r from-lime-500/10 to-emerald-500/10 border-b border-lime-500/20">
              <CardTitle className="text-lime-400 text-xl flex items-center gap-2">
                <div className="w-2 h-2 bg-lime-400 rounded-full"></div>
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Character Name */}
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium text-gray-300">Character Name</Label>
                  <Input
                    id="name"
                    value={characterData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Enter character name..."
                    className={`bg-gray-900/50 border-lime-500/30 focus:border-lime-500 focus:ring-lime-500/20 transition-all duration-300 text-white ${
                      hasContentViolations.name ? 'border-red-500/50 focus:border-red-500' : ''
                    }`}
                    required
                  />
                  {contentWarnings.name && (
                    <div className="flex items-center gap-2 text-red-400 text-xs">
                      <AlertTriangle size={12} />
                      <span>{contentWarnings.name}</span>
                    </div>
                  )}
                </div>

                {/* Art Style */}
                <div className="space-y-2">
                  <Label htmlFor="artStyle" className="text-sm font-medium text-gray-300">Art Style</Label>
                  <select
                    id="artStyle"
                    className="w-full bg-gray-900/50 border-lime-500/30 focus:border-lime-500 focus:ring-lime-500/20 transition-all duration-300 text-white rounded-md px-3 py-2 text-sm text-gray-500"
                    defaultValue=""
                  >
                    <option value="" disabled hidden>Select an art style...</option>
                    <option value="anime">Anime</option>
                    <option value="cartoon">Cartoon</option>
                    <option value="realistic">Realistic</option>
                    <option value="fantasy">Fantasy</option>
                    <option value="digital-art">Digital Art</option>
                  </select>
                </div>

                {/* Dimensions */}
                <div className="space-y-2">
                  <Label htmlFor="dimensions" className="text-sm font-medium text-gray-300">Dimensions</Label>
                  <select
                    id="dimensions"
                    className="w-full bg-gray-900/50 border-lime-500/30 focus:border-lime-500 focus:ring-lime-500/20 transition-all duration-300 text-white rounded-md px-3 py-2 text-sm text-gray-500"
                    defaultValue=""
                  >
                    <option value="" disabled hidden>Select dimensions...</option>
                    <option value="square">Square (512x512)</option>
                    <option value="portrait">Portrait (512x768)</option>
                    <option value="landscape">Landscape (768x512)</option>
                    <option value="wide">Wide (1024x512)</option>
                  </select>
                </div>
              </div>

              <Separator className="bg-lime-500/20" />

              {/* Persona Traits Selection */}
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-gray-300">Personality Traits</Label>
                  <p className="text-xs text-gray-500 mt-1">Select a main personality type and up to 3 specific traits</p>
                </div>
                
                {/* Main Traits Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                  {personaTerms.map((trait) => (
                    <button
                      key={trait.id}
                      type="button"
                      onClick={() => handleMainTraitSelect(trait)}
                      className={`p-4 rounded-xl border transition-all duration-300 hover:scale-105 group btn-text-center ${
                        selectedMainTrait?.id === trait.id
                          ? 'bg-lime-500/20 border-lime-400 text-lime-300 shadow-lg shadow-lime-500/30 glow-lime'
                          : 'bg-gray-900/50 border-lime-500/30 text-gray-300 hover:border-lime-500/60 hover:text-lime-300 hover:bg-lime-500/10 hover:shadow-lime-500/20 hover:glow-lime-subtle'
                      } hover:shadow-lg`}
                    >
                      <div className="text-center">
                        <div className="text-sm font-medium">{trait.name}</div>
                        <div className="text-xs opacity-75 mt-1">
                          {trait.traits.length} traits
                        </div>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Sub-traits Selection */}
                {selectedMainTrait && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium text-gray-300">
                        {selectedMainTrait.name} Traits ({selectedSubTraits.length}/3)
                      </Label>
                      {selectedSubTraits.length > 0 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedSubTraits([])}
                          className="text-xs text-gray-400 hover:text-lime-300 hover:bg-lime-500/10"
                        >
                          Clear All
                        </Button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                      {selectedMainTrait.traits.map((trait) => {
                        const isSelected = selectedSubTraits.some(t => t.id === trait.id);
                        const isDisabled = !isSelected && selectedSubTraits.length >= 3;
                        
                        return (
                          <button
                            key={trait.id}
                            type="button"
                            onClick={() => handleSubTraitToggle(trait)}
                            disabled={isDisabled}
                            className={`px-3 py-2 rounded-lg text-sm transition-all duration-200 border btn-text-center ${
                              isSelected
                                ? 'bg-lime-500/20 text-lime-300 border-lime-400 shadow-lime-500/30 glow-lime'
                                : isDisabled
                                ? 'bg-gray-600/50 text-gray-500 border-gray-600 cursor-not-allowed'
                                : 'bg-gray-900/50 text-gray-300 border-lime-500/30 hover:border-lime-500/60 hover:text-lime-300 hover:bg-lime-500/10 hover:shadow-lime-500/20 hover:glow-lime-subtle'
                            } hover:shadow-lg`}
                          >
                            {trait.name}
                            {isSelected && <X className="inline w-3 h-3 ml-1" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <Separator className="bg-lime-500/20" />

              {/* Character Traits (Optional descriptive text) */}
              <div className="space-y-2">
                <Label htmlFor="scenario" className="text-sm font-medium text-gray-300">Character Traits (Optional)</Label>
                <Textarea
                  id="scenario"
                  value={characterData.scenario}
                  onChange={(e) => handleInputChange('scenario', e.target.value)}
                  placeholder="Describe additional character traits, background, or specific details..."
                  className={`bg-gray-900/50 border-lime-500/30 focus:border-lime-500 focus:ring-lime-500/20 min-h-[100px] transition-all duration-300 text-white ${
                    hasContentViolations.scenario ? 'border-red-500/50 focus:border-red-500' : ''
                  }`}
                />
                {contentWarnings.scenario && (
                  <div className="flex items-center gap-2 text-red-400 text-xs mt-2">
                    <AlertTriangle size={12} />
                    <span>{contentWarnings.scenario}</span>
                  </div>
                )}
                <p className="text-xs text-gray-500">Optional: Add more specific details about your character's traits and background.</p>
              </div>
            </CardContent>
          </Card>

          {/* AI Image Generation */}
          <Card className="bg-[#333333] border-lime-500/30 backdrop-blur-sm shadow-2xl shadow-lime-500/20 hover:shadow-lime-500/30 transition-all duration-300 border">
            <CardHeader className="bg-gradient-to-r from-lime-500/10 to-emerald-500/10 border-b border-lime-500/20">
              <CardTitle className="text-lime-400 text-xl flex items-center gap-2">
                <div className="w-2 h-2 bg-lime-400 rounded-full"></div>
                AI Image Generation
                {currentSection !== 'main' && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={goBackToMain}
                    className="ml-auto text-xs text-gray-400 hover:text-lime-300 hover:bg-lime-500/10 border-lime-500/30"
                  >
                    ← Back
                  </Button>
                )}
              </CardTitle>
              <p className="text-gray-400 text-sm mt-2">Select your preferred art style and generate custom character images</p>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              
              {/* Main Art Style Selection */}
              {currentSection === 'main' && (
                <div className="space-y-4">
                  <div className="border-2 border-lime-500/50 rounded-xl p-6 bg-gradient-to-br from-gray-800/50 to-gray-900/50">
                    <h3 className="text-lime-400 text-lg font-semibold mb-4 text-center">Your character type</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {/* Anime Card */}
                      <button
                        type="button"
                        onClick={() => handleMainStyleSelect('anime')}
                        className="group relative overflow-hidden rounded-lg border-2 border-lime-500/30 hover:border-lime-400 transition-all duration-300 hover:scale-105"
                      >
                        <div className="aspect-square bg-gray-600 flex items-center justify-center">
                          <div className="text-4xl">🎌</div>
                        </div>
                        <div className="p-3 bg-gray-800/80 text-center">
                          <span className="text-white font-medium italic text-lg">Anime</span>
                        </div>
                      </button>

                      {/* Cartoon Card */}
                      <button
                        type="button"
                        onClick={() => handleMainStyleSelect('cartoon')}
                        className="group relative overflow-hidden rounded-lg border-2 border-lime-500/30 hover:border-lime-400 transition-all duration-300 hover:scale-105"
                      >
                        <div className="aspect-square bg-gray-600 flex items-center justify-center">
                          <div className="text-4xl">🎨</div>
                        </div>
                        <div className="p-3 bg-gray-800/80 text-center">
                          <span className="text-white font-bold uppercase text-lg">CARTOON</span>
                        </div>
                      </button>

                      {/* Realistic Card */}
                      <button
                        type="button"
                        onClick={() => handleMainStyleSelect('realistic')}
                        className="group relative overflow-hidden rounded-lg border-2 border-lime-500/30 hover:border-lime-400 transition-all duration-300 hover:scale-105"
                      >
                        <div className="aspect-square bg-gray-600 flex items-center justify-center">
                          <div className="text-4xl">📷</div>
                        </div>
                        <div className="p-3 bg-gray-800/80 text-center">
                          <span className="text-white font-medium text-lg">Realistic</span>
                        </div>
                      </button>

                      {/* Fantasy Card */}
                      <button
                        type="button"
                        onClick={() => handleMainStyleSelect('fantasy')}
                        className="group relative overflow-hidden rounded-lg border-2 border-lime-500/30 hover:border-lime-400 transition-all duration-300 hover:scale-105"
                      >
                        <div className="aspect-square bg-gray-600 flex items-center justify-center">
                          <div className="text-4xl">🧙‍♂️</div>
                        </div>
                        <div className="p-3 bg-gray-800/80 text-center">
                          <span className="text-white font-medium italic text-lg">Fantasy</span>
                        </div>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Anime Substyles - First Level */}
              {currentSection === 'anime' && (
                <div className="space-y-4">
                  <div className="border-2 border-lime-500/50 rounded-xl p-6 bg-gradient-to-br from-gray-800/50 to-gray-900/50">
                    <h3 className="text-lime-400 text-lg font-semibold mb-4 text-center">Anime</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <button
                        type="button"
                        onClick={() => setCurrentSection('fully-anime')}
                        className="group relative overflow-hidden rounded-lg border-2 border-lime-500/30 hover:border-lime-400 transition-all duration-300 hover:scale-105"
                      >
                        <div className="aspect-square bg-gray-600 flex items-center justify-center">
                          <div className="text-4xl">🎌</div>
                        </div>
                        <div className="p-3 bg-gray-800/80 text-center">
                          <span className="text-white font-medium text-lg">Fully anime</span>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSubStyleSelect('anime-cartoon')}
                        className={`group relative overflow-hidden rounded-lg border-2 transition-all duration-300 hover:scale-105 ${
                          selectedSubStyle === 'anime-cartoon' 
                            ? 'border-lime-400 bg-lime-500/20' 
                            : 'border-lime-500/30 hover:border-lime-400'
                        }`}
                      >
                        <div className="aspect-square bg-gray-600 flex items-center justify-center">
                          <div className="text-4xl">🎭</div>
                        </div>
                        <div className="p-3 bg-gray-800/80 text-center">
                          <span className="text-white font-medium text-lg">Anime/Cartoon</span>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSubStyleSelect('anime-real')}
                        className={`group relative overflow-hidden rounded-lg border-2 transition-all duration-300 hover:scale-105 ${
                          selectedSubStyle === 'anime-real' 
                            ? 'border-lime-400 bg-lime-500/20' 
                            : 'border-lime-500/30 hover:border-lime-400'
                        }`}
                      >
                        <div className="aspect-square bg-gray-600 flex items-center justify-center">
                          <div className="text-4xl">📸</div>
                        </div>
                        <div className="p-3 bg-gray-800/80 text-center">
                          <span className="text-white font-medium text-lg">Anime/Real</span>
                        </div>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Fully Anime Substyles - Second Level */}
              {currentSection === 'fully-anime' && (
                <div className="space-y-4">
                  <div className="border-2 border-lime-500/50 rounded-xl p-6 bg-gradient-to-br from-gray-800/50 to-gray-900/50">
                    <h3 className="text-lime-400 text-lg font-semibold mb-4 text-center">Fully Anime</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <button
                        type="button"
                        onClick={() => handleSubStyleSelect('hentai')}
                        className={`group relative overflow-hidden rounded-lg border-2 transition-all duration-300 hover:scale-105 ${
                          selectedSubStyle === 'hentai' 
                            ? 'border-lime-400 bg-lime-500/20' 
                            : 'border-lime-500/30 hover:border-lime-400'
                        }`}
                      >
                        <div className="aspect-square bg-gray-600 flex items-center justify-center">
                          <div className="text-4xl">🔞</div>
                        </div>
                        <div className="p-3 bg-gray-800/80 text-center">
                          <span className="text-white font-medium text-lg">Hentai</span>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSubStyleSelect('manga')}
                        className={`group relative overflow-hidden rounded-lg border-2 transition-all duration-300 hover:scale-105 ${
                          selectedSubStyle === 'manga' 
                            ? 'border-lime-400 bg-lime-500/20' 
                            : 'border-lime-500/30 hover:border-lime-400'
                        }`}
                      >
                        <div className="aspect-square bg-gray-600 flex items-center justify-center">
                          <div className="text-4xl">📖</div>
                        </div>
                        <div className="p-3 bg-gray-800/80 text-center">
                          <span className="text-white font-medium text-lg">Manga</span>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSubStyleSelect('popular')}
                        className={`group relative overflow-hidden rounded-lg border-2 transition-all duration-300 hover:scale-105 ${
                          selectedSubStyle === 'popular' 
                            ? 'border-lime-400 bg-lime-500/20' 
                            : 'border-lime-500/30 hover:border-lime-400'
                        }`}
                      >
                        <div className="aspect-square bg-gray-600 flex items-center justify-center">
                          <div className="text-4xl">⭐</div>
                        </div>
                        <div className="p-3 bg-gray-800/80 text-center">
                          <span className="text-white font-medium text-lg">Popular</span>
                        </div>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Cartoon Substyles */}
              {currentSection === 'cartoon' && (
                <div className="space-y-4">
                  <div className="border-2 border-lime-500/50 rounded-xl p-6 bg-gradient-to-br from-gray-800/50 to-gray-900/50">
                    <h3 className="text-lime-400 text-lg font-semibold mb-4 text-center">Cartoon</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <button
                        type="button"
                        onClick={() => handleSubStyleSelect('fully-cartoon')}
                        className={`group relative overflow-hidden rounded-lg border-2 transition-all duration-300 hover:scale-105 ${
                          selectedSubStyle === 'fully-cartoon' 
                            ? 'border-lime-400 bg-lime-500/20' 
                            : 'border-lime-500/30 hover:border-lime-400'
                        }`}
                      >
                        <div className="aspect-square bg-gray-600 flex items-center justify-center">
                          <div className="text-4xl">🎪</div>
                        </div>
                        <div className="p-3 bg-gray-800/80 text-center">
                          <span className="text-white font-medium text-lg">Fully Cartoon</span>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSubStyleSelect('cartoon-real')}
                        className={`group relative overflow-hidden rounded-lg border-2 transition-all duration-300 hover:scale-105 ${
                          selectedSubStyle === 'cartoon-real' 
                            ? 'border-lime-400 bg-lime-500/20' 
                            : 'border-lime-500/30 hover:border-lime-400'
                        }`}
                      >
                        <div className="aspect-square bg-gray-600 flex items-center justify-center">
                          <div className="text-4xl">🎭</div>
                        </div>
                        <div className="p-3 bg-gray-800/80 text-center">
                          <span className="text-white font-medium text-lg">Cartoon/Real</span>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSubStyleSelect('cartoon-anime')}
                        className={`group relative overflow-hidden rounded-lg border-2 transition-all duration-300 hover:scale-105 ${
                          selectedSubStyle === 'cartoon-anime' 
                            ? 'border-lime-400 bg-lime-500/20' 
                            : 'border-lime-500/30 hover:border-lime-400'
                        }`}
                      >
                        <div className="aspect-square bg-gray-600 flex items-center justify-center">
                          <div className="text-4xl">🎌</div>
                        </div>
                        <div className="p-3 bg-gray-800/80 text-center">
                          <span className="text-white font-medium text-lg">Cartoon/Anime</span>
                        </div>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Realistic Substyles */}
              {currentSection === 'realistic' && (
                <div className="space-y-4">
                  <div className="border-2 border-lime-500/50 rounded-xl p-6 bg-gradient-to-br from-gray-800/50 to-gray-900/50">
                    <h3 className="text-lime-400 text-lg font-semibold mb-4 text-center">Realistic</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <button
                        type="button"
                        onClick={() => handleSubStyleSelect('fully-real')}
                        className={`group relative overflow-hidden rounded-lg border-2 transition-all duration-300 hover:scale-105 ${
                          selectedSubStyle === 'fully-real' 
                            ? 'border-lime-400 bg-lime-500/20' 
                            : 'border-lime-500/30 hover:border-lime-400'
                        }`}
                      >
                        <div className="aspect-square bg-gray-600 flex items-center justify-center">
                          <div className="text-4xl">📸</div>
                        </div>
                        <div className="p-3 bg-gray-800/80 text-center">
                          <span className="text-white font-medium text-lg">Fully Real</span>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSubStyleSelect('real-cartoon')}
                        className={`group relative overflow-hidden rounded-lg border-2 transition-all duration-300 hover:scale-105 ${
                          selectedSubStyle === 'real-cartoon' 
                            ? 'border-lime-400 bg-lime-500/20' 
                            : 'border-lime-500/30 hover:border-lime-400'
                        }`}
                      >
                        <div className="aspect-square bg-gray-600 flex items-center justify-center">
                          <div className="text-4xl">🎨</div>
                        </div>
                        <div className="p-3 bg-gray-800/80 text-center">
                          <span className="text-white font-medium text-lg">Real/Cartoon</span>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSubStyleSelect('real-anime')}
                        className={`group relative overflow-hidden rounded-lg border-2 transition-all duration-300 hover:scale-105 ${
                          selectedSubStyle === 'real-anime' 
                            ? 'border-lime-400 bg-lime-500/20' 
                            : 'border-lime-500/30 hover:border-lime-400'
                        }`}
                      >
                        <div className="aspect-square bg-gray-600 flex items-center justify-center">
                          <div className="text-4xl">🎌</div>
                        </div>
                        <div className="p-3 bg-gray-800/80 text-center">
                          <span className="text-white font-medium text-lg">Real/Anime</span>
                        </div>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Fantasy Substyles */}
              {currentSection === 'fantasy' && (
                <div className="space-y-4">
                  <div className="border-2 border-lime-500/50 rounded-xl p-6 bg-gradient-to-br from-gray-800/50 to-gray-900/50">
                    <h3 className="text-lime-400 text-lg font-semibold mb-4 text-center">Fantasy</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <button
                        type="button"
                        onClick={() => handleSubStyleSelect('magical-realism')}
                        className={`group relative overflow-hidden rounded-lg border-2 transition-all duration-300 hover:scale-105 ${
                          selectedSubStyle === 'magical-realism' 
                            ? 'border-lime-400 bg-lime-500/20' 
                            : 'border-lime-500/30 hover:border-lime-400'
                        }`}
                      >
                        <div className="aspect-square bg-gray-600 flex items-center justify-center">
                          <div className="text-4xl">🔮</div>
                        </div>
                        <div className="p-3 bg-gray-800/80 text-center">
                          <span className="text-white font-medium text-lg">Magical Realism</span>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSubStyleSelect('dark-fantasy')}
                        className={`group relative overflow-hidden rounded-lg border-2 transition-all duration-300 hover:scale-105 ${
                          selectedSubStyle === 'dark-fantasy' 
                            ? 'border-lime-400 bg-lime-500/20' 
                            : 'border-lime-500/30 hover:border-lime-400'
                        }`}
                      >
                        <div className="aspect-square bg-gray-600 flex items-center justify-center">
                          <div className="text-4xl">🗡️</div>
                        </div>
                        <div className="p-3 bg-gray-800/80 text-center">
                          <span className="text-white font-medium text-lg">Dark Fantasy</span>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSubStyleSelect('high-fantasy')}
                        className={`group relative overflow-hidden rounded-lg border-2 transition-all duration-300 hover:scale-105 ${
                          selectedSubStyle === 'high-fantasy' 
                            ? 'border-lime-400 bg-lime-500/20' 
                            : 'border-lime-500/30 hover:border-lime-400'
                        }`}
                      >
                        <div className="aspect-square bg-gray-600 flex items-center justify-center">
                          <div className="text-4xl">🏰</div>
                        </div>
                        <div className="p-3 bg-gray-800/80 text-center">
                          <span className="text-white font-medium text-lg">High Fantasy</span>
                        </div>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Show selected style info */}
              {selectedSubStyle && (
                <div className="bg-lime-500/10 border border-lime-500/30 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-lime-300">
                    <div className="w-2 h-2 bg-lime-400 rounded-full"></div>
                    <span className="text-sm font-medium">Selected Style: {selectedSubStyle.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                  </div>
                </div>
              )}

              {/* Quick Suggestions - show only when a substyle is selected */}
              {selectedSubStyle && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium text-gray-300">Quick Suggestions</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={shuffleSuggestions}
                      className="text-xs text-gray-400 hover:text-lime-300 hover:bg-lime-500/10"
                    >
                      Shuffle
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {displayedSuggestions.map((suggestion) => (
                      <button
                        key={suggestion}
                        type="button"
                        onClick={() => handleSuggestionClick(suggestion)}
                        className="px-4 py-3 rounded-lg bg-gray-900/50 border border-lime-500/30 text-gray-300 hover:border-lime-500/60 hover:text-lime-300 hover:bg-lime-500/10 transition-all duration-200 text-sm"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Image Description - show only when a substyle is selected */}
              {selectedSubStyle && (
                <div className="space-y-2">
                  <Label htmlFor="imageDescription" className="text-sm font-medium text-gray-300">Image Description</Label>
                  <Textarea
                    id="imageDescription"
                    value={imageDescription}
                    onChange={(e) => {
                      const newValue = e.target.value;
                      setImageDescription(newValue);
                      checkContentField('imageDescription', newValue);
                    }}
                    placeholder="Describe the character image you want to generate..."
                    className={`bg-gray-900/50 border-lime-500/30 focus:border-lime-500 focus:ring-lime-500/20 min-h-[120px] transition-all duration-300 text-white resize-none ${
                      hasContentViolations.imageDescription ? 'border-red-500/50 focus:border-red-500' : ''
                    }`}
                  />
                  {contentWarnings.imageDescription && (
                    <div className="flex items-center gap-2 text-red-400 text-xs mt-2">
                      <AlertTriangle size={12} />
                      <span>{contentWarnings.imageDescription}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Generate Button - show only when a substyle is selected */}
              {selectedSubStyle && (
                <Button
                  type="button"
                  disabled={hasContentViolations.imageDescription}
                  className={`w-full py-4 text-base font-medium shadow-lg transition-all duration-300 border hover:border-lime-400 btn-lime-glow ${
                    hasContentViolations.imageDescription
                      ? 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white border-red-500/30 opacity-50 cursor-not-allowed'
                      : 'bg-gradient-to-r from-lime-600 to-emerald-600 hover:from-lime-700 hover:to-emerald-700 text-white border-lime-500/30 hover:shadow-lime-500/25'
                  }`}
                >
                  {hasContentViolations.imageDescription ? (
                    <>
                      <AlertTriangle className="mr-2" size={16} />
                      Content Not Allowed
                    </>
                  ) : (
                    <>
                      <span className="mr-2">✨</span>
                      Generate {selectedSubStyle.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())} Image
                    </>
                  )}
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Tags Section */}
          <Card className="bg-[#333333] border-lime-500/30 backdrop-blur-sm shadow-2xl shadow-lime-500/20 hover:shadow-lime-500/30 transition-all duration-300 border">
            <CardHeader className="bg-gradient-to-r from-lime-500/10 to-emerald-500/10 border-b border-lime-500/20">
              <CardTitle className="text-lime-400 text-xl flex items-center gap-2">
                <div className="w-2 h-2 bg-lime-400 rounded-full"></div>
                Tags
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              {tagsData.map((category) => (
                <div key={category.category} className="space-y-3">
                  <div>
                    <Label className="text-sm font-medium text-gray-300">{category.category}</Label>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-11 gap-2">
                    {category.tags.map((tag) => {
                      const isSelected = selectedTags.includes(tag.name);
                      return (
                        <button
                          key={tag.name}
                          type="button"
                          onClick={() => handleTagToggle(tag.name)}
                          className={`px-3 py-2 rounded-lg text-xs transition-all duration-200 border font-medium tag-button ${
                            isSelected
                              ? 'bg-lime-500/20 text-lime-300 border-lime-400 shadow-lg shadow-lime-500/30 glow-lime'
                              : 'bg-gray-900/50 text-gray-300 border-lime-500/30 hover:border-lime-500/60 hover:text-lime-300 hover:bg-lime-500/10 hover:shadow-lime-500/20 hover:glow-lime-subtle'
                          } hover:shadow-lg hover:scale-105`}
                        >
                          {tag.displayName}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="bg-[#333333] border border-lime-500/30 rounded-2xl p-6 backdrop-blur-sm shadow-2xl shadow-lime-500/20">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-3 text-sm text-gray-400">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-lime-400 rounded-full animate-pulse"></div>
                  <span>Auto-save enabled</span>
                </div>
                <span>•</span>
                <span>{characterData.name ? 'Ready to create' : 'Fill required fields'}</span>
              </div>

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="border-lime-500/30 hover:border-lime-500/60 hover:bg-lime-500/10 transition-all duration-300 text-gray-300 hover:text-lime-300 hover:shadow-lg hover:shadow-lime-500/20 btn-lime-glow"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save as Draft
                </Button>
                <Button
                  type="submit"
                  disabled={!characterData.name || Object.values(hasContentViolations).some(violation => violation)}
                  className={`shadow-lg transition-all duration-300 px-8 border btn-lime-glow ${
                    Object.values(hasContentViolations).some(violation => violation)
                      ? 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 border-red-500/30 disabled:cursor-not-allowed opacity-50'
                      : 'bg-gradient-to-r from-lime-600 to-emerald-600 hover:from-lime-700 hover:to-emerald-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed hover:shadow-lime-500/25 border-lime-500/30 hover:border-lime-400'
                  }`}
                >
                  {Object.values(hasContentViolations).some(violation => violation) ? (
                    <>
                      <AlertTriangle className="w-4 h-4 mr-2" />
                      Content Violations Detected
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Create Character
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateCharacter