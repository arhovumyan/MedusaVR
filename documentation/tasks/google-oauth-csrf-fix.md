# Production Google OAuth CSRF Error Fix Plan

Created: 2025-08-08

## Problem Analysis
**Issue**: Google OAuth endpoint `/api/auth/google` is failing in production with "invalid csrf token" error
**Root Cause**: CSRF exclusion logic in `server/app.ts` is not properly excluding the Google OAuth endpoint in production environment
**Impact**: Users cannot sign in with Google OAuth in production

## Current State Analysis
- Current CSRF exclusion uses `req.path.includes('/google')` and `req.path.includes('/oauth/google')`
- The endpoint is `/api/auth/google` but the path being checked might not match correctly
- Production environment may have different path resolution than development

## Solution Plan

### Phase 1: Analyze Current CSRF Logic ✅
- [x] Read current CSRF exclusion logic in server/app.ts
- [x] Understand the path matching issue

### Phase 2: Fix CSRF Exclusion Logic ✅
- [x] Update CSRF exclusion to use more robust path matching
- [x] Use regex pattern to match `/google` at end of path
- [x] Test the logic to ensure it works for all path variations

### Phase 3: Security Validation ✅
- [x] Ensure the fix doesn't introduce security vulnerabilities
- [x] Verify other CSRF-protected endpoints remain protected
- [x] Document the security implications

### Phase 4: Deploy and Test
- [ ] Rebuild Docker containers with the fix
- [ ] Test Google OAuth in development environment
- [ ] Prepare for production deployment
- [ ] Document the changes

## Security Considerations
- Google OAuth should not require CSRF protection as it uses secure token exchange
- Other POST endpoints (login, register, logout) must remain CSRF protected
- Exclusion logic must be precise to avoid accidentally excluding other endpoints

## Success Criteria
- Google OAuth works in both development and production
- No security vulnerabilities introduced
- Other authentication endpoints remain CSRF protected
- Clean, maintainable code solution
