import { Dialog, Transition, TransitionChild, DialogPanel, DialogTitle } from "@headlessui/react";
import { Fragment, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { X, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTags } from "@/hooks/useTags";

interface TagPreferenceModalProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  onSave: (selectedTags: string[]) => void;
  initialSelectedTags?: string[];
  isFirstTimeSetup?: boolean; // New prop to determine if this is initial onboarding
}

export default function TagPreferenceModal({ isOpen, setIsOpen, onSave, initialSelectedTags = [], isFirstTimeSetup = false }: TagPreferenceModalProps) {
  const { tagCategories, isLoading, error } = useTags();
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isAgeConfirmed, setIsAgeConfirmed] = useState(false);
  const [termsAgreed, setTermsAgreed] = useState(false);
  const [modalOpened, setModalOpened] = useState(false);

  // Reset selected tags when modal opens with new initial values
  useEffect(() => {
    if (isOpen && !modalOpened) {
      setSelectedTags([...initialSelectedTags]);
      setModalOpened(true);
    } else if (!isOpen) {
      setModalOpened(false);
    }
  }, [isOpen, modalOpened]);



  if (isLoading) {
    return (
      <Transition appear show={isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => {}}>
          <TransitionChild 
            as={Fragment} 
            enter="ease-out duration-500" 
            enterFrom="opacity-0" 
            enterTo="opacity-100" 
            leave="ease-in duration-300" 
            leaveFrom="opacity-100" 
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" />
          </TransitionChild>
          <div className="fixed inset-0 overflow-y-auto flex items-center justify-center p-8">
            <TransitionChild
              as={Fragment}
              enter="ease-out duration-500"
              enterFrom="opacity-0 scale-90 translate-y-8"
              enterTo="opacity-100 scale-100 translate-y-0"
              leave="ease-in duration-300"
              leaveFrom="opacity-100 scale-100 translate-y-0"
              leaveTo="opacity-0 scale-90 translate-y-8"
            >
              <DialogPanel className="w-full max-w-xl transform overflow-hidden rounded-2xl bg-gradient-to-br from-zinc-700/95 to-zinc-800/95 backdrop-blur-lg border border-orange-500/30 text-white shadow-2xl shadow-orange-500/20 transition-all animate-in slide-in-from-bottom-4 duration-500">
                <div className="p-8 text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
                  <h3 className="text-lg font-semibold text-orange-200 mb-2">Loading Your Preferences</h3>
                  <p className="text-zinc-300">Fetching available tags...</p>
                </div>
              </DialogPanel>
            </TransitionChild>
          </div>
        </Dialog>
      </Transition>
    );
  }

  if (error) {
    return (
      <Transition appear show={isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => {}}>
          <TransitionChild 
            as={Fragment} 
            enter="ease-out duration-500" 
            enterFrom="opacity-0" 
            enterTo="opacity-100" 
            leave="ease-in duration-300" 
            leaveFrom="opacity-100" 
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" />
          </TransitionChild>
          <div className="fixed inset-0 overflow-y-auto flex items-center justify-center p-8">
            <TransitionChild
              as={Fragment}
              enter="ease-out duration-500"
              enterFrom="opacity-0 scale-90 translate-y-8"
              enterTo="opacity-100 scale-100 translate-y-0"
              leave="ease-in duration-300"
              leaveFrom="opacity-100 scale-100 translate-y-0"
              leaveTo="opacity-0 scale-90 translate-y-8"
            >
                             <DialogPanel className="w-full max-w-xl transform overflow-hidden rounded-2xl bg-gradient-to-br from-red-900/95 to-red-800/95 backdrop-blur-lg border border-red-500/30 text-white shadow-2xl shadow-red-500/20 transition-all animate-in slide-in-from-bottom-4 duration-500">
                <div className="p-8 text-center">
                  <div className="text-red-400 mb-4">⚠️</div>
                  <h3 className="text-lg font-semibold text-red-200 mb-2">Unable to Load Tags</h3>
                  <p className="text-red-300 mb-4">{error.message}</p>
                  <p className="text-red-400 text-sm">Please try refreshing the page or contact support.</p>
                </div>
              </DialogPanel>
            </TransitionChild>
          </div>
        </Dialog>
      </Transition>
    );
  }

  const toggleTag = (tagName: string) => {
    console.log('toggleTag called with:', tagName);
    console.log('Current selectedTags:', selectedTags);
    setSelectedTags(prev => {
      if (prev.includes(tagName)) {
        console.log('Removing tag:', tagName);
        return prev.filter(tag => tag !== tagName);
      } else {
        console.log('Adding tag:', tagName, 'Current length:', prev.length);
        return prev.length < 8 ? [...prev, tagName] : prev;
      }
    });
  };

  const handleSave = () => {
    // For first-time setup, require age confirmation and terms agreement
    if (isFirstTimeSetup && (!isAgeConfirmed || !termsAgreed || selectedTags.length < 5)) {
      return;
    }
    // For preferences update, only require minimum tags
    if (!isFirstTimeSetup && selectedTags.length < 5) {
      return;
    }
    onSave(selectedTags);
    setIsOpen(false);
  };



  // If no tags loaded, show empty state
  if (!isLoading && !error && tagCategories.length === 0) {
    return (
      <Transition appear show={isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => {}}>
          <TransitionChild 
            as={Fragment} 
            enter="ease-out duration-500" 
            enterFrom="opacity-0" 
            enterTo="opacity-100" 
            leave="ease-in duration-300" 
            leaveFrom="opacity-100" 
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" />
          </TransitionChild>
          <div className="fixed inset-0 overflow-y-auto flex items-center justify-center p-8">
            <TransitionChild
              as={Fragment}
              enter="ease-out duration-500"
              enterFrom="opacity-0 scale-90 translate-y-8"
              enterTo="opacity-100 scale-100 translate-y-0"
              leave="ease-in duration-300"
              leaveFrom="opacity-100 scale-100 translate-y-0"
              leaveTo="opacity-0 scale-90 translate-y-8"
            >
                             <DialogPanel className="w-full max-w-xl transform overflow-hidden rounded-2xl bg-gradient-to-br from-yellow-900/95 to-yellow-800/95 backdrop-blur-lg border border-yellow-500/30 text-white shadow-2xl shadow-yellow-500/20 transition-all animate-in slide-in-from-bottom-4 duration-500">
                <div className="p-8 text-center">
                  <div className="text-yellow-400 mb-4">📦</div>
                  <h3 className="text-lg font-semibold text-yellow-200 mb-2">No Tags Available</h3>
                  <p className="text-yellow-300 mb-4">The tag database appears to be empty.</p>
                  <p className="text-yellow-400 text-sm">Please contact support to set up your preferences.</p>
                </div>
              </DialogPanel>
            </TransitionChild>
          </div>
        </Dialog>
      </Transition>
    );
  }

  const canClose = isFirstTimeSetup ? (isAgeConfirmed && termsAgreed) : true;

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={() => {}}>
        <TransitionChild 
          as={Fragment} 
          enter="ease-out duration-500" 
          enterFrom="opacity-0" 
          enterTo="opacity-100" 
          leave="ease-in duration-300" 
          leaveFrom="opacity-100" 
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" />
        </TransitionChild>

        <div className="fixed inset-0 overflow-y-auto flex items-center justify-center p-8">
          <TransitionChild
            as={Fragment}
            enter="ease-out duration-500"
            enterFrom="opacity-0 scale-90 translate-y-8"
            enterTo="opacity-100 scale-100 translate-y-0"
            leave="ease-in duration-300"
            leaveFrom="opacity-100 scale-100 translate-y-0"
            leaveTo="opacity-0 scale-90 translate-y-8"
          >
            <DialogPanel className="w-full max-w-xl max-h-[90vh] transform rounded-2xl bg-gradient-to-br from-zinc-700/95 to-zinc-800/95 backdrop-blur-lg border border-orange-500/30 text-white shadow-2xl shadow-orange-500/20 transition-all animate-in slide-in-from-bottom-4 duration-500 flex flex-col overflow-hidden">
            
            {/* Header */}
            <div className="relative p-4 pb-3 border-b border-orange-500/20">
              <div className="flex items-center justify-between">
                <div className="animate-in slide-in-from-left-4 duration-700">
                  <DialogTitle className="text-lg font-semibold bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent animate-in fade-in duration-1000">
                    {isFirstTimeSetup ? 'Welcome Aboard' : 'Update Your Preferences'}
                  </DialogTitle>
                  <p className="text-zinc-300 text-sm mt-1 animate-in slide-in-from-left-4 duration-700 delay-200">
                    {isFirstTimeSetup 
                      ? "Pick between 5-8 things you like. It'll help you find the characters you love to talk with."
                      : "Update your tag preferences to discover new characters and content that match your interests."
                    }
                  </p>
                </div>
                <Badge 
                  variant="outline" 
                  className={`animate-in slide-in-from-right-4 duration-700 delay-300 ${
                    selectedTags.length < 5 
                      ? 'text-red-400 border-red-500/30 animate-pulse' 
                      : selectedTags.length >= 5 && selectedTags.length <= 8
                      ? 'text-green-400 border-green-500/30 animate-bounce'
                      : 'text-orange-400 border-orange-500/30'
                  }`}
                >
                  ({selectedTags.length}/8) {selectedTags.length < 5 && 'Need ' + (5 - selectedTags.length) + ' more'}
                </Badge>
              </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-y-auto">
              {/* Tags Section */}
              <div className="p-4 pt-3">
                <div className="mb-4 animate-in slide-in-from-bottom-4 duration-700 delay-400">
                  <h3 className="text-base font-semibold text-orange-200 mb-2">Selected Tags</h3>
                  <div className="min-h-[40px] p-2 bg-zinc-600/30 rounded-lg border border-orange-500/20 transition-all duration-300">
                    {selectedTags.length === 0 ? (
                      <p className="text-zinc-500 text-xs animate-pulse">No tags selected yet...</p>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {selectedTags.map((tagName, index) => {
                          const tag = tagCategories.flatMap(cat => cat.tags).find(t => t.name === tagName);
                          return tag ? (
                            <Badge
                              key={tagName}
                              className="flex items-center gap-1 px-1.5 py-0.5 text-white border-0 text-xs animate-in slide-in-from-bottom-2 duration-300 hover:scale-105 transition-transform"
                              style={{ 
                                backgroundColor: tag.color,
                                animationDelay: `${index * 100}ms`
                              }}
                            >
                              <span className="text-xs">{tag.emoji}</span>
                              <span className="text-xs">{tag.displayName}</span>
                              <X 
                                className="h-2.5 w-2.5 ml-0.5 cursor-pointer hover:bg-black/20 rounded-full transition-all duration-200"
                                onClick={() => toggleTag(tagName)}
                              />
                            </Badge>
                          ) : null;
                        })}
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                    {tagCategories.map((category, categoryIndex) => (
                      <div 
                        key={category.category}
                        className="animate-in slide-in-from-bottom-4 duration-700"
                        style={{ animationDelay: `${600 + categoryIndex * 100}ms` }}
                      >
                        <h4 className="text-sm font-medium text-orange-200 mb-2">{category.category}</h4>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {category.tags.map((tag, tagIndex) => {
                            const isSelected = selectedTags.includes(tag.name);
                            return (
                              <button
                                key={tag.name}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleTag(tag.name);
                                }}
                                disabled={!isSelected && selectedTags.length >= 8}
                                className={cn(
                                  "relative flex items-center gap-1 p-1.5 rounded-md border text-left text-xs transition-all duration-300 hover:scale-105 hover:shadow-lg group animate-in slide-in-from-bottom-2",
                                  isSelected 
                                    ? "border-orange-500/50 bg-orange-500/20 text-white shadow-orange-500/20 shadow-lg animate-pulse"
                                    : selectedTags.length >= 8
                                    ? "border-zinc-600/30 bg-zinc-700/20 text-zinc-500 cursor-not-allowed"
                                    : "border-zinc-600/50 bg-zinc-700/30 text-zinc-300 hover:border-orange-500/30 hover:bg-zinc-600/50 hover:text-orange-200 hover:shadow-orange-500/10",
                                  !isSelected && selectedTags.length < 5 && selectedTags.length > 0 && "animate-pulse border-green-500/30"
                                )}
                                style={{ 
                                  animationDelay: `${800 + categoryIndex * 100 + tagIndex * 50}ms`,
                                  boxShadow: isSelected ? `0 0 10px ${tag.color}40` : undefined
                                }}
                              >
                                <span className="text-xs transition-transform duration-200 group-hover:scale-110">{tag.emoji}</span>
                                <span className="flex-1 truncate text-xs font-medium">{tag.displayName}</span>
                                {tag.isNSFW && (
                                  <Badge variant="outline" className="text-[8px] px-0.5 py-0 h-2.5 text-red-400 border-red-500/30">
                                    NSFW
                                  </Badge>
                                )}
                                {isSelected && (
                                  <CheckCircle2 className="h-2.5 w-2.5 text-orange-400 absolute -top-0.5 -right-0.5 bg-zinc-900 rounded-full" />
                                )}
                              </button>
                            );
                          })}
                        </div>
                        {category.category !== "Sexuality" && <Separator className="mt-4 bg-zinc-600/50" />}
                      </div>
                    ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-3 pt-2 border-t border-orange-500/20 space-y-2 animate-in slide-in-from-bottom-4 duration-700 delay-1000">
              {/* Checkboxes - Only show for first-time setup */}
              {isFirstTimeSetup && (
                <div className="space-y-1">
                  <label className="flex items-center space-x-2 cursor-pointer group transition-all duration-200 hover:bg-zinc-700/20 p-1 rounded-lg">
                    <input
                      type="checkbox"
                      checked={isAgeConfirmed}
                      onChange={(e) => setIsAgeConfirmed(e.target.checked)}
                      className="rounded border-zinc-600 text-orange-500 focus:ring-orange-500 focus:ring-offset-0 transition-all duration-200"
                    />
                    <span className={`text-xs transition-all duration-200 ${isAgeConfirmed ? 'text-green-300' : 'text-zinc-300'} group-hover:text-orange-300`}>
                      I confirm that I am 18 years old or older
                    </span>
                    {isAgeConfirmed && <CheckCircle2 className="h-3 w-3 text-green-400" />}
                  </label>

                  <label className="flex items-center space-x-2 cursor-pointer group transition-all duration-200 hover:bg-zinc-700/20 p-1 rounded-lg">
                    <input
                      type="checkbox"
                      checked={termsAgreed}
                      onChange={(e) => setTermsAgreed(e.target.checked)}
                      className="rounded border-zinc-600 text-orange-500 focus:ring-orange-500 focus:ring-offset-0 transition-all duration-200"
                    />
                    <span className={`text-xs transition-all duration-200 ${termsAgreed ? 'text-green-300' : 'text-zinc-300'} group-hover:text-orange-300`}>
                      I have read and agree to the{" "}
                      <a href="/legal/terms-of-service" target="_blank" rel="noopener noreferrer" className="text-orange-400 hover:text-orange-300 underline transition-colors duration-200">Terms of Service</a>
                      {" "}and{" "}
                      <a href="/legal/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-orange-400 hover:text-orange-300 underline transition-colors duration-200">Privacy Policy</a>
                    </span>
                    {termsAgreed && <CheckCircle2 className="h-3 w-3 text-green-400" />}
                  </label>
                </div>
              )}

              {/* Action Button */}
              <div className="flex justify-center pt-1">
                <Button
                  onClick={handleSave}
                  disabled={
                    isFirstTimeSetup 
                      ? (!isAgeConfirmed || !termsAgreed || selectedTags.length < 5)
                      : (selectedTags.length < 5)
                  }
                  className={`px-8 py-2 text-sm bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-orange-500/25 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 ${
                    (isFirstTimeSetup ? (!isAgeConfirmed || !termsAgreed || selectedTags.length < 5) : (selectedTags.length < 5))
                      ? 'animate-pulse' 
                      : ''
                  }`}
                >
                  {selectedTags.length < 5 
                    ? `${isFirstTimeSetup ? 'Complete Setup' : 'Update Preferences'} (Need ${5 - selectedTags.length} more tags)` 
                    : isFirstTimeSetup ? 'Complete Setup ✨' : 'Update Preferences ✨'
                  }
                </Button>
              </div>
            </div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </Dialog>
    </Transition>
  );
} 