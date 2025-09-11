# Cloudinary to Bunny.net Migration Guide

This guide explains how to migrate all your data from Cloudinary to Bunny.net CDN storage.

## Prerequisites

Before starting the migration, ensure you have the following environment variables set in your `.env` file:

### Cloudinary Configuration
```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### Bunny.net Configuration
```env
BUNNY_ACCESS_KEY=your_bunny_access_key
BUNNY_STORAGE_ZONE_NAME=your_storage_zone_name
BUNNY_STORAGE_API_HOST=https://storage.bunnycdn.com
```

## Migration Process

### Step 1: Quick Test
First, run a quick test to ensure everything is configured correctly:

```bash
npm run migrate:test
```

This will:
- Verify your configuration
- List all folders in Cloudinary
- Test migration on the first folder (first 5 files only)

### Step 2: Test Specific Folder
Test migration on a specific folder before doing the full migration:

```bash
npm run migrate test <folder-name>
```

Example:
```bash
npm run migrate test john_doe
```

This tests migration of the first 5 files in the folder to ensure everything works.

### Step 3: Migrate Single Folder
If the test is successful, migrate a complete folder:

```bash
npm run migrate migrate <folder-name>
```

Example:
```bash
npm run migrate migrate john_doe
```

### Step 4: Migrate All Folders
Once you're confident everything works, migrate all folders:

```bash
npm run migrate migrate
```

⚠️ **Warning**: This will migrate ALL your Cloudinary data. Ensure you have sufficient Bunny.net storage space.

## Available Commands

| Command | Description |
|---------|-------------|
| `npm run migrate:test` | Quick configuration test |
| `npm run migrate list` | List all folders in Cloudinary |
| `npm run migrate test <folder>` | Test migration for specific folder |
| `npm run migrate migrate <folder>` | Migrate specific folder |
| `npm run migrate migrate` | Migrate ALL folders |
| `npm run migrate help` | Show help message |

## Migration Features

### 🔄 **Progressive Migration**
- Tests with a small subset first
- Batch processing to avoid overwhelming services
- Real-time progress monitoring

### 🛡️ **Error Handling**
- Retry mechanism for failed downloads/uploads
- Detailed error reporting
- Graceful handling of network issues

### 📊 **Progress Tracking**
- Real-time progress updates
- Success/failure statistics
- Total size and time tracking

### 🏗️ **Folder Structure Preservation**
- Maintains exact same folder structure
- Preserves file names and formats
- Creates necessary directories in Bunny.net

## What Gets Migrated

The migration process transfers:

- **User Folders**: All user directories (usernames)
- **Subfolder Structure**: 
  - `avatar/` - User avatar images
  - `characters/` - Character creation images
  - `premade_characters/` - Character interaction images
- **File Formats**: All image formats (JPG, PNG, GIF, WebP, etc.)
- **File Names**: Original filenames preserved
- **Metadata**: File sizes tracked for verification

## Migration Flow

```
Cloudinary                    Bunny.net
├── user1/                   ├── user1/
│   ├── avatar/              │   ├── avatar/
│   ├── characters/          │   ├── characters/
│   └── premade_characters/  │   └── premade_characters/
├── user2/           ───►    ├── user2/
│   ├── avatar/              │   ├── avatar/
│   ├── characters/          │   ├── characters/
│   └── premade_characters/  │   └── premade_characters/
└── ...                      └── ...
```

## Performance Considerations

- **Batch Size**: Processes 5 files concurrently
- **Rate Limiting**: 1-second delays between batches
- **Timeout Handling**: 30-second timeout per file
- **Memory Efficient**: Streams files without storing in memory

## Troubleshooting

### Configuration Issues
```bash
❌ Services not configured properly
```
**Solution**: Check all required environment variables are set.

### Network Issues
```bash
❌ Failed to download file from Cloudinary
```
**Solution**: Check internet connection and Cloudinary API limits.

### Storage Issues
```bash
❌ Bunny CDN upload failed
```
**Solution**: Check Bunny.net storage limits and access key permissions.

### Large Files
If you have very large files (>100MB), consider:
- Increasing timeout values in the service
- Running migration during off-peak hours
- Monitoring Bunny.net bandwidth limits

## Verification

After migration, verify the transfer by:

1. **Check File Counts**: Compare file counts in both services
2. **Spot Check URLs**: Test a few migrated file URLs
3. **Size Verification**: Compare total storage used
4. **Application Testing**: Test your application with Bunny.net URLs

## Safety Notes

- ✅ **Non-Destructive**: Original Cloudinary files remain untouched
- ✅ **Resumable**: Can re-run failed migrations
- ✅ **Testable**: Always test before full migration
- ✅ **Cancellable**: Use Ctrl+C to stop migration safely

## Support

If you encounter issues:

1. Check the console output for specific error messages
2. Verify environment variables are correct
3. Test with a small folder first
4. Check Bunny.net dashboard for storage usage
5. Verify Cloudinary API access

## Example Output

```
🚀 Cloudinary to Bunny.net Migration Tool
=========================================

✅ Configuration validated
📁 Found 15 user folders to migrate

📁 Processing folder: john_doe
Found 45 resources in john_doe
Migrating all 45 files...
✅ [1/45] avatar_123.jpg
✅ [2/45] character_456.png
...
📊 Progress: 45/45 (100.0%) | Success: 100.0%

🎉 Migration completed successfully for john_doe!
   ✅ Successful: 45/45
   ❌ Failed: 0/45
   📁 Total size: 12.5 MB
   ⏱️  Duration: 2.3 minutes
```
