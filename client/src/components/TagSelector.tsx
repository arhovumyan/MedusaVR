import React, { useState, useEffect } from 'react';
import { Search, Plus, Filter, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TagBadge, TagList, type Tag } from '@/components/ui/tag';
import { apiRequest } from '@/lib/queryClient';
import { cn } from '@/lib/utils';

interface TagSelectorProps {
  selectedTags: Tag[];
  onTagsChange: (tags: Tag[]) => void;
  maxTags?: number;
  allowNSFW?: boolean;
  className?: string;
}

export function TagSelector({ 
  selectedTags, 
  onTagsChange, 
  maxTags = 10,
  allowNSFW = false,
  className 
}: TagSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch available tags and categories
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [tagsResponse, categoriesResponse] = await Promise.all([
          apiRequest('GET', '/api/tags'),
          apiRequest('GET', '/api/tags/categories')
        ]);
        
        const tagsData = await tagsResponse.json();
        const categoriesData = await categoriesResponse.json();
        
        if (tagsData && Array.isArray(tagsData.items)) {
          setAvailableTags(tagsData.items);
        }
        if (Array.isArray(categoriesData)) {
          setCategories(['all', ...categoriesData]);
        }
      } catch (error) {
        console.error('Failed to fetch tags:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter tags based on search and category
  const filteredTags = availableTags.filter(tag => {
    // Filter out NSFW tags if not allowed
    if (!allowNSFW && tag.isNSFW) return false;
    
    // Filter by category
    if (selectedCategory !== 'all' && tag.category !== selectedCategory) return false;
    
    // Filter by search query
    if (searchQuery && !tag.displayName.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    
    return true;
  });

  const handleTagSelect = (tag: Tag) => {
    const isAlreadySelected = selectedTags.some(selected => selected._id === tag._id);
    
    if (isAlreadySelected) {
      // Deselect tag
      onTagsChange(selectedTags.filter(selected => selected._id !== tag._id));
    } else {
      // Select tag if under limit
      if (selectedTags.length < maxTags) {
        onTagsChange([...selectedTags, tag]);
      }
    }
  };

  const handleTagRemove = (tagToRemove: Tag | string) => {
    const tagId = typeof tagToRemove === 'string' ? tagToRemove : tagToRemove._id;
    onTagsChange(selectedTags.filter(tag => tag._id !== tagId));
  };

  const popularTags = filteredTags
    .sort((a, b) => b.usageCount - a.usageCount);

  return (
    <div className={cn('space-y-4', className)}>
      {/* Selected Tags */}
      {selectedTags.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">Selected Tags ({selectedTags.length}/{maxTags})</h4>
          </div>
          <TagList
            tags={selectedTags}
            removable
            onRemoveTag={handleTagRemove}
          />
        </div>
      )}

      {selectedTags.length > 0 && <Separator />}

      {/* Search and Filter */}
      <div className="space-y-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-[140px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {categories.map(category => (
                <SelectItem key={category} value={category}>
                  {category === 'all' ? 'All Categories' : category.charAt(0).toUpperCase() + category.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Popular Tags (when no search) */}
      {!searchQuery && popularTags.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground">Popular Tags</h4>
          <div className="flex flex-wrap gap-1">
            {popularTags.map(tag => {
              const isSelected = selectedTags.some(selected => selected._id === tag._id);
              return (
                <Button
                  key={tag._id}
                  variant={isSelected ? "default" : "outline"}
                  size="sm"
                  className={`h-7 text-xs ${isSelected ? 'bg-orange-500 hover:bg-orange-600 text-white' : ''}`}
                  onClick={() => handleTagSelect(tag)}
                >
                  {isSelected ? (
                    <>
                      <X className="h-3 w-3 mr-1" />
                      {tag.displayName}
                    </>
                  ) : (
                    <>
                      <Plus className="h-3 w-3 mr-1" />
                      {tag.displayName}
                    </>
                  )}
                </Button>
              );
            })}
          </div>
        </div>
      )}

      {/* Available Tags */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-muted-foreground">
          {searchQuery ? `Search Results (${filteredTags.length})` : 'Available Tags'}
        </h4>
        
        {isLoading ? (
          <div className="text-center py-4 text-muted-foreground">Loading tags...</div>
        ) : filteredTags.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            {searchQuery ? 'No tags found' : 'No more tags available'}
          </div>
        ) : (
          <ScrollArea className="h-40">
            <div className="flex flex-wrap gap-1 p-1">
              {filteredTags.map(tag => {
                const isSelected = selectedTags.some(selected => selected._id === tag._id);
                return (
                  <Button
                    key={tag._id}
                    variant={isSelected ? "default" : "ghost"}
                    size="sm"
                    className={`h-7 text-xs justify-start ${isSelected ? 'bg-orange-500 hover:bg-orange-600 text-white' : ''}`}
                    onClick={() => handleTagSelect(tag)}
                  >
                    {isSelected ? (
                      <X className="h-3 w-3 mr-1" />
                    ) : (
                      <Plus className="h-3 w-3 mr-1" />
                    )}
                    <TagBadge tag={tag} size="sm" />
                    <span className="ml-1 text-muted-foreground">
                      ({tag.usageCount})
                    </span>
                  </Button>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </div>

      {/* Limits info */}
      {selectedTags.length >= maxTags && (
        <div className="text-xs text-muted-foreground text-center">
          Maximum of {maxTags} tags allowed
        </div>
      )}
    </div>
  );
}
