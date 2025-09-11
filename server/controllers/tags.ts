import { Request, Response } from 'express';
import { TagModel } from '../db/models/TagModel.js';
import { CharacterModel } from '../db/models/CharacterModel.js';

// Get all tags with optional filtering
export async function getTags(req: Request, res: Response) {
  try {
    const { category, nsfw, page = 1, limit } = req.query;
    
    const filter: any = {};
    if (category) filter.category = category;
    if (nsfw !== undefined) filter.isNSFW = nsfw === 'true';

    const pageNum = parseInt(page as string);
    const limitNum = limit ? parseInt(limit as string) : 0;
    const skip = (pageNum - 1) * limitNum;

    let query = TagModel.find(filter)
      .sort({ category: 1, usageCount: -1, displayName: 1 });

    if (limitNum > 0) {
      query = query.skip(skip).limit(limitNum);
    }

    const tags = await query;
    
    const total = await TagModel.countDocuments(filter);

    // Transform tags to include proper category display names
    const transformedTags = tags.map(tag => ({
      name: tag.name,
      displayName: tag.displayName,
      color: tag.color,
      emoji: tag.emoji || '🏷️', // Default emoji if none provided
      isNSFW: tag.isNSFW,
      category: getCategoryDisplayName(tag.category),
      description: tag.description,
      usageCount: tag.usageCount
    }));
    
    res.json({
      items: transformedTags,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: limitNum > 0 ? Math.ceil(total / limitNum) : 1
    });
  } catch (error) {
    console.error('Error fetching tags:', error);
    res.status(500).json({ message: 'Failed to fetch tags' });
  }
}

// Helper function to convert category names to display names
function getCategoryDisplayName(category: string): string {
  const categoryMap: Record<string, string> = {
    'character-type': 'Character Type',
    'genre': 'Genre',
    'personality': 'Personality',
    'physical-traits': 'Physical Traits',
    'appearance': 'Appearance',
    'origin': 'Origin',
    'sexuality': 'Sexuality',
    'fantasy-kink': 'Fantasy',
    'content-rating': 'Content Rating',
    'relationship': 'Relationship',
    'ethnicity': 'Ethnicity',
    'scenario': 'Scenario'
  };
  return categoryMap[category] || category;
}

// Get tag categories
export async function getTagCategories(req: Request, res: Response) {
  try {
    const categories = await TagModel.distinct('category');
    res.json(categories);
  } catch (error) {
    console.error('Error fetching tag categories:', error);
    res.status(500).json({ message: 'Failed to fetch tag categories' });
  }
}

// Get tags grouped by category
export async function getTagsByCategory(req: Request, res: Response) {
  try {
    const { nsfw } = req.query;
    const filter: any = {};
    if (nsfw !== undefined) filter.isNSFW = nsfw === 'true';

    const tags = await TagModel.find(filter).sort({ category: 1, usageCount: -1, displayName: 1 });
    
    // Group by category
    const tagsByCategory = tags.reduce((acc, tag) => {
      if (!acc[tag.category]) {
        acc[tag.category] = [];
      }
      acc[tag.category].push(tag);
      return acc;
    }, {} as Record<string, typeof tags>);

    res.json(tagsByCategory);
  } catch (error) {
    console.error('Error fetching tags by category:', error);
    res.status(500).json({ message: 'Failed to fetch tags by category' });
  }
}

// Create a new tag (admin only)
export async function createTag(req: Request, res: Response) {
  try {
    const { name, displayName, description, category, color, isNSFW } = req.body;

    // Validation
    if (!name || !displayName || !category || !color) {
      return res.status(400).json({ message: 'Name, displayName, category, and color are required' });
    }

    // Check if tag already exists
    const existingTag = await TagModel.findOne({ name: name.toLowerCase() });
    if (existingTag) {
      return res.status(400).json({ message: 'Tag already exists' });
    }

    const newTag = await TagModel.create({
      name: name.toLowerCase(),
      displayName,
      description,
      category,
      color,
      isNSFW: isNSFW || false
    });

    res.status(201).json(newTag);
  } catch (error) {
    console.error('Error creating tag:', error);
    res.status(500).json({ message: 'Failed to create tag' });
  }
}

// Update a tag (admin only)
export async function updateTag(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const updates = req.body;

    const tag = await TagModel.findByIdAndUpdate(id, updates, { new: true });
    if (!tag) {
      return res.status(404).json({ message: 'Tag not found' });
    }

    res.json(tag);
  } catch (error) {
    console.error('Error updating tag:', error);
    res.status(500).json({ message: 'Failed to update tag' });
  }
}

// Delete a tag (admin only)
export async function deleteTag(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const tag = await TagModel.findById(id);
    if (!tag) {
      return res.status(404).json({ message: 'Tag not found' });
    }

    // Remove tag from all characters
    await CharacterModel.updateMany(
      { tags: id },
      { 
        $pull: { tags: id, tagNames: tag.name }
      }
    );

    await TagModel.findByIdAndDelete(id);

    res.json({ message: 'Tag deleted successfully' });
  } catch (error) {
    console.error('Error deleting tag:', error);
    res.status(500).json({ message: 'Failed to delete tag' });
  }
}

// Get popular tags
export async function getPopularTags(req: Request, res: Response) {
  try {
    const limit = parseInt(req.query.limit as string) || 20;
    const { nsfw } = req.query;
    
    const filter: any = {};
    if (nsfw !== undefined) filter.isNSFW = nsfw === 'true';

    const tags = await TagModel.find(filter)
      .sort({ usageCount: -1 })
      .limit(limit);

    res.json(tags);
  } catch (error) {
    console.error('Error fetching popular tags:', error);
    res.status(500).json({ message: 'Failed to fetch popular tags' });
  }
}
