# Character Image Deletion Scripts - Complete Implementation

## Overview
I've created a comprehensive set of reusable scripts for deleting user character images from Cloudinary storage. These scripts follow the folder structure `username/characters/characterName/images/` and provide multiple execution methods with extensive safety features.

## 🗂️ Files Created

### 1. **`server/scripts/deleteUserCharacterImages.ts`**
- **TypeScript version** with full type safety
- **Class-based architecture** for reusability
- **Comprehensive error handling** and logging
- **Database integration** for user verification

### 2. **`server/scripts/deleteUserCharacterImages.js`**
- **JavaScript version** for direct execution
- **No compilation required** - runs immediately
- **Identical functionality** to TypeScript version
- **Easier deployment** and execution

### 3. **`server/scripts/deleteCharacterImages.sh`**
- **Shell script wrapper** for easy execution
- **Environment variable validation** and loading
- **Colored output** for better readability
- **Automatic dependency checking**

### 4. **`server/scripts/README_CharacterImageDeletion.md`**
- **Comprehensive documentation** with examples
- **Troubleshooting guide** and common issues
- **Technical details** and customization options
- **Safety features** and best practices

### 5. **`package.json` Updates**
- **NPM scripts** for easier access:
  - `npm run delete-character-images` - Run JavaScript version
  - `npm run delete-character-images:shell` - Run shell script

## 🚀 Usage Methods

### Method 1: Shell Script (Recommended)
```bash
# Make executable (first time only)
chmod +x server/scripts/deleteCharacterImages.sh

# List characters safely
./server/scripts/deleteCharacterImages.sh --username=john --list-only

# Delete specific character images
./server/scripts/deleteCharacterImages.sh --username=john --character=animeGirl

# Delete all character images for a user
./server/scripts/deleteCharacterImages.sh --username=john --all-characters
```

### Method 2: NPM Scripts
```bash
# Using npm scripts
npm run delete-character-images -- --username=john --character=animeGirl
npm run delete-character-images:shell -- --username=john --all-characters
```

### Method 3: Direct Node.js Execution
```bash
# Direct execution
node server/scripts/deleteUserCharacterImages.js --username=john --character=animeGirl
```

## 🛡️ Safety Features

### 1. **User Verification**
- ✅ Verifies username exists in database
- ✅ Cross-references database with Cloudinary folders
- ✅ Prevents operations on non-existent users

### 2. **Confirmation System**
- ⚠️ Shows total image count before deletion
- 🔒 Requires typing "DELETE" to confirm
- 🚫 `--force` flag to skip confirmation (use with caution)

### 3. **Dry Run Mode**
- 🔍 `--dry-run` shows exactly what would be deleted
- 📊 No actual deletion occurs
- ✅ Perfect for testing and verification

### 4. **Batch Processing**
- 📦 Deletes images in batches of 10
- ⚡ Respects Cloudinary API rate limits
- 🔄 Continues processing even if some deletions fail

### 5. **Error Handling**
- 🚨 Graceful handling of API failures
- 📝 Comprehensive error logging
- 🛠️ Continues processing other characters if one fails

## 📋 Command Line Options

| Option | Description | Required |
|--------|-------------|----------|
| `--username=<username>` | The username whose images to delete | ✅ Yes |
| `--character=<name>` | Delete images for a specific character | ❌ No* |
| `--all-characters` | Delete images for all characters of the user | ❌ No* |
| `--list-only` | List characters without deleting (safe mode) | ❌ No* |
| `--dry-run` | Show what would be deleted without actually deleting | ❌ No |
| `--force` | Skip confirmation prompts | ❌ No |
| `--help`, `-h` | Show help message | ❌ No |

*Note: You must specify either `--character`, `--all-characters`, or `--list-only`

## 🔧 Technical Implementation

### **Cloudinary Integration**
- Uses Cloudinary Admin API for folder operations
- Follows the structure: `username/characters/characterName/images/`
- Batch deletion to respect API rate limits
- Automatic folder cleanup for empty directories

### **Database Integration**
- Connects to MongoDB using your app's configuration
- Verifies user existence before proceeding
- Cross-references database characters with Cloudinary folders
- Proper connection management and cleanup

### **Environment Variables**
- Automatically loads from `.env` file
- Required variables:
  - `CLOUDINARY_CLOUD_NAME`
  - `CLOUDINARY_API_KEY`
  - `CLOUDINARY_API_SECRET`

### **Error Handling**
- Comprehensive try-catch blocks
- Detailed error logging with context
- Graceful degradation for partial failures
- User-friendly error messages

