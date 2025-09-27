import React from 'react';
import { X } from 'lucide-react';
import { Link } from 'wouter';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface Tag {
  _id: string;
  name: string;
  displayName: string;
  description?: string;
  category: string;
  color: string;
  emoji?: string;
  isNSFW: boolean;
  usageCount: number;
}

// Fallback emoji mapping for common tags when full tag objects aren't available
const tagEmojiMap: Record<string, string> = {
  // Character types
  'female': '👩',
  'male': '👨',
  'non-human': '👽',
  'non-binary': '🏳️‍⚧️',
  
  // Personality
  'shy': '😊',
  'confident': '💪',
  'flirty': '😉',
  'mysterious': '🎭',
  'caring': '💝',
  'playful': '🎮',
  'dominant': '👑',
  'submissive': '🙇',
  
  // Appearance
  'blonde': '👱',
  'brunette': '👩‍🦰',
  'redhead': '👩‍🦰',
  'black-hair': '👩‍🦲',
  'petite': '🧚‍♀️',
  'tall': '📏',
  'curvy': '💃',
  'athletic': '💪',
  'blue-eyes': '👁️',
  'green-eyes': '💚',
  
  // Genre
  'anime': '📺',
  'sci-fi': '🚀',
  'fantasy': '🧙‍♀️',
  'romance': '💕',
  'action': '💥',
  'adventure': '🗺️',
  'wholesome': '🤗',
  'modern': '🏙️',
  'ai-companion': '🤖',
  'ai companion': '🤖',
  'interactive': '🎮',
  'rpg': '🎲',
  'scenario': '🪢',
  'fictional': '📚',
  'multiple': '👭',
  'magical': '🔮',
  'hentai': '🔞',
  'royalty': '👑',
  'assistant': '💁',
  'religion': '⛪️',
  'historical': '🏰',
  'romantic': '💞',
  'horror': '👻',
  'detective': '🕵️‍♀️',
  'philosophy': '📙',
  'politics': '📜',
  'manga': '📖',
  'fandom': '⭐',
  
  // Origin
  'original-character': '🧑‍🎨',
  'game': '🎮',
  'movie': '🎥',
  'vtuber': '👩🏼‍💻',
  'books': '📚',
  'folklore': '🧚‍♀️',
  
  // Content
  'sfw': '✅',
  'nsfw': '🔞',
  'mature': '🔞',
  
  // Sexuality
  'straight': '💙',
  'bisexual': '💖',
  'gay': '🏳️‍🌈',
  'lesbian': '👩‍❤️‍👩',
  
  // Physical traits
  'elf': '🧝‍♀️',
  'alien': '👽',
  'robot': '🤖',
  
  // Scenarios
  'school': '🏫',
  'office': '🏢',
  'slice-of-life': '☕',
};

interface TagBadgeProps {
  tag: Tag | string;
  variant?: 'default' | 'secondary' | 'destructive' | 'outline';
  removable?: boolean;
  onRemove?: () => void;
  size?: 'sm' | 'default' | 'lg';
  className?: string;
  buttonStyle?: boolean; // New prop to use Button styling like Follow button
  clickable?: boolean; // New prop to make tag clickable for navigation
}

