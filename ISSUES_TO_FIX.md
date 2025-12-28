# SCIRE Platform - Issues to Fix

## 🔴 CRITICAL ISSUES (Blocking Core Functionality)

### 1. User ID Mismatch - AI Courses Not Showing in Dashboard
**Status**: CRITICAL
**Impact**: AI-generated courses don't appear in student dashboard
**Root Cause**: 
- Courses created with fallback ID `"user1"`
- Actual Firestore user ID is `ddDuIBT1DmBCvgi7cIhe`
- Enrollments created with `"user1"` don't match real user queries
**Location**: 
- `server/routes.ts` lines 533, 643, 629
- All endpoints using `req.user?.id || "user1"` fallback
**Fix**: Migrate all `"user1"` records to actual Firestore ID

### 2. `/api/user/enrolled-courses` Returns 500 Error
**Status**: CRITICAL
**Impact**: Dashboard cannot load user's courses
**Root Cause**: Database query fails due to user ID mismatch
**Location**: `server/routes.ts` lines 531-591
**Fix**: Resolve user ID mismatch first, then test query

### 3. `/api/user/stats` Returns 500 Error  
**Status**: CRITICAL
**Impact**: Dashboard shows 0 for all stats
**Root Cause**: Likely same user ID mismatch issue
**Location**: `server/routes.ts` lines 577-585
**Fix**: Resolve user ID mismatch

### 4. Course Detail Pages Not Loading
**Status**: HIGH
**Impact**: Users cannot view individual course content
**Root Cause**: Unknown - needs investigation
**Location**: `client/src/pages/course-detail.tsx`
**Fix**: Test and debug course detail page

## 🟡 HIGH PRIORITY ISSUES

### 5. Inconsistent User ID Usage
**Status**: HIGH
**Impact**: Creates confusion between Clerk ID vs Firestore ID
**Root Cause**: 
- Clerk returns: `user_37O9TYkDpvQOanKA5tgGh0nYtLi`
- Firestore creates: `ddDuIBT1DmBCvgi7cIhe`
- Fallback uses: `"user1"`
**Location**: Throughout backend routes
**Fix**: Standardize on ONE user ID system

### 6. Hardcoded Fallback User IDs
**Status**: HIGH
**Impact**: Creates orphaned data, wrong user associations
**Instances**: 
- `req.user?.id || "user1"` appears 10+ times in routes
**Location**: `server/routes.ts` (multiple endpoints)
**Fix**: Remove fallbacks or use proper authentication requirement

### 7. Migration Script Fails - Firebase Auth Issue
**Status**: HIGH
**Impact**: Cannot auto-migrate data
**Error**: `No FIREBASE_SERVICE_ACCOUNT found`
**Location**: `server/fix-user-courses.ts`
**Fix**: Fix Firebase initialization or use alternative method

## 🟢 MEDIUM PRIORITY ISSUES

### 8. Public Courses Filter Not Working Correctly
**Status**: MEDIUM
**Impact**: AI courses might leak into public browse
**Root Cause**: Filtering by `!course.isPersonalized`
**Location**: `server/routes.ts` lines 20-32
**Issue**: Need to verify filter works correctly

### 9. Missing Course Visibility on Course Detail Pages
**Status**: MEDIUM
**Impact**: Course access broken
**Location**: Course detail page routing
**Fix**: Debug why courses can't be viewed

### 10. No Error Handling for Missing Enrollments
**Status**: MEDIUM
**Impact**: Users see generic 500 errors
**Location**: Multiple endpoints return generic error messages
**Fix**: Add specific error messages and better logging

## 🔵 LOW PRIORITY / ENHANCEMENT

### 11. Excessive Console Logging
**Status**: LOW
**Impact**: Log clutter during debugging
**Location**: Added debug logs in `server/routes.ts`
**Fix**: Remove debug logs after fixing critical issues

### 12. Missing Course Generation Status Updates
**Status**: LOW
**Impact**: Users don't see real-time generation progress
**Location**: Course generation logic
**Fix**: Implement WebSocket or polling for status updates

### 13. No Retry Logic for AI Generation
**Status**: LOW
**Impact**: Failed generation requires manual retry
**Location**: `server/gemini.ts`
**Fix**: Add retry logic with exponential backoff

## IMMEDIATE ACTION PLAN

1. ✅ Fix User ID mismatch (migrate "user1" → actual Firestore ID)
2. ✅ Test `/api/user/enrolled-courses` after migration
3. ✅ Test course detail page access
4. ✅ Verify AI courses appear in dashboard
5. ⏭️ Remove hardcoded "user1" fallbacks
6. ⏭️ Add proper authentication requirements
7. ⏭️ Clean up debug logging
