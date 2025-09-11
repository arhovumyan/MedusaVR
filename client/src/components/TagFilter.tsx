import React, { useState } from 'react';
import { Filter, X, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { TagBadge, type Tag } from '@/components/ui/tag';
import { useTags } from '@/hooks/useTags';
import { cn } from '@/lib/utils';

interface TagFilterProps {
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
  includeNSFW?: boolean;
  onIncludeNSFWChange?: (include: boolean) => void;
  className?: string;
}

export function TagFilter({ 
  selectedTags, 
  onTagsChange, 
  includeNSFW = false,
  onIncludeNSFWChange,
  className 
}: TagFilterProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['personality']));
  
  const { tagCategories, isLoading, error } = useTags();

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  const toggleTag = (tagName: string) => {
    const newTags = selectedTags.includes(tagName)
      ? selectedTags.filter(tag => tag !== tagName)
      : [...selectedTags, tagName];
    onTagsChange(newTags);
  };

  const clearAllTags = () => {
    onTagsChange([]);
  };



  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4" />
          <h3 className="font-semibold">Filters</h3>
        </div>
        {selectedTags.length > 0 && (
          <Button variant="ghost" size="sm" onClick={clearAllTags}>
            <X className="h-3 w-3 mr-1" />
            Clear All
          </Button>
        )}
      </div>

      {/* Selected Tags */}
      {selectedTags.length > 0 && (
        <div className="space-y-2">
          <Label className="text-sm font-medium">Selected ({selectedTags.length})</Label>
          <div className="flex flex-wrap gap-1">
            {selectedTags.map(tagName => (
              <Badge
                key={tagName}
                variant="default"
                className="cursor-pointer"
                onClick={() => toggleTag(tagName)}
              >
                {tagName}
                <X className="h-3 w-3 ml-1" />
              </Badge>
            ))}
          </div>
        </div>
      )}

      {selectedTags.length > 0 && <Separator />}

      {/* NSFW Toggle */}
      {onIncludeNSFWChange && (
        <div className="flex items-center justify-between">
          <Label htmlFor="nsfw-toggle" className="text-sm">Include NSFW</Label>
          <Switch
            id="nsfw-toggle"
            checked={includeNSFW}
            onCheckedChange={onIncludeNSFWChange}
          />
        </div>
      )}

      {/* Tag Categories */}
      <ScrollArea className="h-[400px]">
        <div className="space-y-2">
          {tagCategories.map(category => {
            if (!category.tags || category.tags.length === 0) return null;
            
            const isExpanded = expandedCategories.has(category.category);
            const categoryTags = category.tags;
            
            return (
              <Collapsible key={category.category} open={isExpanded} onOpenChange={() => toggleCategory(category.category)}>
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    className="w-full justify-between p-2 h-auto"
                  >
                    <span className="font-medium capitalize">{category.category.replace('_', ' ')}</span>
                    <div className="flex items-center gap-1">
                      <Badge variant="outline" className="text-xs">
                        {categoryTags.length}
                      </Badge>
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </div>
                  </Button>
                </CollapsibleTrigger>
                
                <CollapsibleContent className="space-y-1 pt-1">
                  {categoryTags.map(tag => (
                    <Button
                      key={tag.name}
                      variant="ghost"
                      size="sm"
                      className={cn(
                        'w-full justify-start p-2 h-auto text-xs',
                        selectedTags.includes(tag.name) && 'bg-primary/10'
                      )}
                      onClick={() => toggleTag(tag.name)}
                    >
                      <TagBadge tag={tag.name} size="sm" />
                    </Button>
                  ))}
                </CollapsibleContent>
              </Collapsible>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
