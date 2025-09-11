import { Router } from 'express';
import { getTags, getTagCategories, getTagsByCategory, createTag, updateTag, deleteTag, getPopularTags } from '../controllers/tags.js';
import { requireAuth } from '../middleware/auth.js';
const router = Router();
// Public routes
router.get('/', getTags);
router.get('/categories', getTagCategories);
router.get('/by-category', getTagsByCategory);
router.get('/popular', getPopularTags);
// Admin routes (for now, just require auth - you can add admin check later)
router.post('/', requireAuth, createTag);
router.put('/:id', requireAuth, updateTag);
router.delete('/:id', requireAuth, deleteTag);
export default router;
