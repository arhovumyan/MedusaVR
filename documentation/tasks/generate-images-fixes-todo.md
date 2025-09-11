# Generate Images UI Fixes & Image Naming Fix - Todo

## Problem Analysis
1. **UI Issue**: Generate-images page should be scrollable on smaller screens (when workshop is below) but not scrollable on bigger screens (when workshop is on right)
2. **Image Naming Issue**: When generating 2, 4, or 8 images at once, there's an overwriting problem in Cloudinary due to naming conflicts. Current pattern: `{UserName_characterName_image_1_0001}` where 0001 comes from RunPod and causes overwrites.

## Investigation Plan

### 1. UI Scrolling Issue Analysis
- [ ] Analyze current layout structure in GenerateImagesPage.tsx
- [ ] Check responsive design breakpoints and flex layout
- [ ] Identify why scrolling isn't working on smaller screens
- [ ] Fix responsive layout to allow scrolling when needed

### 2. Image Naming Issue Analysis 
- [ ] Examine current naming logic in EmbeddingBasedImageGenerationService.ts
- [ ] Understand how getNextBatchSequenceNumber works
- [ ] Identify the exact cause of naming conflicts
- [ ] Design better naming strategy to prevent overwrites

## Implementation Tasks

### UI Scrolling Fix
- [x] Modify GenerateImagesPage.tsx responsive layout
- [x] Ensure proper overflow handling for smaller screens
- [x] Maintain fixed layout for larger screens
- [ ] Test responsive behavior across breakpoints

### Image Naming Fix
- [ ] Implement sequential numbering that prevents overwrites
- [ ] Modify image naming to use format: `{UserName_characterName_image_SEQUENTIAL}`
- [ ] Update batch generation logic to use proper sequential numbering
- [ ] Test with multiple image generation scenarios

### Testing
- [ ] Test UI scrolling on different screen sizes
- [ ] Test image generation with 2, 4, and 8 images
- [ ] Verify no naming conflicts occur
- [ ] Rebuild and validate both fixes work

## Technical Implementation Details

### Proposed Image Naming Solution
Instead of: `{UserName_characterName_image_1_0001}` (with RunPod suffix)
Use: `{UserName_characterName_image_001}` (sequential, user-specific numbering)

### UI Layout Strategy
- Use conditional overflow classes based on screen size
- Smaller screens: Allow vertical scrolling when workshop is below
- Larger screens: Fixed height layout with workshop on right

## Notes
- Simple changes only, following CLAUDE.md principles
- Focus on preventing overwrites while maintaining performance
- Ensure UI remains responsive and functional across all devices
