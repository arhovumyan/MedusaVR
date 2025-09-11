import { Request, Response, NextFunction } from "express";
import { body, param, query, validationResult } from "express-validator";

// Custom validation middleware to handle errors
export const handleValidationErrors = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    console.warn(`⚠️  Validation failed for ${req.method} ${req.path} from IP ${req.ip}`);
    console.warn(`⚠️  Errors:`, errors.array());
    
    return res.status(400).json({
      error: "Validation failed",
      details: errors.array()
    });
  }
  
  next();
};

// User registration validation
export const validateUserRegistration = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('username')
    .isLength({ min: 3, max: 30 })
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('Username must be 3-30 characters and contain only letters, numbers, _ and -'),
  body('password')
    .isLength({ min: 8, max: 128 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must be 8-128 characters with at least one lowercase, uppercase, and number'),
  handleValidationErrors
];

// User login validation
export const validateUserLogin = [
  body('emailOrUsername')
    .isLength({ min: 1, max: 254 })
    .withMessage('Email or username is required'),
  body('password')
    .isLength({ min: 1, max: 128 })
    .withMessage('Password is required'),
  handleValidationErrors
];

// Character creation validation
export const validateCharacter = [
  body('name')
    .isLength({ min: 1, max: 100 })
    .trim()
    .escape()
    .withMessage('Character name must be 1-100 characters'),
  body('description')
    .isLength({ min: 10, max: 2000 })
    .trim()
    .withMessage('Description must be 10-2000 characters'),
  body('age')
    .isInt({ min: 18 })
    .withMessage('Character age must be 18 or above. All characters must be adults.'),
  body('persona')
    .optional()
    .isLength({ max: 1000 })
    .trim()
    .withMessage('Persona must be less than 1000 characters'),
  body('scenario')
    .optional()
    .isLength({ max: 1000 })
    .trim()
    .withMessage('Scenario must be less than 1000 characters'),
  body('category')
    .isLength({ min: 1, max: 50 })
    .trim()
    .withMessage('Category is required'),
  body('tags')
    .isArray({ min: 1, max: 10 })
    .withMessage('Tags must be an array with 1-10 items'),
  body('tags.*')
    .isLength({ min: 1, max: 30 })
    .trim()
    .withMessage('Each tag must be 1-30 characters'),
  body('isNsfw')
    .isBoolean()
    .withMessage('isNsfw must be a boolean'),
  body('isPublic')
    .isBoolean()
    .withMessage('isPublic must be a boolean'),
  handleValidationErrors
];

// Character update validation
export const validateCharacterUpdate = [
  body('name')
    .optional()
    .isLength({ min: 1, max: 100 })
    .trim()
    .escape()
    .withMessage('Character name must be 1-100 characters'),
  body('description')
    .optional()
    .isLength({ min: 10, max: 2000 })
    .trim()
    .withMessage('Description must be 10-2000 characters'),
  body('age')
    .optional()
    .isInt({ min: 18 })
    .withMessage('Character age must be 18 or above. All characters must be adults.'),
  body('persona')
    .optional()
    .isLength({ min: 10, max: 2000 })
    .trim()
    .withMessage('Persona must be 10-2000 characters'),
  body('scenario')
    .optional()
    .isLength({ max: 1000 })
    .trim()
    .withMessage('Scenario must be less than 1000 characters'),
  body('category')
    .optional()
    .isLength({ min: 1, max: 50 })
    .trim()
    .withMessage('Category must be 1-50 characters'),
  body('tags')
    .optional()
    .isArray({ max: 10 })
    .withMessage('Tags must be an array with max 10 items'),
  body('tags.*')
    .optional()
    .isLength({ min: 1, max: 30 })
    .trim()
    .withMessage('Each tag must be 1-30 characters'),
  body('isNsfw')
    .optional()
    .isBoolean()
    .withMessage('isNsfw must be a boolean'),
  body('isPublic')
    .optional()
    .isBoolean()
    .withMessage('isPublic must be a boolean'),
  handleValidationErrors
];

// Message validation
export const validateMessage = [
  body('text')
    .isLength({ min: 1, max: 4000 })
    .trim()
    .withMessage('Message must be 1-4000 characters'),
  body('stream')
    .optional()
    .isBoolean()
    .withMessage('Stream must be a boolean'),
  handleValidationErrors
];

// ID parameter validation
export const validateId = [
  param('id')
    .matches(/^[0-9a-fA-F]{24}$|^\d+$/)
    .withMessage('Invalid ID format'),
  handleValidationErrors
];

// MongoDB ObjectId validation
export const validateObjectId = [
  param('id')
    .matches(/^[0-9a-fA-F]{24}$/)
    .withMessage('Invalid ObjectId format'),
  handleValidationErrors
];

// Pagination validation
export const validatePagination = [
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('offset')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Offset must be a non-negative integer'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  handleValidationErrors
];

// Profile update validation
export const validateProfileUpdate = [
  body('displayName')
    .optional()
    .isLength({ min: 1, max: 50 })
    .trim()
    .escape()
    .withMessage('Display name must be 1-50 characters'),
  body('bio')
    .optional()
    .isLength({ max: 500 })
    .trim()
    .withMessage('Bio must be less than 500 characters'),
  body('language')
    .optional()
    .isLength({ min: 2, max: 5 })
    .matches(/^[a-z]{2}(-[A-Z]{2})?$/)
    .withMessage('Language must be a valid locale code (e.g., en, en-US)'),
  body('timezone')
    .optional()
    .isLength({ min: 1, max: 50 })
    .withMessage('Timezone must be 1-50 characters'),
  handleValidationErrors
];

// Password change validation
export const validatePasswordChange = [
  body('currentPassword')
    .isLength({ min: 1, max: 128 })
    .withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 8, max: 128 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('New password must be 8-128 characters with at least one lowercase, uppercase, and number'),
  handleValidationErrors
];

// Email validation
export const validateEmail = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  handleValidationErrors
];

