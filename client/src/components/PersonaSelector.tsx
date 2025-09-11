import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { personaTerms, BroadTerm, Trait } from '@/constants/personaTraits';

interface PersonaSelectorProps {
  selectedPersonaTraits: string[];
  onPersonaTraitsChange: (traits: string[]) => void;
}

const PersonaSelector: React.FC<PersonaSelectorProps> = ({
  selectedPersonaTraits,
  onPersonaTraitsChange,
}) => {
  const [expandedTerm, setExpandedTerm] = useState<string | null>(null);

  const handleTermClick = (termId: string) => {
    setExpandedTerm(prev => (prev === termId ? null : termId));
  };

  const handleTraitToggle = (trait: Trait) => {
    const isSelected = selectedPersonaTraits.includes(trait.id);
    if (isSelected) {
      onPersonaTraitsChange(selectedPersonaTraits.filter(id => id !== trait.id));
    } else {
      onPersonaTraitsChange([...selectedPersonaTraits, trait.id]);
    }
  };

  return (
    <div className="space-y-4">
      {personaTerms.map((term: BroadTerm) => (
        <div key={term.id} className={`rounded-lg overflow-hidden shadow-lg ${term.color} bg-opacity-20 backdrop-blur-sm`}>
          <Button
            type="button"
            variant="ghost"
            className={`w-full flex justify-between items-center text-lg font-semibold py-4 px-6 transition-colors duration-200
              ${expandedTerm === term.id ? `bg-${term.color.split('-')[0]}-600/30` : `hover:bg-${term.color.split('-')[0]}-600/20`}
              text-white`}
            onClick={() => handleTermClick(term.id)}
          >
            {term.name}
            {expandedTerm === term.id ? (
              <ChevronUp className={`h-5 w-5 text-${term.color.split('-')[0]}-400`} />
            ) : (
              <ChevronDown className={`h-5 w-5 text-${term.color.split('-')[0]}-400`} />
            )}
          </Button>
          {expandedTerm === term.id && (
            <div className={`p-4 border-t border-${term.color.split('-')[0]}-700 bg-${term.color.split('-')[0]}-900/30 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3`}>
              {term.traits.map((trait: Trait) => (
                <Badge
                  key={trait.id}
                  variant={selectedPersonaTraits.includes(trait.id) ? "default" : "outline"}
                  className={`cursor-pointer text-sm px-4 py-2 rounded-full transition-all duration-200
                    ${selectedPersonaTraits.includes(trait.id)
                      ? `bg-${term.color.split('-')[0]}-500 hover:bg-${term.color.split('-')[0]}-600 text-white`
                      : `border-${term.color.split('-')[0]}-600 text-zinc-300 hover:bg-${term.color.split('-')[0]}-700/50 hover:border-${term.color.split('-')[0]}-500/50`}
                  `}
                  onClick={() => handleTraitToggle(trait)}
                >
                  {trait.name}
                </Badge>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default PersonaSelector;