## 📊 Example Output

### **Safe Listing Mode**
```
🚀 Starting Character Image Deletion Script
============================================================
📋 Options: { username: 'john', listOnly: true }
✅ Cloudinary configuration verified
✅ Database connected
✅ User verified: john (ID: 507f1f77bcf86cd799439011)

🔍 Listing characters for user: john
📊 Database characters: 3
☁️  Cloudinary characters: 3

📋 Database Characters:
  - Anime Girl (ID: 507f1f77bcf86cd799439012)
  - Fantasy Warrior (ID: 507f1f77bcf86cd799439013)
  - Sci-Fi Robot (ID: 507f1f77bcf86cd799439014)

☁️  Cloudinary Characters:
  - Anime Girl
  - Fantasy Warrior
  - Sci-Fi Robot

✅ Character listing completed
```

### **Actual Deletion**
```
🗑️  Processing character: Anime Girl
  📸 Found 15 images in john/characters/Anime Girl/images
  ✅ Deleted batch 1: 10 images
  ✅ Deleted batch 2: 5 images
  🎯 Successfully deleted 15/15 images for Anime Girl
  🗂️  Deleted empty folder: john/characters/Anime Girl

✅ DELETION COMPLETED
📊 Deleted 45 images from 3 character(s)
============================================================
```

## ⚠️ Important Safety Notes

### **1. Irreversible Operation**
- **DELETED IMAGES CANNOT BE RECOVERED**
- Always use `--dry-run` first to verify what will be deleted
- Consider backing up important images before deletion

### **2. Confirmation Required**
- Script requires typing "DELETE" to confirm (unless `--force` is used)
- Shows total image count before proceeding
- Prevents accidental deletions

### **3. Database Consistency**
- Script only deletes from Cloudinary storage
- Database records are not automatically updated
- You may need to clean up database entries separately

## 🚨 Troubleshooting

### **Common Issues & Solutions**

#### **Environment Variables Missing**
```bash
❌ Missing required Cloudinary environment variables
```
**Solution**: Ensure your `.env` file contains all required variables

#### **User Not Found**
```bash
❌ User 'john' not found in database
```
**Solution**: Verify the username exists and is spelled correctly

#### **Cloudinary Configuration Error**
```bash
❌ Cloudinary is not properly configured
```
**Solution**: Check your Cloudinary credentials and ensure they're valid

#### **Database Connection Failed**
```bash
❌ Failed to connect to database
```
**Solution**: Verify your database connection settings and ensure the database is running

## 🔄 Workflow Recommendations

### **1. Always Start with Safe Mode**
```bash
# First, list what exists
./deleteCharacterImages.sh --username=john --list-only
```

### **2. Use Dry Run for Verification**
```bash
# See exactly what would be deleted
./deleteCharacterImages.sh --username=john --all-characters --dry-run
```

### **3. Proceed with Caution**
```bash
# Only after verification, proceed with deletion
./deleteCharacterImages.sh --username=john --all-characters
```

## 📚 Advanced Usage

### **Programmatic Integration**
```javascript
const CharacterImageDeleter = require('./deleteUserCharacterImages.js');

const deleter = new CharacterImageDeleter();
await deleter.run();
```

### **Customization Options**
- Modify batch sizes in `deleteCharacterImages()`
- Add custom logging or notifications
- Integrate with other systems or APIs
- Customize error handling and reporting

## 🎯 Use Cases

### **1. User Account Cleanup**
- Delete all images when a user deletes their account
- Clean up abandoned character images
- Free up Cloudinary storage space

### **2. Character Management**
- Remove images for specific characters
- Clean up test or temporary characters
- Manage storage quotas

### **3. Development & Testing**
- Clean up test data
- Reset development environments
- Manage staging vs production data

## 🤝 Contributing

If you find bugs or want to add features:
1. Test thoroughly with `--dry-run` first
2. Ensure error handling is robust
3. Update documentation with any changes
4. Test on both development and production environments

## 📄 Summary

The character image deletion scripts provide:

✅ **Complete safety** with confirmation prompts and dry-run mode  
✅ **Multiple execution methods** (shell, npm, direct node)  
✅ **Comprehensive error handling** and logging  
✅ **Database integration** for user verification  
✅ **Batch processing** for efficient Cloudinary operations  
✅ **Extensive documentation** and examples  
✅ **Easy integration** with existing workflows  

These scripts are production-ready and can be safely used to manage user character images while maintaining data integrity and providing comprehensive safety measures.

---

**⚠️  Remember: Always use `--dry-run` first to verify what will be deleted!**