// Search validation
export const validateSearch = [
  query('q')
    .isLength({ min: 1, max: 100 })
    .trim()
    .withMessage('Search query must be 1-100 characters'),
  query('type')
    .optional()
    .isIn(['character', 'user', 'all'])
    .withMessage('Search type must be character, user, or all'),
  handleValidationErrors
];

// Follow validation
export const validateFollow = [
  body('followerId')
    .matches(/^[0-9a-fA-F]{24}$/)
    .withMessage('Invalid follower ID'),
  body('followedId')
    .matches(/^[0-9a-fA-F]{24}$/)
    .withMessage('Invalid followed user ID'),
  handleValidationErrors
];

// Tag validation
export const validateTag = [
  body('name')
    .isLength({ min: 1, max: 30 })
    .trim()
    .matches(/^[a-zA-Z0-9-_\s]+$/)
    .withMessage('Tag name must be 1-30 characters and contain only letters, numbers, spaces, hyphens, and underscores'),
  body('displayName')
    .optional()
    .isLength({ min: 1, max: 50 })
    .trim()
    .withMessage('Display name must be 1-50 characters'),
  body('description')
    .optional()
    .isLength({ max: 200 })
    .trim()
    .withMessage('Description must be less than 200 characters'),
  body('category')
    .optional()
    .isLength({ min: 1, max: 30 })
    .trim()
    .withMessage('Category must be 1-30 characters'),
  body('isNSFW')
    .optional()
    .isBoolean()
    .withMessage('isNSFW must be a boolean'),
  handleValidationErrors
];

// File upload validation
export const validateFileUpload = (req: Request, res: Response, next: NextFunction) => {
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  const maxFileSize = 5 * 1024 * 1024; // 5MB
  
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  
  if (!allowedMimeTypes.includes(req.file.mimetype)) {
    return res.status(400).json({ 
      error: 'Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.' 
    });
  }
  
  if (req.file.size > maxFileSize) {
    return res.status(400).json({ 
      error: 'File too large. Maximum size is 5MB.' 
    });
  }
  
  // Additional security: Check file signature
  const fileSignature = req.file.buffer?.toString('hex', 0, 4);
  const validSignatures = {
    'ffd8ffe0': 'jpeg',
    'ffd8ffe1': 'jpeg', 
    'ffd8ffe2': 'jpeg',
    '89504e47': 'png',
    '47494638': 'gif',
    '52494646': 'webp'
  };
  
  if (fileSignature && !Object.keys(validSignatures).includes(fileSignature)) {
    return res.status(400).json({ 
      error: 'Invalid file signature. File may be corrupted or not a valid image.' 
    });
  }
  
  next();
};

// Rate limiting validation
export const validateRateLimit = (windowMs: number, maxRequests: number, message: string) => {
  const requests = new Map<string, number[]>();
  
  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || 'unknown';
    const now = Date.now();
    
    if (!requests.has(ip)) {
      requests.set(ip, []);
    }
    
    const userRequests = requests.get(ip)!;
    const recentRequests = userRequests.filter(timestamp => now - timestamp < windowMs);
    
    if (recentRequests.length >= maxRequests) {
      return res.status(429).json({ error: message });
    }
    
    recentRequests.push(now);
    requests.set(ip, recentRequests);
    
    next();
  };
};
