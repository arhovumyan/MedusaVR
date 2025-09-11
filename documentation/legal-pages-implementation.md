# Legal Pages Implementation - Todo List

## Task Overview
Create a legal pages system with routes like /legal, /legal/community-guidelines, etc., with a main legal page that matches the UI design shown in the screenshot.

## Implementation Plan

### Task 1: Create Main Legal Page Component ❌
- [ ] **File**: `/client/src/pages/Legal/LegalPage.tsx`
- [ ] **Action**: Create main legal hub page with grid layout
- [ ] **Requirements**: 
  - Match the dark UI design from screenshot
  - Grid layout with cards for each policy
  - Navigation to individual policy pages
  - Responsive design

### Task 2: Create Individual Legal Policy Components ❌
- [ ] **Files**: Create components for each policy in `/client/src/pages/Legal/`
- [ ] **Action**: Create individual page components for each legal document
- [ ] **Requirements**: 
  - CommunityGuidelines.tsx
  - TermsOfUse.tsx
  - PrivacyPolicy.tsx
  - UnderagePolicy.tsx
  - ContentRemovalPolicy.tsx
  - BlockedContentPolicy.tsx
  - DmcaPolicy.tsx
  - ComplaintPolicy.tsx
  - Section2257Exemption.tsx

### Task 3: Set Up Legal Routes ❌
- [ ] **File**: Update routing configuration
- [ ] **Action**: Add legal routes to the application router
- [ ] **Requirements**: 
  - /legal - main legal page
  - /legal/community-guidelines
  - /legal/terms-of-use
  - /legal/privacy-policy
  - /legal/underage-policy
  - /legal/content-removal-policy
  - /legal/blocked-content-policy
  - /legal/dmca-policy
  - /legal/complaint-policy
  - /legal/2257-exemption

### Task 4: Create Legal Page Styling ❌
- [ ] **File**: `/client/src/pages/Legal/Legal.css` or styled components
- [ ] **Action**: Style the legal pages to match the dark theme
- [ ] **Requirements**: 
  - Dark background (#1a1a1a or similar)
  - Card-based layout for main page
  - Clean typography for policy pages
  - Responsive design
  - Consistent with app theme

### Task 5: Add Navigation Links ❌
- [ ] **File**: Update main navigation if needed
- [ ] **Action**: Add legal page access to app navigation
- [ ] **Requirements**: 
  - Footer links to legal pages
  - Proper breadcrumb navigation
  - Back to legal hub functionality

## Security Considerations
- Ensure all legal content is properly rendered
- Prevent XSS through proper content sanitization
- Maintain responsive design for mobile access
- Fast loading times for legal compliance

## Testing Plan
- Test all legal page routes
- Verify responsive design on mobile/desktop
- Check navigation between legal pages
- Ensure content loads correctly from markdown files
