import React, { useState, useEffect } from 'react';
import { Save, ArrowLeft, ArrowRight, Wand2, Sparkles, ChevronRight, ChevronLeft, Stars, Zap, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import SubscriptionUpgradeModal from '@/components/SubscriptionUpgradeModal';
import { checkProhibitedWords } from '@/lib/prohibitedWordsFilter';

// Import the hierarchical data structures
import { 
  personalityTraits, 
  artStyles, 
  scenarios, 
  tagCategories,
  type PersonalityTrait,
  type ArtStyle,
  type Scenario,
  type TagCategory
} from '@shared/character-creation-data';

interface CharacterCreationState {
  // Basic info
  name: string;
  description: string;
  age: number | string; // Allow string during input validation
  quickSuggestion: string;
  isNsfw: boolean;
  isPublic: boolean;
  
  // Prompt fields
  positivePrompt?: string;
  negativePrompt?: string;
  
  // Enhanced selection data
  personalityTraits: {
    mainTrait?: string;
    subTraits: string[];
  };
  
  artStyle: {
    primaryStyle?: string;
  };
  
  selectedTags: {
    'character-type': string[];
    'genre': string[];
    'personality': string[];
    'appearance': string[];
    'origin': string[];
    'sexuality': string[];
    'fantasy': string[];
    'content-rating': string[];
    'ethnicity': string[];
    'scenario': string[];
  };
}

const CreateCharacterEnhanced: React.FC = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user, isLoading, isAuthenticated } = useAuth();
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Content filtering state
  const [contentWarnings, setContentWarnings] = useState<{[key: string]: string}>({});
  const [hasContentViolations, setHasContentViolations] = useState<{[key: string]: boolean}>({});
  
  const totalSteps = 5;
  const stepNames = [
    'Basic Info',
    'Personality',
    'Art Style',
    'Tags',
    'Create Character'
  ];
  
  const [characterData, setCharacterData] = useState<CharacterCreationState>({
    name: '',
    description: '',
    age: '', // Start with empty string to show validation immediately
    quickSuggestion: '',
    isNsfw: false,
    isPublic: true,
    personalityTraits: {
      subTraits: []
    },
    artStyle: {},
    selectedTags: {
      'character-type': [],
      'genre': [],
      'personality': [],
      'appearance': [],
      'origin': [],
      'sexuality': [],
      'fantasy': [],
      'content-rating': [],
      'ethnicity': [],
      'scenario': []
    }
  });
  
  // Current navigation states for hierarchical selection
  const [personalityNavigation, setPersonalityNavigation] = useState<{
    selectedMainTrait?: PersonalityTrait;
    showSubTraits: boolean;
  }>({
    showSubTraits: false
  });
  
  const [artStyleNavigation, setArtStyleNavigation] = useState<{
    selectedPrimaryStyle?: ArtStyle;
  }>({});

  // Helper functions
  const updateCharacterData = (updates: Partial<CharacterCreationState>) => {
    setCharacterData(prev => ({ ...prev, ...updates }));
  };

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

  // Validate age on component mount to show warning immediately for empty age
  useEffect(() => {
    if (characterData.age === '') {
      setContentWarnings(prev => ({ 
        ...prev, 
        age: 'Age is required and must be 18 or older.'
      }));
      setHasContentViolations(prev => ({ ...prev, age: true }));
    }
  }, []); // Only run on mount

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handlePersonalityTraitSelect = (trait: PersonalityTrait) => {
    if (characterData.personalityTraits.mainTrait === trait.id) {
      // Deselect if already selected
      updateCharacterData({
        personalityTraits: {
          mainTrait: undefined,
          subTraits: []
        }
      });
      setPersonalityNavigation({
        selectedMainTrait: undefined,
        showSubTraits: false
      });
    } else {
      // Select new trait
      updateCharacterData({
        personalityTraits: {
          mainTrait: trait.id,
          subTraits: []
        }
      });
      setPersonalityNavigation({
        selectedMainTrait: trait,
        showSubTraits: true
      });
    }
  };

  const handleSubTraitToggle = (subTraitId: string) => {
    const currentSubTraits = characterData.personalityTraits.subTraits;
    const newSubTraits = currentSubTraits.includes(subTraitId)
      ? currentSubTraits.filter(id => id !== subTraitId)
      : currentSubTraits.length < 3 ? [...currentSubTraits, subTraitId] : currentSubTraits;
    
    if (currentSubTraits.length >= 3 && !currentSubTraits.includes(subTraitId)) {
      toast({
        title: "Maximum Selection Reached",
        description: "You can only select up to 3 sub-traits.",
        variant: "destructive"
      });
      return;
    }
    
    updateCharacterData({
      personalityTraits: {
        ...characterData.personalityTraits,
        subTraits: newSubTraits
      }
    });
  };

  const handleArtStyleSelect = (style: ArtStyle) => {
    updateCharacterData({
      artStyle: {
        primaryStyle: style.id
      }
    });
    setArtStyleNavigation({
      selectedPrimaryStyle: style
    });
  };

  const handleTagToggle = (category: string, tagId: string) => {
    const currentTags = characterData.selectedTags[category as keyof typeof characterData.selectedTags] || [];
    const tagCategory = tagCategories.find(cat => cat.id === category);
    const maxSelections = tagCategory?.maxSelections;
    
    if (currentTags.includes(tagId)) {
      // Remove tag
      const newTags = currentTags.filter(id => id !== tagId);
      updateCharacterData({
        selectedTags: {
          ...characterData.selectedTags,
          [category]: newTags
        }
      });
    } else {
      // Add tag
      if (maxSelections && currentTags.length >= maxSelections) {
        toast({
          title: "Maximum Selection Reached",
          description: `You can only select up to ${maxSelections} ${tagCategory?.displayName?.toLowerCase()} tags.`,
          variant: "destructive"
        });
        return;
      }
      
      const newTags = [...currentTags, tagId];
      updateCharacterData({
        selectedTags: {
          ...characterData.selectedTags,
          [category]: newTags
        }
      });
    }
  };

  const testAuth = async () => {
    console.log('🔍 Testing authentication...');
    
    const token = localStorage.getItem("medusavr_access_token");
    const baseUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
      ? '' // Use relative URL for Vite proxy 
      : '';
    
    try {
      const response = await fetch(`${baseUrl}/api/characters/auth-test`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const result = await response.json();
      console.log('🔍 Auth test result:', result);
      
      toast({
        title: response.ok ? "✅ Authentication Working" : "❌ Authentication Failed",
        description: result.message || "Auth test completed",
        variant: response.ok ? "default" : "destructive"
      });
    } catch (error) {
      console.error('🔍 Auth test error:', error);
      toast({
        title: "❌ Auth Test Failed",
        description: "Could not test authentication",
        variant: "destructive"
      });
    }
  };

  const handleSubmit = async () => {
    console.log('🎯 Create Character button clicked!');
    console.log('📋 Character data to be submitted:', JSON.stringify(characterData, null, 2));
    
    // Check authentication status
    const token = localStorage.getItem("medusavr_access_token");
    const user = localStorage.getItem("medusavr_user");
    console.log('🔐 Authentication check:');
    console.log('  - Token exists:', !!token);
    console.log('  - Token length:', token?.length || 0);
    console.log('  - User data exists:', !!user);
    console.log('  - Current URL:', window.location.href);

    if (!characterData.name || !characterData.description) {
      console.log('❌ Missing required fields');
      toast({
        title: "Missing Information",
        description: "Please provide at least a name and description for your character.",
        variant: "destructive"
      });
      return;
    }

    // Ensure age is a valid number >= 18
    const ageValue = typeof characterData.age === 'string' ? characterData.age.trim() : characterData.age.toString();
    const validAge = parseInt(ageValue);
    
    if (!ageValue || isNaN(validAge) || validAge < 18) {
      console.log('❌ Invalid age detected:', ageValue);
      toast({
        title: "Invalid Age",
        description: !ageValue ? "Please enter an age for your character." : "Character age must be 18 or older.",
        variant: "destructive"
      });
      return;
    }

    // Check for content violations
    const hasAnyViolations = Object.values(hasContentViolations).some(violation => violation);
    if (hasAnyViolations) {
      console.log('❌ Content violations detected');
      toast({
        title: "Content Violations Detected",
        description: "Please fix all content violations before creating your character.",
        variant: "destructive"
      });
      return;
    }

    // Validate character data completeness
    const hasPersonality = characterData.personalityTraits.mainTrait;
    const hasArtStyle = characterData.artStyle.primaryStyle;
    const hasBasicTags = Object.values(characterData.selectedTags).some(tags => tags.length > 0);

    if (!hasPersonality || !hasArtStyle) {
      toast({
        title: "Incomplete Character Setup",
        description: "Please complete all steps including personality traits and art style for optimal AI generation.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    
    // Show comprehensive AI generation progress message
    toast({
      title: "🎨 AI Character Generation Started",
      description: "Creating your character with neural-powered avatar generation, folder structure, and embeddings. This process may take 2-4 minutes for optimal quality...",
    });

    try {
      console.log('🚀 Sending comprehensive character creation request...');
      
      // Get the auth token
      const token = localStorage.getItem("medusavr_access_token");
      console.log('🔐 Auth token present:', !!token);
      
      const headers: any = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      // Use the same base URL logic as the rest of the app
      const baseUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
        ? '' // Use relative URL for Vite proxy 
        : '';
      const fullUrl = `${baseUrl}/api/characters`;

      console.log('📡 Request headers:', headers);
      console.log('🌐 Base URL:', baseUrl);
      console.log('🌐 Full URL:', fullUrl);
      console.log('🎭 Submitting character with comprehensive data:', {
        hasPersonality: !!characterData.personalityTraits.mainTrait,
        hasArtStyle: !!characterData.artStyle.primaryStyle,
        tagCategories: Object.keys(characterData.selectedTags).length,
        totalTags: Object.values(characterData.selectedTags).flat().length
      });

      // Prepare character data with validated age
      const submissionData = {
        ...characterData,
        age: validAge // Ensure age is a valid number
      };

      const response = await fetch(fullUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(submissionData)
      });

      console.log('📥 Response status:', response.status);
      console.log('📥 Response ok:', response.ok);

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Character creation successful!', result);
        
        // Show detailed success message
        const successDetails = [];
        if (result.character?.avatar && !result.character.avatar.includes('placeholder')) {
          successDetails.push("🎨 AI avatar generated");
        }
        if (result.character?.imageGeneration?.characterSeed) {
          successDetails.push(`🌱 Character seed: ${result.character.imageGeneration.characterSeed}`);
        }
        if (result.character?.embeddings) {
          successDetails.push("🧠 Character embeddings created");
        }
        successDetails.push("📁 Cloudinary folders structured");
        
        toast({
          title: "🎉 Character Created Successfully!",
          description: `${result.message || "Your AI character is ready!"}\n\n${successDetails.join('\n')}`,
        });
        
        // Show success for a bit longer before navigating
        setTimeout(() => {
          console.log('🧭 Navigating to user characters page...');
          navigate('/user-characters');
        }, 3000);
      } else {
        console.log('❌ Response not ok, trying to get error data...');
        try {
          const errorData = await response.json();
          console.log('❌ Error data:', errorData);
          throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
        } catch (parseError) {
          console.log('❌ Could not parse error response:', parseError);
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
      }
    } catch (error) {
      console.error('❌ Character creation failed:', error);
      
      let errorMessage = "Failed to create character. Please try again.";
      
      if (error instanceof Error) {
        if (error.message.includes('401')) {
          errorMessage = "Authentication required. Please log in and try again.";
        } else if (error.message.includes('403')) {
          errorMessage = "Permission denied. Please check your account permissions.";
        } else if (error.message.includes('NetworkError') || error.message.includes('fetch')) {
          errorMessage = "Network error. Please check your connection and try again.";
        } else if (error.message.includes('timeout')) {
          errorMessage = "Character generation is taking longer than expected. Please check your dashboard in a few minutes.";
        } else {
          errorMessage = error.message;
        }
      }
      
      toast({
        title: "❌ Character Creation Failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-8">
            <div className="text-center mb-10">
              <div className="relative inline-block">
                <h2 className="text-3xl md:text-4xl font-black text-transparent bg-gradient-to-r from-orange-400 via-yellow-400 to-amber-400 bg-clip-text mb-4">
                  Basic Information
                </h2>
                <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-24 h-1 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-full"></div>
              </div>
              <p className="text-orange-100/70 text-lg mt-4">Foundation of your AI companion</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="relative group">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-orange-500 via-yellow-500 to-amber-500 rounded-2xl blur opacity-20 group-hover:opacity-40 transition-all duration-300"></div>
                  <div className="relative bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl rounded-2xl p-6 border border-orange-500/20">
                    <Label htmlFor="name" className="text-orange-300 font-semibold text-lg flex items-center gap-2">
                      <div className="w-2 h-2 bg-gradient-to-r from-orange-400 to-yellow-400 rounded-full"></div>
                      Character Name *
                    </Label>
                    <Input
                      id="name"
                      value={characterData.name}
                      onChange={(e) => {
                        const value = e.target.value;
                        updateCharacterData({ name: value });
                        checkContentField('name', value);
                      }}
                      placeholder="Enter your character's name..."
                      className={`mt-3 bg-slate-900/50 border-orange-500/30 text-white placeholder-slate-400 h-12 rounded-xl focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20 transition-all duration-300 ${
                        hasContentViolations.name ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/20' : ''
                      }`}
                    />
                    {contentWarnings.name && (
                      <div className="flex items-center gap-2 text-red-400 text-sm mt-2">
                        <AlertTriangle size={14} />
                        <span>{contentWarnings.name}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="relative group">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 rounded-2xl blur opacity-20 group-hover:opacity-40 transition-all duration-300"></div>
                  <div className="relative bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl rounded-2xl p-6 border border-green-500/20">
                    <Label htmlFor="age" className="text-green-300 font-semibold text-lg flex items-center gap-2">
                      <div className="w-2 h-2 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full"></div>
                      Age *
                    </Label>
                    <Input
                      id="age"
                      type="text"
                      value={characterData.age}
                      onChange={(e) => {
                        const inputValue = e.target.value;
                        
                        // Only allow numbers and empty string
                        if (inputValue === '' || /^\d+$/.test(inputValue)) {
                          updateCharacterData({ age: inputValue });
                          
                          // Check for age violations
                          const age = parseInt(inputValue);
                          if (inputValue === '' || (age && age < 18)) {
                            const message = inputValue === '' 
                              ? 'Age is required and must be 18 or older.'
                              : 'Character age must be 18 years or older.';
                            setContentWarnings(prev => ({ 
                              ...prev, 
                              age: message
                            }));
                            setHasContentViolations(prev => ({ ...prev, age: true }));
                          } else {
                            setContentWarnings(prev => ({ ...prev, age: '' }));
                            setHasContentViolations(prev => ({ ...prev, age: false }));
                          }
                        }
                      }}
                      placeholder="Enter character's age (18+)..."
                      className={`mt-3 bg-slate-900/50 border-green-500/30 text-white placeholder-slate-400 h-12 rounded-xl focus:border-green-400 focus:ring-2 focus:ring-green-400/20 transition-all duration-300 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                        hasContentViolations.age ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/20' : ''
                      }`}
                    />
                    {contentWarnings.age && (
                      <div className="flex items-center gap-2 text-red-400 text-sm mt-2">
                        <AlertTriangle size={14} />
                        <span>{contentWarnings.age}</span>
                      </div>
                    )}
                    {!contentWarnings.age && (
                      <p className="text-green-400/70 text-sm mt-2">All characters must be 18 years of age or older</p>
                    )}
                  </div>
                </div>

                <div className="relative group">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-yellow-500 via-amber-500 to-orange-500 rounded-2xl blur opacity-20 group-hover:opacity-40 transition-all duration-300"></div>
                  <div className="relative bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl rounded-2xl p-6 border border-yellow-500/20">
                    <Label htmlFor="quickSuggestion" className="text-yellow-300 font-semibold text-lg flex items-center gap-2">
                      <div className="w-2 h-2 bg-gradient-to-r from-yellow-400 to-amber-400 rounded-full"></div>
                      Quick Suggestion
                    </Label>
                    <Textarea
                      id="quickSuggestion"
                      value={characterData.quickSuggestion}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value.length <= 1000) {
                          updateCharacterData({ quickSuggestion: value });
                          checkContentField('quickSuggestion', value);
                        }
                      }}
                      placeholder="Quick suggestion for character interactions..."
                      className={`mt-3 bg-slate-900/50 border-yellow-500/30 text-white placeholder-slate-400 min-h-[100px] rounded-xl focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 transition-all duration-300 resize-none ${
                        hasContentViolations.quickSuggestion ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/20' : ''
                      }`}
                    />
                    {contentWarnings.quickSuggestion && (
                      <div className="flex items-center gap-2 text-red-400 text-sm mt-2">
                        <AlertTriangle size={14} />
                        <span>{contentWarnings.quickSuggestion}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center mt-2">
                      <p className="text-sm text-slate-400">
                        {characterData.quickSuggestion.length}/1000 characters
                      </p>
                      <div className="flex gap-1">
                        {[...Array(5)].map((_, i) => (
                          <div
                            key={i}
                            className={`w-2 h-2 rounded-full transition-all duration-300 ${
                              (characterData.quickSuggestion.length / 1000) * 5 > i
                                ? 'bg-gradient-to-r from-yellow-400 to-amber-400'
                                : 'bg-slate-700'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="relative group">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500 rounded-2xl blur opacity-20 group-hover:opacity-40 transition-all duration-300"></div>
                  <div className="relative bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl rounded-2xl p-6 border border-amber-500/20">
                    <Label htmlFor="description" className="text-amber-300 font-semibold text-lg flex items-center gap-2">
                      <div className="w-2 h-2 bg-gradient-to-r from-amber-400 to-orange-400 rounded-full"></div>
                      Character Description *
                    </Label>
                    <Textarea
                      id="description"
                      value={characterData.description}
                      onChange={(e) => {
                        const value = e.target.value;
                        updateCharacterData({ description: value });
                        checkContentField('description', value);
                      }}
                      placeholder="Describe your character's personality, background, and story..."
                      className={`mt-3 bg-slate-900/50 border-amber-500/30 text-white placeholder-slate-400 min-h-[120px] rounded-xl focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 transition-all duration-300 resize-none ${
                        hasContentViolations.description ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/20' : ''
                      }`}
                    />
                    {contentWarnings.description && (
                      <div className="flex items-center gap-2 text-red-400 text-sm mt-2">
                        <AlertTriangle size={14} />
                        <span>{contentWarnings.description}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="relative group">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-2xl blur opacity-20 group-hover:opacity-40 transition-all duration-300"></div>
                  <div className="relative bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl rounded-2xl p-6 border border-blue-500/20">
                    <Label htmlFor="positivePrompt" className="text-blue-300 font-semibold text-lg flex items-center gap-2">
                      <div className="w-2 h-2 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full"></div>
                      Positive Prompt
                    </Label>
                    <Textarea
                      id="positivePrompt"
                      value={characterData.positivePrompt || ''}
                      onChange={(e) => {
                        const value = e.target.value;
                        updateCharacterData({ positivePrompt: value });
                        checkContentField('positivePrompt', value);
                      }}
                      placeholder="Additional positive prompts to enhance image generation (optional)..."
                      className={`mt-3 bg-slate-900/50 border-blue-500/30 text-white placeholder-slate-400 min-h-[80px] rounded-xl focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all duration-300 resize-none ${
                        hasContentViolations.positivePrompt ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/20' : ''
                      }`}
                    />
                    {contentWarnings.positivePrompt && (
                      <div className="flex items-center gap-2 text-red-400 text-sm mt-2">
                        <AlertTriangle size={14} />
                        <span>{contentWarnings.positivePrompt}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="relative group">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-pink-500 via-red-500 to-orange-500 rounded-2xl blur opacity-20 group-hover:opacity-40 transition-all duration-300"></div>
                  <div className="relative bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl rounded-2xl p-6 border border-pink-500/20">
                    <Label htmlFor="negativePrompt" className="text-pink-300 font-semibold text-lg flex items-center gap-2">
                      <div className="w-2 h-2 bg-gradient-to-r from-pink-400 to-red-400 rounded-full"></div>
                      Negative Prompt
                    </Label>
                    <Textarea
                      id="negativePrompt"
                      value={characterData.negativePrompt || ''}
                      onChange={(e) => {
                        const value = e.target.value;
                        updateCharacterData({ negativePrompt: value });
                        checkContentField('negativePrompt', value);
                      }}
                      placeholder="Things to avoid in image generation (optional)..."
                      className={`mt-3 bg-slate-900/50 border-pink-500/30 text-white placeholder-slate-400 min-h-[80px] rounded-xl focus:border-pink-400 focus:ring-2 focus:ring-pink-400/20 transition-all duration-300 resize-none ${
                        hasContentViolations.negativePrompt ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/20' : ''
                      }`}
                    />
                    {contentWarnings.negativePrompt && (
                      <div className="flex items-center gap-2 text-red-400 text-sm mt-2">
                        <AlertTriangle size={14} />
                        <span>{contentWarnings.negativePrompt}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="relative group">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-orange-500 via-yellow-500 to-amber-500 rounded-2xl blur opacity-20 group-hover:opacity-40 transition-all duration-300"></div>
                  <div className="relative bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl rounded-2xl p-6 border border-orange-500/20">
                    <Label className="text-orange-300 font-semibold text-lg flex items-center gap-2 mb-4">
                      <div className="w-2 h-2 bg-gradient-to-r from-orange-400 to-yellow-400 rounded-full"></div>
                      Settings
                    </Label>
                    <div className="space-y-4">
                      <label className="flex items-center space-x-3 cursor-pointer group">
                        <div className="relative">
                          <input
                            type="checkbox"
                            checked={characterData.isNsfw}
                            onChange={(e) => updateCharacterData({ isNsfw: e.target.checked })}
                            className="sr-only"
                          />
                          <div className={`w-6 h-6 rounded-lg border-2 transition-all duration-300 ${
                            characterData.isNsfw
                              ? 'bg-gradient-to-r from-amber-500 to-orange-500 border-amber-500'
                              : 'border-slate-500 bg-slate-800'
                          }`}>
                            {characterData.isNsfw && (
                              <div className="w-full h-full rounded-md bg-gradient-to-r from-amber-400 to-orange-400 flex items-center justify-center">
                                <div className="w-2 h-2 bg-white rounded-full"></div>
                              </div>
                            )}
                          </div>
                        </div>
                        <span className="text-amber-300 group-hover:text-amber-200 transition-colors">NSFW Content</span>
                      </label>
                      
                      <label className="flex items-center space-x-3 cursor-pointer group">
                        <div className="relative">
                          <input
                            type="checkbox"
                            checked={characterData.isPublic}
                            onChange={(e) => updateCharacterData({ isPublic: e.target.checked })}
                            className="sr-only"
                          />
                          <div className={`w-6 h-6 rounded-lg border-2 transition-all duration-300 ${
                            characterData.isPublic
                              ? 'bg-gradient-to-r from-orange-500 to-yellow-500 border-orange-500'
                              : 'border-slate-500 bg-slate-800'
                          }`}>
                            {characterData.isPublic && (
                              <div className="w-full h-full rounded-md bg-gradient-to-r from-orange-400 to-yellow-400 flex items-center justify-center">
                                <div className="w-2 h-2 bg-white rounded-full"></div>
                              </div>
                            )}
                          </div>
                        </div>
                        <span className="text-orange-300 group-hover:text-orange-200 transition-colors">Public Character</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-8">
            <div className="text-center mb-10">
              <div className="relative inline-block">
                <h2 className="text-3xl md:text-4xl font-black text-transparent bg-gradient-to-r from-orange-400 via-yellow-400 to-amber-400 bg-clip-text mb-4">
                  Personality Matrix
                </h2>
                <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-24 h-1 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-full"></div>
              </div>
              <p className="text-orange-100/70 text-lg mt-4">
                Neural personality architecture - Select 1 core trait and up to 3 sub-traits
              </p>
            </div>
            
            {!personalityNavigation.showSubTraits ? (
              <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
                {personalityTraits.map((trait) => (
                  <div
                    key={trait.id}
                    className={`relative group cursor-pointer transition-all duration-500 transform hover:scale-105 ${
                      characterData.personalityTraits.mainTrait === trait.id ? 'scale-110' : ''
                    }`}
                    onClick={() => handlePersonalityTraitSelect(trait)}
                  >
                    <div className={`absolute -inset-0.5 bg-gradient-to-r rounded-2xl blur transition-all duration-500 ${
                      characterData.personalityTraits.mainTrait === trait.id
                        ? 'opacity-60'
                        : 'opacity-20 group-hover:opacity-40'
                    }`} style={{ backgroundImage: `linear-gradient(to right, ${trait.color}, ${trait.color}80)` }}></div>
                    
                    <div className={`relative bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-xl rounded-2xl p-6 border transition-all duration-500 ${
                      characterData.personalityTraits.mainTrait === trait.id
                        ? 'border-2 shadow-2xl'
                        : 'border border-slate-700 hover:border-slate-600'
                    }`} style={{ borderColor: characterData.personalityTraits.mainTrait === trait.id ? trait.color : undefined }}>
                      
                      {characterData.personalityTraits.mainTrait === trait.id && (
                        <div className="absolute top-2 right-2">
                          <div className="w-3 h-3 bg-gradient-to-r from-orange-400 to-yellow-400 rounded-full animate-pulse"></div>
                        </div>
                      )}
                      
                      <div className="text-center">
                        <div className="text-4xl mb-3 filter drop-shadow-lg">{trait.icon}</div>
                        <h4 className="font-bold text-lg mb-2" style={{ color: trait.color }}>{trait.displayName}</h4>
                        <p className="text-sm text-slate-300 leading-relaxed">{trait.description}</p>
                        
                        {characterData.personalityTraits.mainTrait === trait.id && (
                          <div className="mt-4 flex justify-center">
                            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-lime-500/20 to-green-500/20 border border-lime-500/30">
                              <div className="w-2 h-2 bg-gradient-to-r from-lime-400 to-green-400 rounded-full"></div>
                              <span className="text-xs text-lime-300 font-medium">SELECTED</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      onClick={() => setPersonalityNavigation({ showSubTraits: false })}
                      className="border-lime-500/30 bg-gradient-to-r from-lime-500/10 to-green-500/10 hover:from-lime-500/20 hover:to-green-500/20 text-lime-300 hover:text-lime-200 transition-all duration-300"
                    >
                      <ChevronLeft className="w-4 h-4 mr-1" />
                      Back to Core Traits
                    </Button>
                    
                    <div className="flex items-center gap-2">
                      <Badge className="bg-gradient-to-r from-lime-500/20 to-green-500/20 border border-lime-500/30 text-lime-300">
                        <span className="text-2xl mr-2">{personalityNavigation.selectedMainTrait?.icon}</span>
                        {personalityNavigation.selectedMainTrait?.displayName}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge className="bg-gradient-to-r from-lime-500/20 to-green-500/20 border border-lime-500/30 text-lime-300">
                      {characterData.personalityTraits.subTraits.length}/3 Selected
                    </Badge>
                  </div>
                </div>
                
                                 <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
                  {personalityNavigation.selectedMainTrait?.subTraits.map((subTrait) => (
                    <div
                      key={subTrait.id}
                      className={`relative group cursor-pointer transition-all duration-500 transform hover:scale-105 ${
                        characterData.personalityTraits.subTraits.includes(subTrait.id) ? 'scale-105' : ''
                      }`}
                      onClick={() => handleSubTraitToggle(subTrait.id)}
                    >
                      <div className={`absolute -inset-0.5 bg-gradient-to-r from-lime-500 via-green-500 to-emerald-500 rounded-2xl blur transition-all duration-500 ${
                        characterData.personalityTraits.subTraits.includes(subTrait.id)
                          ? 'opacity-50'
                          : 'opacity-20 group-hover:opacity-40'
                      }`}></div>
                      
                      <div className={`relative bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-xl rounded-2xl p-5 border transition-all duration-500 ${
                        characterData.personalityTraits.subTraits.includes(subTrait.id)
                          ? 'border-2 border-lime-400 shadow-2xl shadow-lime-500/20'
                          : 'border border-slate-700 hover:border-slate-600'
                      }`}>
                        
                        {characterData.personalityTraits.subTraits.includes(subTrait.id) && (
                          <div className="absolute top-2 right-2">
                            <div className="w-3 h-3 bg-gradient-to-r from-lime-400 to-green-400 rounded-full animate-pulse"></div>
                          </div>
                        )}
                        
                        <div className="text-center">
                          <h4 className={`font-bold text-lg mb-2 transition-colors duration-300 ${
                            characterData.personalityTraits.subTraits.includes(subTrait.id)
                              ? 'text-transparent bg-gradient-to-r from-lime-400 to-green-400 bg-clip-text'
                              : 'text-lime-300'
                          }`}>
                            {subTrait.displayName}
                          </h4>
                          <p className="text-sm text-slate-300 leading-relaxed">{subTrait.description}</p>
                          
                          {characterData.personalityTraits.subTraits.includes(subTrait.id) && (
                            <div className="mt-3 flex justify-center">
                              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-lime-500/20 to-green-500/20 border border-lime-500/30">
                                <div className="w-2 h-2 bg-gradient-to-r from-lime-400 to-green-400 rounded-full"></div>
                                <span className="text-xs text-lime-300 font-medium">ACTIVE</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h3 className="text-xl font-semibold text-lime-400 mb-2">Choose Art Style</h3>
              <p className="text-gray-300">Select your character's visual style hierarchy</p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {artStyles.map((style) => (
                  <Card
                    key={style.id}
                    className={`cursor-pointer transition-all duration-300 hover:scale-105 ${
                      characterData.artStyle.primaryStyle === style.id
                        ? 'border-lime-500 bg-lime-500/10'
                        : 'border-gray-700 hover:border-lime-500/50'
                    }`}
                    onClick={() => handleArtStyleSelect(style)}
                  >
                    <CardContent className="p-4 text-center">
                      <div className="text-3xl mb-2">{style.preview}</div>
                      <h4 className="font-semibold text-lime-400">{style.displayName}</h4>
                      <p className="text-sm text-gray-300 mt-1">{style.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h3 className="text-xl font-semibold text-lime-400 mb-2">Add Tags</h3>
              <p className="text-gray-300">Choose tags that describe your character</p>
            </div>
            
            <div className="space-y-6">
              {tagCategories
                .filter((category: TagCategory) => category.id !== 'content-rating')
                .map((category: TagCategory) => (
                <div key={category.id} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-lime-400">{category.displayName}</h4>
                    <Badge variant="secondary" className="bg-gray-700">
                      {characterData.selectedTags[category.id as keyof typeof characterData.selectedTags]?.length || 0}
                      {category.maxSelections && ` / ${category.maxSelections}`}
                      {!category.maxSelections && ' (unlimited)'}
                    </Badge>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    {category.tags.map((tag) => (
                      <Badge
                        key={tag.id}
                        variant={characterData.selectedTags[category.id as keyof typeof characterData.selectedTags]?.includes(tag.id) ? "default" : "outline"}
                        className={`cursor-pointer transition-all duration-300 hover:scale-105 ${
                          characterData.selectedTags[category.id as keyof typeof characterData.selectedTags]?.includes(tag.id)
                            ? 'bg-lime-500/20 border-lime-500 text-lime-400'
                            : 'border-gray-600 hover:border-lime-500/50'
                        }`}
                        onClick={() => handleTagToggle(category.id, tag.id)}
                      >
                        {tag.emoji} {tag.displayName}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-8">
            <div className="text-center mb-10">
              <div className="relative inline-block">
                <h2 className="text-3xl md:text-4xl font-black text-transparent bg-gradient-to-r from-orange-400 via-yellow-400 to-amber-400 bg-clip-text mb-4">
                  Neural Generation Preview
                </h2>
                <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-24 h-1 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-full"></div>
              </div>
              <p className="text-orange-100/70 text-lg mt-4">
                AI-powered character synthesis with full ecosystem creation
              </p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Character Summary */}
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-orange-500 via-yellow-500 to-amber-500 rounded-2xl blur opacity-20 group-hover:opacity-40 transition-all duration-300"></div>
                <div className="relative bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl rounded-2xl p-6 border border-orange-500/20">
                  <h3 className="text-xl font-bold text-orange-300 mb-4 flex items-center gap-2">
                    <div className="w-3 h-3 bg-gradient-to-r from-orange-400 to-yellow-400 rounded-full"></div>
                    Character Profile
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-orange-300/70">Name</label>
                      <p className="text-white font-semibold">{characterData.name}</p>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-orange-300/70">Description</label>
                      <p className="text-slate-300 text-sm leading-relaxed">{characterData.description}</p>
                    </div>
                    
                    {characterData.quickSuggestion && (
                      <div>
                        <label className="text-sm font-medium text-orange-300/70">Quick Suggestion</label>
                        <p className="text-slate-300 text-sm leading-relaxed">{characterData.quickSuggestion}</p>
                      </div>
                    )}
                    
                    <div className="flex flex-wrap gap-2">
                      {characterData.isNsfw && (
                        <Badge className="bg-red-500/20 border border-red-500/30 text-red-300">
                          NSFW Content
                        </Badge>
                      )}
                      {characterData.isPublic && (
                        <Badge className="bg-green-500/20 border border-green-500/30 text-green-300">
                          Public Character
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* AI Generation Pipeline */}
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-yellow-500 via-amber-500 to-orange-500 rounded-2xl blur opacity-20 group-hover:opacity-40 transition-all duration-300"></div>
                <div className="relative bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl rounded-2xl p-6 border border-yellow-500/20">
                  <h3 className="text-xl font-bold text-yellow-300 mb-4 flex items-center gap-2">
                    <div className="w-3 h-3 bg-gradient-to-r from-yellow-400 to-amber-400 rounded-full"></div>
                    AI Generation Pipeline
                  </h3>
                  
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-gradient-to-r from-lime-400 to-green-400 rounded-full"></div>
                      <span className="text-sm text-slate-300">ComfyUI Neural Avatar Generation</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full"></div>
                      <span className="text-sm text-slate-300">Cloudinary Folder Ecosystem</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full"></div>
                      <span className="text-sm text-slate-300">Character Embeddings & Search</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-gradient-to-r from-orange-400 to-red-400 rounded-full"></div>
                      <span className="text-sm text-slate-300">Consistent Seed Generation</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-gradient-to-r from-indigo-400 to-blue-400 rounded-full"></div>
                      <span className="text-sm text-slate-300">Database Integration</span>
                    </div>
                  </div>
                  
                  <div className="mt-4 p-3 bg-gradient-to-r from-yellow-500/10 to-amber-500/10 border border-yellow-500/20 rounded-xl">
                    <p className="text-xs text-yellow-300/80">
                      <strong>Estimated Generation Time:</strong> 2-4 minutes<br/>
                      <strong>Output Quality:</strong> High-resolution AI avatar<br/>
                      <strong>Future Compatibility:</strong> Consistent regeneration ready
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Character Traits & Style */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-lime-500 via-green-500 to-emerald-500 rounded-2xl blur opacity-20 group-hover:opacity-40 transition-all duration-300"></div>
                <div className="relative bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl rounded-2xl p-6 border border-lime-500/20">
                  <h4 className="font-bold text-lime-300 mb-3 flex items-center gap-2">
                    <div className="w-2 h-2 bg-gradient-to-r from-lime-400 to-green-400 rounded-full"></div>
                    Personality Matrix
                  </h4>
                  
                  {characterData.personalityTraits.mainTrait ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-gradient-to-r from-lime-500/20 to-green-500/20 border border-lime-500/30 text-lime-300">
                          Core: {characterData.personalityTraits.mainTrait}
                        </Badge>
                      </div>
                      
                      {characterData.personalityTraits.subTraits.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {characterData.personalityTraits.subTraits.map(trait => (
                            <Badge key={trait} variant="secondary" className="bg-lime-500/10 border border-lime-500/20 text-lime-400 text-xs">
                              {trait}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-slate-400 text-sm">Default personality traits will be applied</p>
                  )}
                </div>
              </div>

              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 via-pink-500 to-rose-500 rounded-2xl blur opacity-20 group-hover:opacity-40 transition-all duration-300"></div>
                <div className="relative bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl rounded-2xl p-6 border border-purple-500/20">
                  <h4 className="font-bold text-purple-300 mb-3 flex items-center gap-2">
                    <div className="w-2 h-2 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full"></div>
                    Art Style Neural Network
                  </h4>
                  
                  {characterData.artStyle.primaryStyle ? (
                    <Badge className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 text-purple-300">
                      {characterData.artStyle.primaryStyle}
                    </Badge>
                  ) : (
                    <p className="text-slate-400 text-sm">Default art style will be applied</p>
                  )}
                </div>
              </div>
            </div>

            {/* Selected Tags */}
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 via-cyan-500 to-teal-500 rounded-2xl blur opacity-20 group-hover:opacity-40 transition-all duration-300"></div>
              <div className="relative bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl rounded-2xl p-6 border border-blue-500/20">
                <h4 className="font-bold text-blue-300 mb-4 flex items-center gap-2">
                  <div className="w-2 h-2 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full"></div>
                  Tag Classification System
                </h4>
                
                <div className="space-y-3">
                  {Object.entries(characterData.selectedTags).filter(([category, tags]) => tags.length > 0).map(([category, tags]) => (
                    <div key={category}>
                      <label className="text-xs font-medium text-blue-300/70 uppercase tracking-wide">
                        {category.replace('-', ' ')}
                      </label>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {tags.map(tag => (
                          <Badge key={tag} variant="secondary" className="bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                  
                  {Object.values(characterData.selectedTags).every(tags => tags.length === 0) && (
                    <p className="text-slate-400 text-sm">No additional tags selected</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  useEffect(() => {
    if (isAuthenticated && user && !isLoading) {
      // Check if user has permission to create characters
      const canCreateCharacters = user.tier && user.tier !== 'free';
      if (!canCreateCharacters) {
        setShowSubscriptionModal(true);
      }
    }
  }, [isAuthenticated, user, isLoading]);

  return (
    <div className="min-h-screen text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="relative inline-block mb-6">
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black bg-gradient-to-r from-orange-300 via-yellow-300 to-amber-300 bg-clip-text text-transparent mb-4 tracking-tight">
              Character Creator
            </h1>
            <div className="absolute -inset-1 bg-gradient-to-r from-orange-500/20 via-yellow-500/20 to-amber-500/20 blur-xl rounded-lg"></div>
          </div>
          
          <p className="text-orange-100/80 text-xl md:text-2xl font-light">
            Design your perfect AI companion with <span className="text-transparent bg-gradient-to-r from-orange-400 to-yellow-400 bg-clip-text font-semibold">neural precision</span>
          </p>
          
          <div className="flex items-center justify-center gap-4 mt-6">
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-orange-500/20 to-yellow-500/20 border border-orange-500/30">
              <Stars className="w-4 h-4 text-orange-400" />
              <span className="text-sm text-orange-300 font-medium">AI-Powered</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border border-yellow-500/30">
              <Zap className="w-4 h-4 text-yellow-400" />
              <span className="text-sm text-yellow-300 font-medium">Neural Engine</span>
            </div>
          </div>
        </div>

        {/* User Responsibility Disclaimer */}
        <div className="mb-8">
          <div className="max-w-4xl mx-auto">
            <div className="bg-red-900/20 border border-red-700 p-4 rounded-lg">
              <h3 className="text-red-400 font-semibold mb-2 flex items-center gap-2">
                ⚠️ User Responsibility Notice
              </h3>
              <p className="text-gray-300 text-sm">
                <strong>You are 100% responsible</strong> for all characters you create and any content they generate. 
                Ensure your character complies with all applicable laws. MedusaVR bear NO responsibility 
                for user-created characters or any consequences of their use.
              </p>
            </div>
          </div>
        </div>

        {/* Progress Section */}
        <div className="mb-12">
          <div className="bg-gradient-to-r from-slate-900/50 via-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-orange-500/20 rounded-2xl p-6 shadow-2xl shadow-orange-500/10">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div>
                <h3 className="text-xl font-semibold text-transparent bg-gradient-to-r from-orange-400 to-yellow-400 bg-clip-text">
                  Step {currentStep} of {totalSteps}
                </h3>
                <p className="text-orange-100/80 font-medium">{stepNames[currentStep - 1]}</p>
              </div>
              <div className="text-right">
                <span className="text-2xl font-bold text-transparent bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text">
                  {Math.round((currentStep / totalSteps) * 100)}%
                </span>
                <p className="text-sm text-orange-300/70">Complete</p>
              </div>
            </div>
            
            {/* Custom Progress Bar */}
            <div className="relative">
              <div className="h-3 bg-slate-800/50 rounded-full overflow-hidden border border-orange-500/20">
                <div 
                  className="h-full bg-gradient-to-r from-orange-500 via-yellow-500 to-amber-500 rounded-full transition-all duration-1000 ease-out relative"
                  style={{ width: `${(currentStep / totalSteps) * 100}%` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-orange-400/50 to-yellow-400/50 animate-pulse"></div>
                </div>
              </div>
              <div className="absolute -top-1 -bottom-1 rounded-full bg-gradient-to-r from-orange-500/30 to-yellow-500/30 blur-sm transition-all duration-1000" 
                   style={{ width: `${(currentStep / totalSteps) * 100}%` }}></div>
            </div>

            {/* Step Indicators */}
            <div className="flex justify-between mt-6">
              {stepNames.map((step, index) => (
                <div key={index} className="flex flex-col items-center">
                  <div className={`w-3 h-3 rounded-full transition-all duration-500 ${
                    index + 1 <= currentStep 
                      ? 'bg-gradient-to-r from-orange-400 to-yellow-400 shadow-lg shadow-orange-400/50' 
                      : 'bg-slate-700 border border-slate-600'
                  }`}>
                    {index + 1 <= currentStep && (
                      <div className="w-full h-full rounded-full bg-gradient-to-r from-orange-300 to-yellow-300 animate-pulse"></div>
                    )}
                  </div>
                  <span className={`text-xs mt-2 transition-colors duration-300 ${
                    index + 1 <= currentStep ? 'text-orange-300' : 'text-slate-500'
                  }`}>
                    {step}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <Card className="bg-gradient-to-br from-slate-900/70 via-slate-800/50 to-slate-900/70 backdrop-blur-xl border-0 shadow-2xl shadow-orange-500/10 rounded-3xl overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 via-transparent to-yellow-500/10 rounded-3xl"></div>
          <div className="absolute inset-[1px] bg-gradient-to-br from-slate-900/90 via-slate-800/70 to-slate-900/90 rounded-3xl"></div>
          
          <CardContent className="relative z-10 p-4 sm:p-6 md:p-8 lg:p-12">
            {renderStepContent()}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="mt-12">
          <div className="bg-gradient-to-r from-slate-900/50 via-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-orange-500/20 rounded-2xl p-6 shadow-2xl shadow-orange-500/10">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-6">
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-2xl blur opacity-20 group-hover:opacity-40 transition-all duration-300"></div>
                <Button
                  variant="outline"
                  onClick={handlePrevious}
                  disabled={currentStep === 1}
                  className="relative bg-gradient-to-r from-slate-800/80 to-slate-900/80 backdrop-blur-xl border-yellow-500/30 hover:border-yellow-400 text-yellow-300 hover:text-yellow-200 transition-all duration-300 px-6 py-3 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ArrowLeft className="w-5 h-5 mr-2" />
                  Previous Step
                </Button>
              </div>

              <div className="flex space-x-3">
                {Array.from({ length: totalSteps }, (_, i) => (
                  <div
                    key={i}
                    className={`relative transition-all duration-500 ${
                      i + 1 <= currentStep ? 'scale-110' : 'scale-100'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full transition-all duration-500 ${
                      i + 1 <= currentStep 
                        ? 'bg-gradient-to-r from-orange-400 to-yellow-400 shadow-lg shadow-orange-400/50' 
                        : 'bg-slate-700 border border-slate-600'
                    }`}>
                      {i + 1 <= currentStep && (
                        <div className="w-full h-full rounded-full bg-gradient-to-r from-orange-300 to-yellow-300 animate-pulse"></div>
                      )}
                    </div>
                    {i + 1 <= currentStep && (
                      <div className="absolute -inset-1 bg-gradient-to-r from-orange-400/30 to-yellow-400/30 rounded-full blur-sm"></div>
                    )}
                  </div>
                ))}
              </div>

              {currentStep < totalSteps ? (
                <div className="relative group">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-2xl blur opacity-20 group-hover:opacity-40 transition-all duration-300"></div>
                  <Button
                    onClick={handleNext}
                    className="relative bg-gradient-to-r from-orange-600 to-yellow-600 hover:from-orange-500 hover:to-yellow-500 text-white transition-all duration-300 px-6 py-3 rounded-xl shadow-lg shadow-orange-500/20 hover:shadow-orange-500/30"
                  >
                    Next Step
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </div>
              ) : (
                <div className="flex gap-4">
                  <div className="relative group">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-2xl blur opacity-20 group-hover:opacity-40 transition-all duration-300"></div>
                    <Button
                      onClick={testAuth}
                      variant="outline"
                      className="relative bg-gradient-to-r from-slate-800/80 to-slate-900/80 backdrop-blur-xl border-yellow-500/30 hover:border-yellow-400 text-yellow-300 hover:text-yellow-200 transition-all duration-300 px-6 py-3 rounded-xl"
                    >
                      <Sparkles className="w-5 h-5 mr-2" />
                      Test Auth
                    </Button>
                  </div>
                  
                  <div className="relative group">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500 rounded-2xl blur opacity-30 group-hover:opacity-50 transition-all duration-300"></div>
                    <Button
                      onClick={handleSubmit}
                      disabled={isSubmitting || Object.values(hasContentViolations).some(violation => violation)}
                      className={`relative transition-all duration-300 px-8 py-3 rounded-xl shadow-xl disabled:opacity-50 disabled:cursor-not-allowed ${
                        Object.values(hasContentViolations).some(violation => violation)
                          ? 'bg-gradient-to-r from-red-600 via-red-700 to-red-800 hover:from-red-500 hover:via-red-600 hover:to-red-700 text-white shadow-red-500/20 hover:shadow-red-500/30'
                          : 'bg-gradient-to-r from-amber-600 via-orange-600 to-yellow-600 hover:from-amber-500 hover:via-orange-500 hover:to-yellow-500 text-white shadow-amber-500/20 hover:shadow-amber-500/30'
                      }`}
                    >
                      {isSubmitting ? (
                        <>
                          <Sparkles className="w-5 h-5 mr-2 animate-spin" />
                          Generating AI Avatar...
                        </>
                      ) : Object.values(hasContentViolations).some(violation => violation) ? (
                        <>
                          <AlertTriangle className="w-5 h-5 mr-2" />
                          Content Violations Detected
                        </>
                      ) : (
                        <>
                          <Wand2 className="w-5 h-5 mr-2" />
                          Create with AI Avatar
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

             <SubscriptionUpgradeModal
         isOpen={showSubscriptionModal}
         setIsOpen={setShowSubscriptionModal}
         requiredTier="artist"
         feature="create characters"
       />
    </div>
  );
};

export default CreateCharacterEnhanced; 