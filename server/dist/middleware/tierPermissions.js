import { UserModel } from '../db/models/UserModel.js';
export const TIER_PERMISSIONS = {
    free: {
        canCreateCharacters: false,
        canGenerateImages: false,
        canAccessPremiumFeatures: false,
        charactersLimit: 0,
        imagesPerMonth: 0
    },
    artist: {
        canCreateCharacters: true,
        canGenerateImages: true,
        canAccessPremiumFeatures: false,
        charactersLimit: 10,
        imagesPerMonth: 50
    },
    virtuoso: {
        canCreateCharacters: true,
        canGenerateImages: true,
        canAccessPremiumFeatures: true,
        charactersLimit: 50,
        imagesPerMonth: 200
    },
    icon: {
        canCreateCharacters: true,
        canGenerateImages: true,
        canAccessPremiumFeatures: true,
        charactersLimit: -1, // unlimited
        imagesPerMonth: -1 // unlimited
    }
};
export const SUBSCRIPTION_PLANS = {
    artist: {
        name: 'Artist',
        price: 9.99,
        currency: 'USD',
        interval: 'month',
        description: 'Create characters and generate images',
        features: [
            'Create up to 10 characters',
            'Generate 50 images per month',
            'Access to all character tools',
            'Priority support'
        ]
    },
    virtuoso: {
        name: 'Virtuoso',
        price: 19.99,
        currency: 'USD',
        interval: 'month',
        description: 'Advanced creation tools and premium features',
        features: [
            'Create up to 50 characters',
            'Generate 200 images per month',
            'Access to premium art styles',
            'Advanced customization tools',
            'Priority support'
        ]
    },
    icon: {
        name: 'Icon',
        price: 39.99,
        currency: 'USD',
        interval: 'month',
        description: 'Unlimited creation and all features',
        features: [
            'Unlimited character creation',
            'Unlimited image generation',
            'All premium features',
            'Beta access to new features',
            'Priority support',
            'Custom branding options'
        ]
    }
};
export const requireTier = (requiredTier) => {
    return async (req, res, next) => {
        try {
            const userId = req.userId;
            if (!userId) {
                return res.status(401).json({ error: 'Authentication required' });
            }
            const user = await UserModel.findById(userId);
            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }
            const userTier = user.tier || 'free';
            const tierHierarchy = ['free', 'artist', 'virtuoso', 'icon'];
            const userTierIndex = tierHierarchy.indexOf(userTier);
            const requiredTierIndex = tierHierarchy.indexOf(requiredTier);
            if (userTierIndex < requiredTierIndex) {
                return res.status(403).json({
                    error: 'Insufficient tier level',
                    currentTier: userTier,
                    requiredTier: requiredTier,
                    upgradeRequired: true,
                    availablePlans: Object.keys(SUBSCRIPTION_PLANS).filter(plan => tierHierarchy.indexOf(plan) >= requiredTierIndex)
                });
            }
            // Add tier info to request for use in controllers
            req.userTier = userTier;
            req.tierPermissions = TIER_PERMISSIONS[userTier];
            next();
        }
        catch (error) {
            console.error('Error checking tier permissions:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    };
};
export const checkPermission = (permission) => {
    return async (req, res, next) => {
        try {
            const userId = req.userId;
            if (!userId) {
                return res.status(401).json({ error: 'Authentication required' });
            }
            const user = await UserModel.findById(userId);
            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }
            const userTier = user.tier || 'free';
            const permissions = TIER_PERMISSIONS[userTier];
            if (!permissions[permission]) {
                return res.status(403).json({
                    error: `Permission denied: ${permission}`,
                    currentTier: userTier,
                    upgradeRequired: true,
                    availablePlans: Object.keys(SUBSCRIPTION_PLANS)
                });
            }
            // Add tier info to request for use in controllers
            req.userTier = userTier;
            req.tierPermissions = permissions;
            next();
        }
        catch (error) {
            console.error('Error checking permissions:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    };
};