export function TagBadge({ 
  tag, 
  variant = 'secondary', 
  removable = false, 
  onRemove, 
  size = 'default',
  className,
  buttonStyle = false,
  clickable = false
}: TagBadgeProps) {
  // Enhanced tag object creation with emoji fallback
  const tagObj = typeof tag === 'string' ? { 
    name: tag, 
    displayName: tag.charAt(0).toUpperCase() + tag.slice(1).replace('-', ' '), 
    color: '#6B7280', 
    category: 'general', 
    isNSFW: false, 
    emoji: tagEmojiMap[tag.toLowerCase()] || undefined 
  } : {
    ...tag,
    // Only use fallback emoji if the tag object doesn't already have one
    emoji: tag.emoji || tagEmojiMap[tag.name?.toLowerCase()] || undefined
  };
  
  // Generate the tag URL for navigation
  const tagUrl = `/tags/${encodeURIComponent(tagObj.name)}`;
  
  // If buttonStyle is enabled, use Button component with Follow button styling
  if (buttonStyle) {
    const buttonContent = (
      <>
        {tagObj.emoji && <span className="text-sm">{tagObj.emoji}</span>}
        <span>{tagObj.displayName}</span>
        {removable && onRemove && (
          <Button
            variant="ghost"
            size="icon"
            className="h-3 w-3 p-0 hover:bg-transparent ml-1"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onRemove();
            }}
          >
            <X className="h-2 w-2" />
          </Button>
        )}
      </>
    );

    if (clickable) {
      return (
        <Link href={tagUrl}>
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "border-orange-500/30 text-orange-300 hover:bg-orange-500/10 hover:border-orange-500/50 transition-all duration-200 gap-1.5",
              tagObj.isNSFW && "border-red-500/30 text-red-300 hover:bg-red-500/10 hover:border-red-500/50",
              className
            )}
          >
            {buttonContent}
          </Button>
        </Link>
      );
    }

    return (
      <Button
        variant="outline"
        size="sm"
        className={cn(
          "border-orange-500/30 text-orange-300 hover:bg-orange-500/10 hover:border-orange-500/50 transition-all duration-200 gap-1.5",
          tagObj.isNSFW && "border-red-500/30 text-red-300 hover:bg-red-500/10 hover:border-red-500/50",
          className
        )}
      >
        {buttonContent}
      </Button>
    );
  }
  
  const getTagStyles = () => {
    if (typeof tag === 'string') {
      return 'bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200';
    }
    
    // Category-based styling
    switch (tagObj.category) {
      case 'personality':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-200';
      case 'appearance':
        return 'bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900 dark:text-green-200';
      case 'role':
        return 'bg-purple-100 text-purple-800 hover:bg-purple-200 dark:bg-purple-900 dark:text-purple-200';
      case 'setting':
        return 'bg-orange-100 text-orange-800 hover:bg-orange-200 dark:bg-orange-900 dark:text-orange-200';
      case 'relationship':
        return 'bg-pink-100 text-pink-800 hover:bg-pink-200 dark:bg-pink-900 dark:text-pink-200';
      case 'genre':
        return 'bg-indigo-100 text-indigo-800 hover:bg-indigo-200 dark:bg-indigo-900 dark:text-indigo-200';
      case 'content_warning':
        return 'bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'text-xs px-2 py-1';
      case 'lg':
        return 'text-sm px-3 py-2';
      default:
        return 'text-xs px-2.5 py-1.5';
    }
  };

  const badgeContent = (
    <>
      {tagObj.emoji && <span className="text-xs">{tagObj.emoji}</span>}
      <span>{tagObj.displayName}</span>
      {removable && onRemove && (
        <Button
          variant="ghost"
          size="icon"
          className="h-3 w-3 p-0 hover:bg-transparent"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onRemove();
          }}
        >
          <X className="h-2 w-2" />
        </Button>
      )}
    </>
  );

  const badgeClasses = cn(
    'inline-flex items-center gap-1 transition-colors',
    getTagStyles(),
    getSizeClasses(),
    tagObj.isNSFW && 'ring-1 ring-red-400',
    clickable && 'cursor-pointer hover:opacity-80',
    className
  );

  if (clickable) {
    return (
      <Link href={tagUrl}>
        <Badge variant={variant} className={badgeClasses}>
          {badgeContent}
        </Badge>
      </Link>
    );
  }

  return (
    <Badge variant={variant} className={badgeClasses}>
      {badgeContent}
    </Badge>
  );
}

interface TagListProps {
  tags: (Tag | string)[];
  removable?: boolean;
  onRemoveTag?: (tag: Tag | string) => void;
  maxVisible?: number;
  size?: 'sm' | 'default' | 'lg';
  className?: string;
  buttonStyle?: boolean; // New prop to use Button styling like Follow button
  clickable?: boolean; // New prop to make tags clickable for navigation
}

export function TagList({ 
  tags, 
  removable = false, 
  onRemoveTag, 
  maxVisible,
  size = 'default',
  className,
  buttonStyle = false,
  clickable = false
}: TagListProps) {
  const visibleTags = maxVisible ? tags.slice(0, maxVisible) : tags;
  const hiddenCount = maxVisible && tags.length > maxVisible ? tags.length - maxVisible : 0;

  return (
    <div className={cn('flex flex-wrap gap-1', className)}>
      {visibleTags.map((tag, index) => (
        <TagBadge
          key={typeof tag === 'string' ? tag : tag._id}
          tag={tag}
          removable={removable}
          onRemove={onRemoveTag ? () => onRemoveTag(tag) : undefined}
          size={size}
          buttonStyle={buttonStyle}
          clickable={clickable}
        />
      ))}
      {hiddenCount > 0 && (
        <Badge variant="outline" className={getSizeClasses()}>
          +{hiddenCount} more
        </Badge>
      )}
    </div>
  );

  function getSizeClasses() {
    switch (size) {
      case 'sm':
        return 'text-xs px-2 py-1';
      case 'lg':
        return 'text-sm px-3 py-2';
      default:
        return 'text-xs px-2.5 py-1.5';
    }
  }
}
