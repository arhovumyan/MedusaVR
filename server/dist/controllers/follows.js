import { FollowModel } from "../db/models/FollowsModel.js";
import { UserModel } from "../db/models/UserModel.js";
import mongoose from "mongoose";
// Follow a user
export const followUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const followerId = req.userId;
        // Can't follow yourself
        if (userId === followerId) {
            return res.status(400).json({ error: 'You cannot follow yourself' });
        }
        // Check if target user exists
        const targetUser = await UserModel.findById(userId);
        if (!targetUser) {
            return res.status(404).json({ error: 'User not found' });
        }
        // Check if already following
        const existingFollow = await FollowModel.findOne({
            followerId,
            followedId: userId
        });
        if (existingFollow) {
            return res.status(400).json({ error: 'Already following this user' });
        }
        // Create follow relationship
        await FollowModel.create({
            followerId,
            followedId: userId
        });
        // Update follow counts
        await UserModel.findByIdAndUpdate(followerId, { $inc: { followingCount: 1 } });
        await UserModel.findByIdAndUpdate(userId, { $inc: { followersCount: 1 } });
        res.json({
            success: true,
            message: 'Successfully followed user'
        });
    }
    catch (error) {
        console.error('Error following user:', error);
        res.status(500).json({ error: 'Failed to follow user' });
    }
};
// Unfollow a user
export const unfollowUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const followerId = req.userId;
        // Find and delete the follow relationship
        const follow = await FollowModel.findOneAndDelete({
            followerId,
            followedId: userId
        });
        if (!follow) {
            return res.status(400).json({ error: 'Not following this user' });
        }
        // Update follow counts
        await UserModel.findByIdAndUpdate(followerId, { $inc: { followingCount: -1 } });
        await UserModel.findByIdAndUpdate(userId, { $inc: { followersCount: -1 } });
        res.json({
            success: true,
            message: 'Successfully unfollowed user'
        });
    }
    catch (error) {
        console.error('Error unfollowing user:', error);
        res.status(500).json({ error: 'Failed to unfollow user' });
    }
};
// Get user's followers
export const getFollowers = async (req, res) => {
    try {
        const { userId } = req.params;
        const { page = 1, limit = 20 } = req.query;
        // Validate ObjectId format - return empty array for invalid IDs
        if (!mongoose.isValidObjectId(userId)) {
            console.log('❌ getFollowers: Invalid user ID format:', userId);
            return res.json({
                success: true,
                data: [],
                pagination: {
                    page: 1,
                    limit: 20,
                    total: 0,
                    pages: 0
                }
            });
        }
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;
        // Get followers with user info
        const followers = await FollowModel.find({ followedId: userId })
            .populate('followerId', 'username avatarUrl verified bio followersCount followingCount')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNum);
        const totalFollowers = await FollowModel.countDocuments({ followedId: userId });
        res.json({
            success: true,
            data: followers.map(f => f.followerId),
            pagination: {
                page: pageNum,
                limit: limitNum,
                total: totalFollowers,
                pages: Math.ceil(totalFollowers / limitNum)
            }
        });
    }
    catch (error) {
        console.error('Error fetching followers:', error);
        res.status(500).json({ error: 'Failed to fetch followers' });
    }
};
// Get user's following
export const getFollowing = async (req, res) => {
    try {
        const { userId } = req.params;
        const { page = 1, limit = 20 } = req.query;
        // Validate ObjectId format - return empty array for invalid IDs
        if (!mongoose.isValidObjectId(userId)) {
            console.log('❌ getFollowing: Invalid user ID format:', userId);
            return res.json({
                success: true,
                data: [],
                pagination: {
                    page: 1,
                    limit: 20,
                    total: 0,
                    pages: 0
                }
            });
        }
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;
        // Get following with user info
        const following = await FollowModel.find({ followerId: userId })
            .populate('followedId', 'username avatarUrl verified bio followersCount followingCount')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNum);
        const totalFollowing = await FollowModel.countDocuments({ followerId: userId });
        res.json({
            success: true,
            data: following.map(f => f.followedId),
            pagination: {
                page: pageNum,
                limit: limitNum,
                total: totalFollowing,
                pages: Math.ceil(totalFollowing / limitNum)
            }
        });
    }
    catch (error) {
        console.error('Error fetching following:', error);
        res.status(500).json({ error: 'Failed to fetch following' });
    }
};
// Check if user is following another user
export const checkFollowStatus = async (req, res) => {
    try {
        const { userId } = req.params;
        const followerId = req.userId;
        const isFollowing = await FollowModel.exists({
            followerId,
            followedId: userId
        });
        res.json({
            success: true,
            isFollowing: !!isFollowing
        });
    }
    catch (error) {
        console.error('Error checking follow status:', error);
        res.status(500).json({ error: 'Failed to check follow status' });
    }
};
// Get mutual followers
export const getMutualFollowers = async (req, res) => {
    try {
        const { userId } = req.params;
        const currentUserId = req.userId;
        // Get users that both current user and target user follow
        const mutualFollows = await FollowModel.aggregate([
            {
                $match: {
                    $or: [
                        { followerId: new mongoose.Types.ObjectId(currentUserId) },
                        { followerId: new mongoose.Types.ObjectId(userId) }
                    ]
                }
            },
            {
                $group: {
                    _id: '$followedId',
                    followers: { $addToSet: '$followerId' }
                }
            },
            {
                $match: {
                    followers: {
                        $all: [
                            new mongoose.Types.ObjectId(currentUserId),
                            new mongoose.Types.ObjectId(userId)
                        ]
                    }
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'userInfo'
                }
            },
            {
                $unwind: '$userInfo'
            },
            {
                $project: {
                    _id: '$userInfo._id',
                    username: '$userInfo.username',
                    avatarUrl: '$userInfo.avatarUrl',
                    verified: '$userInfo.verified'
                }
            }
        ]);
        res.json({
            success: true,
            data: mutualFollows,
            count: mutualFollows.length
        });
    }
    catch (error) {
        console.error('Error fetching mutual followers:', error);
        res.status(500).json({ error: 'Failed to fetch mutual followers' });
    }
};
