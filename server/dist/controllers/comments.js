import { CommentModel } from "../db/models/CommentModel.js";
import { CharacterModel } from "../db/models/CharacterModel.js";
// Get comments for a character
export const getCharacterComments = async (req, res) => {
    try {
        const { characterId } = req.params;
        const { page = 1, limit = 10 } = req.query;
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;
        // Get comments with user info, sorted by newest first
        const comments = await CommentModel.find({
            characterId: parseInt(characterId),
            parentCommentId: null // Only top-level comments
        })
            .populate('userId', 'username avatarUrl verified')
            .populate({
            path: 'replies',
            populate: {
                path: 'userId',
                select: 'username avatarUrl verified'
            }
        })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNum);
        const totalComments = await CommentModel.countDocuments({
            characterId: parseInt(characterId),
            parentCommentId: null
        });
        res.json({
            success: true,
            data: comments,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total: totalComments,
                pages: Math.ceil(totalComments / limitNum)
            }
        });
    }
    catch (error) {
        console.error('Error fetching comments:', error);
        res.status(500).json({ error: 'Failed to fetch comments' });
    }
};
// Create a new comment
export const createComment = async (req, res) => {
    try {
        const { characterId } = req.params;
        const { content, parentCommentId } = req.body;
        const userId = req.userId;
        if (!content || content.trim().length === 0) {
            return res.status(400).json({ error: 'Comment content is required' });
        }
        if (content.length > 1000) {
            return res.status(400).json({ error: 'Comment is too long (max 1000 characters)' });
        }
        // Verify character exists
        const character = await CharacterModel.findOne({ id: parseInt(characterId) });
        if (!character) {
            return res.status(404).json({ error: 'Character not found' });
        }
        // If it's a reply, verify parent comment exists
        if (parentCommentId) {
            const parentComment = await CommentModel.findById(parentCommentId);
            if (!parentComment) {
                return res.status(404).json({ error: 'Parent comment not found' });
            }
        }
        const newComment = await CommentModel.create({
            characterId: parseInt(characterId),
            userId,
            content: content.trim(),
            parentCommentId: parentCommentId || null
        });
        // Update character's comments count (only for top-level comments)
        if (!parentCommentId) {
            await CharacterModel.findOneAndUpdate({ id: parseInt(characterId) }, { $inc: { commentsCount: 1 } });
        }
        else {
            // Add reply to parent comment's replies array
            await CommentModel.findByIdAndUpdate(parentCommentId, { $push: { replies: newComment._id } });
        }
        // Populate user info before returning
        const populatedComment = await CommentModel.findById(newComment._id)
            .populate('userId', 'username avatarUrl verified');
        res.status(201).json({
            success: true,
            data: populatedComment,
            message: 'Comment created successfully'
        });
    }
    catch (error) {
        console.error('Error creating comment:', error);
        res.status(500).json({ error: 'Failed to create comment' });
    }
};
// Like/unlike a comment
export const likeComment = async (req, res) => {
    try {
        const { commentId } = req.params;
        const userId = req.userId;
        const comment = await CommentModel.findById(commentId);
        if (!comment) {
            return res.status(404).json({ error: 'Comment not found' });
        }
        // For simplicity, we'll just increment likes
        // In a real app, you'd track who liked what to prevent double-liking
        await CommentModel.findByIdAndUpdate(commentId, { $inc: { likes: 1 } });
        const updatedComment = await CommentModel.findById(commentId)
            .populate('userId', 'username avatarUrl verified');
        res.json({
            success: true,
            data: updatedComment,
            message: 'Comment liked'
        });
    }
    catch (error) {
        console.error('Error liking comment:', error);
        res.status(500).json({ error: 'Failed to like comment' });
    }
};
// Delete a comment
export const deleteComment = async (req, res) => {
    try {
        const { commentId } = req.params;
        const userId = req.userId;
        const comment = await CommentModel.findById(commentId);
        if (!comment) {
            return res.status(404).json({ error: 'Comment not found' });
        }
        // Check if user owns the comment
        if (comment.userId.toString() !== userId) {
            return res.status(403).json({ error: 'You can only delete your own comments' });
        }
        // Delete the comment
        await CommentModel.findByIdAndDelete(commentId);
        // Update character's comments count (only for top-level comments)
        if (!comment.parentCommentId) {
            await CharacterModel.findOneAndUpdate({ id: comment.characterId }, { $inc: { commentsCount: -1 } });
        }
        else {
            // Remove from parent comment's replies array
            await CommentModel.findByIdAndUpdate(comment.parentCommentId, { $pull: { replies: commentId } });
        }
        res.json({
            success: true,
            message: 'Comment deleted successfully'
        });
    }
    catch (error) {
        console.error('Error deleting comment:', error);
        res.status(500).json({ error: 'Failed to delete comment' });
    }
};
// Edit a comment
export const editComment = async (req, res) => {
    try {
        const { commentId } = req.params;
        const { content } = req.body;
        const userId = req.userId;
        if (!content || content.trim().length === 0) {
            return res.status(400).json({ error: 'Comment content is required' });
        }
        if (content.length > 1000) {
            return res.status(400).json({ error: 'Comment is too long (max 1000 characters)' });
        }
        const comment = await CommentModel.findById(commentId);
        if (!comment) {
            return res.status(404).json({ error: 'Comment not found' });
        }
        // Check if user owns the comment
        if (comment.userId.toString() !== userId) {
            return res.status(403).json({ error: 'You can only edit your own comments' });
        }
        // Update the comment
        const updatedComment = await CommentModel.findByIdAndUpdate(commentId, {
            content: content.trim(),
            isEdited: true,
            editedAt: new Date()
        }, { new: true }).populate('userId', 'username avatarUrl verified');
        res.json({
            success: true,
            data: updatedComment,
            message: 'Comment updated successfully'
        });
    }
    catch (error) {
        console.error('Error editing comment:', error);
        res.status(500).json({ error: 'Failed to edit comment' });
    }
};
