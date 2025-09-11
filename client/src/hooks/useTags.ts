import { useState, useEffect } from 'react';
import { apiService } from '@/lib/api';
import { SHARED_TAG_CATEGORIES } from '../../../shared/tags-config';

interface Tag {
  name: string;
  displayName: string;
  color: string;
  emoji: string;
  isNSFW: boolean;
  category: string;
}

interface TagCategory {
  category: string;
  tags: Tag[];
}

// Convert shared tag configuration to local format
const fallbackTagCategories: TagCategory[] = SHARED_TAG_CATEGORIES.map(category => ({
  category: category.displayName, // Use displayName instead of name for consistency
  tags: category.tags.map(tag => ({
    name: tag.name,
    displayName: tag.displayName,
    color: tag.color || '#636e72', // Provide default color if undefined
    emoji: tag.emoji || '🏷️', // Provide default emoji if undefined
    isNSFW: tag.isNSFW || false, // Provide default if undefined
    category: category.displayName // Use displayName for category reference
  }))
}));

export function useTags() {
  const [tagCategories, setTagCategories] = useState<TagCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchTags = async () => {
      try {
        if (import.meta.env.DEV || import.meta.env.VITE_APP_ENV === 'development') {
          console.log('Fetching tags from API...');
        }
        const response = await apiService.getTags({ limit: 0 }); // Fetch all tags
        if (import.meta.env.DEV || import.meta.env.VITE_APP_ENV === 'development') {
          console.log('API response:', response);
        }
        
        // Handle both formats: direct array or object with items
        let tags;
        if (Array.isArray(response)) {
          tags = response; // Direct array format
        } else if (response && response.items) {
          tags = response.items; // Wrapped in object with items
        } else {
          throw new Error('Invalid API response format');
        }

        const categories = tags.reduce((acc: TagCategory[], tag: Tag) => {
          const category = acc.find((c: TagCategory) => c.category === tag.category);
          if (category) {
            category.tags.push(tag);
          } else {
            acc.push({ category: tag.category, tags: [tag] });
          }
          return acc;
        }, [] as TagCategory[]);

        if (import.meta.env.DEV || import.meta.env.VITE_APP_ENV === 'development') {
          console.log('Processed categories:', categories);
        }
        
        // If API returns less than expected tags, use fallback data
        const totalApiTags = categories.reduce((sum: number, cat: TagCategory) => sum + cat.tags.length, 0);
        if (totalApiTags < 50) { // If less than 50 tags, use fallback
          console.log(`API returned only ${totalApiTags} tags, using fallback data with ${fallbackTagCategories.reduce((sum: number, cat: TagCategory) => sum + cat.tags.length, 0)} tags`);
          setTagCategories(fallbackTagCategories);
        } else {
          setTagCategories(categories);
        }
      } catch (err) {
        console.error('Error fetching tags:', err);
        if (import.meta.env.DEV || import.meta.env.VITE_APP_ENV === 'development') {
          console.log('Using fallback tags...');
        }
        setTagCategories(fallbackTagCategories);
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTags();
  }, []);

  const tagMap = tagCategories.flatMap(c => c.tags).reduce((acc, tag) => {
    acc[tag.name] = tag;
    return acc;
  }, {} as Record<string, Tag>);

  return { tagCategories, isLoading, error, tagMap };
}
