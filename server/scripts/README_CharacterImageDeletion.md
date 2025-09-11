# Character Image Deletion Scripts

This directory contains comprehensive scripts for deleting user character images from Cloudinary storage. The scripts follow the folder structure: `username/characters/characterName/images/`

## 🗂️ Files Overview

- **`deleteUserCharacterImages.ts`** - TypeScript version with full type safety
- **`deleteUserCharacterImages.js`** - JavaScript version for direct execution
- **`deleteCharacterImages.sh`** - Shell script wrapper for easy execution

## 🚀 Quick Start

### Prerequisites

1. **Environment Variables**: Create a `.env` file in the project root with:
   ```bash
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   ```

2. **Dependencies**: Ensure all Node.js dependencies are installed:
   ```bash
   npm install
   ```

3. **Database Access**: The script needs access to your MongoDB database (configured in your app)

### Basic Usage

#### Using the Shell Script (Recommended)
```bash
# Make executable
chmod +x server/scripts/deleteCharacterImages.sh

# List characters for a user (safe mode)
./server/scripts/deleteCharacterImages.sh --username=john --list-only

# Delete images for a specific character
./server/scripts/deleteCharacterImages.sh --username=john --character=animeGirl

# Delete all character images for a user
./server/scripts/deleteCharacterImages.sh --username=john --all-characters
```

#### Using Node.js Directly
```bash
# List characters for a user (safe mode)
node server/scripts/deleteUserCharacterImages.js --username=john --list-only

# Delete images for a specific character
node server/scripts/deleteUserCharacterImages.js --username=john --character=animeGirl

# Delete all character images for a user
node server/scripts/deleteUserCharacterImages.js --username=john --all-characters
```

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

## 🔍 Examples

### Safe Operations (No Deletion)

```bash
# List all characters for a user
./deleteCharacterImages.sh --username=john --list-only

# Dry run to see what would be deleted
./deleteCharacterImages.sh --username=john --all-characters --dry-run
```

### Delete Specific Character

```bash
# Delete all images for a specific character
./deleteCharacterImages.sh --username=john --character=animeGirl

# Force delete without confirmation
./deleteCharacterImages.sh --username=john --character=animeGirl --force
```

### Delete All Characters

```bash
# Delete all character images for a user
./deleteCharacterImages.sh --username=john --all-characters

# Dry run first to see what would be deleted
./deleteCharacterImages.sh --username=john --all-characters --dry-run
```

## 🛡️ Safety Features

### 1. **User Verification**
- Verifies the username exists in the database before proceeding
- Ensures you're working with a valid user account

### 2. **Confirmation Prompts**
- Shows total image count before deletion
- Requires typing "DELETE" to confirm (unless `--force` is used)
- Prevents accidental deletions

### 3. **Dry Run Mode**
- Use `--dry-run` to see exactly what would be deleted
- No actual deletion occurs in dry run mode
- Perfect for testing and verification

### 4. **Batch Processing**
- Deletes images in batches of 10 to avoid overwhelming Cloudinary
- Continues processing even if some deletions fail
- Provides detailed progress reporting

### 5. **Error Handling**
- Gracefully handles Cloudinary API errors
- Continues processing other characters if one fails
- Comprehensive error logging

## 📊 Output Examples

### List Characters (Safe Mode)
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

### Dry Run Mode
```
🎯 Processing 3 character(s): Anime Girl, Fantasy Warrior, Sci-Fi Robot

⚠️  WARNING: This will delete 45 images across 3 character(s)
Type "DELETE" to confirm:
> DELETE

🗑️  Processing character: Anime Girl
  📸 Found 15 images in john/characters/Anime Girl/images
  🔍 DRY RUN: Would delete 15 images
    - john/characters/Anime Girl/images/image_001
    - john/characters/Anime Girl/images/image_002
    ...

🔍 DRY RUN COMPLETED
📊 Would delete 45 images from 3 character(s)
============================================================
```

### Actual Deletion
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

## 🔧 Technical Details

### Folder Structure
The script follows Cloudinary's folder structure:
```
username/
├── characters/
│   ├── characterName1/
│   │   └── images/
│   │       ├── image1.jpg
│   │       ├── image2.jpg
│   │       └── ...
│   └── characterName2/
│       └── images/
│           ├── image1.jpg
│           └── ...
```

### Database Integration
- Connects to MongoDB using your app's configuration
- Verifies user existence before proceeding
- Can cross-reference database characters with Cloudinary folders

### Cloudinary API Usage
- Uses Cloudinary's Admin API for folder operations
- Batch deletion to avoid rate limiting
- Proper error handling for API failures

### Batch Processing
- Images are deleted in batches of 10
- Each batch is processed with `Promise.all()`
- Failed batches are logged but don't stop the process

## ⚠️ Important Notes

### 1. **Irreversible Operation**
- **DELETED IMAGES CANNOT BE RECOVERED**
- Always use `--dry-run` first to verify what will be deleted
- Consider backing up important images before deletion

### 2. **Cloudinary Limits**
- Cloudinary has API rate limits
- The script processes images in batches to respect these limits
- Large deletions may take time to complete

### 3. **Database Consistency**
- The script only deletes from Cloudinary storage
- Database records are not automatically updated
- You may need to clean up database entries separately

### 4. **Folder Cleanup**
- Empty character folders are automatically removed
- This helps maintain a clean folder structure
- Folders with remaining resources are left intact

## 🚨 Troubleshooting

### Common Issues

#### 1. **Environment Variables Missing**
```bash
❌ Missing required Cloudinary environment variables
```
**Solution**: Ensure your `.env` file contains all required variables

#### 2. **User Not Found**
```bash
❌ User 'john' not found in database
```
**Solution**: Verify the username exists and is spelled correctly

#### 3. **Cloudinary Configuration Error**
```bash
❌ Cloudinary is not properly configured
```
**Solution**: Check your Cloudinary credentials and ensure they're valid

#### 4. **Database Connection Failed**
```bash
❌ Failed to connect to database
```
**Solution**: Verify your database connection settings and ensure the database is running

### Debug Mode
For troubleshooting, you can add more verbose logging by modifying the script or checking the console output for detailed error messages.

## 📚 Advanced Usage

### Programmatic Usage
The scripts can also be imported and used programmatically:

```javascript
const CharacterImageDeleter = require('./deleteUserCharacterImages.js');

const deleter = new CharacterImageDeleter();
await deleter.run();
```

### Customization
The scripts are designed to be easily customizable:
- Modify batch sizes in `deleteCharacterImages()`
- Add custom logging or notifications
- Integrate with other systems or APIs

## 🤝 Contributing

If you find bugs or want to add features:
1. Test thoroughly with `--dry-run` first
2. Ensure error handling is robust
3. Update this README with any changes
4. Test on both development and production environments

## 📄 License

These scripts are part of the MedusaVR project and follow the same licensing terms.

---

**⚠️  Remember: Always use `--dry-run` first to verify what will be deleted!**
