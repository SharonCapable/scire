---
description: Transform EduAccess to SCIRE with Gemini & Google Auth
---

# SCIRE Transformation Plan

## Phase 1: Environment Setup & API Configuration

1. Create `.env` file with required API keys:
   - `GEMINI_API_KEY` - Google Gemini API key
   - `GOOGLE_CLIENT_ID` - Google OAuth client ID
   - `GOOGLE_CLIENT_SECRET` - Google OAuth client secret
   - `DATABASE_URL` - PostgreSQL connection string
   - `SESSION_SECRET` - Session encryption key

2. Install required dependencies:
```bash
npm install @google/generative-ai passport-google-oauth20 @types/passport-google-oauth20
npm uninstall openai
```

## Phase 2: Database Schema Updates

1. Update `shared/schema.ts` to add Google OAuth fields:
   - Add `googleId`, `email`, `name`, `picture` to users table
   - Make `password` optional (for Google OAuth users)
   - Add `provider` field ('local' or 'google')

2. Push schema changes to database:
```bash
npm run db:push
```

## Phase 3: Backend Updates

1. **Replace OpenAI with Gemini** (`server/openai.ts` → `server/gemini.ts`):
   - Replace OpenAI client with Google Generative AI
   - Update all AI functions to use Gemini API
   - Use `gemini-1.5-pro` model

2. **Add Google OAuth Strategy** (`server/auth.ts`):
   - Configure Passport Google OAuth 2.0
   - Add callback routes
   - Handle user creation/login

3. **Update Routes** (`server/routes.ts`):
   - Add `/auth/google` and `/auth/google/callback`
   - Add `/api/user/dashboard` endpoint
   - Add `/api/user/courses` for enrolled courses
   - Update user context from hardcoded "user1" to session user

4. **Update App Configuration** (`server/app.ts`):
   - Configure Google OAuth strategy
   - Add auth middleware

## Phase 4: Frontend Updates

1. **Rebrand to SCIRE**:
   - Update `client/index.html` title and meta tags
   - Update logo and branding throughout
   - Update `package.json` name

2. **Add Google Sign-In**:
   - Create `GoogleSignIn.tsx` component
   - Add Google Sign-In button to login page
   - Handle OAuth redirect flow

3. **Create User Dashboard** (`client/src/pages/Dashboard.tsx`):
   - Display enrolled courses
   - Show progress for each course
   - Course management (unenroll, continue learning)
   - User profile section

4. **Update Navigation**:
   - Add Dashboard link for authenticated users
   - Update header with user profile dropdown
   - Add sign-out functionality

## Phase 5: Testing & Deployment

1. Test Google OAuth flow
2. Test Gemini API integration
3. Test user dashboard functionality
4. Update documentation
5. Deploy to production

## Environment Variables Template

```env
# Database
DATABASE_URL=postgresql://user:password@host:port/database

# Google Gemini API
GEMINI_API_KEY=your_gemini_api_key_here

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Session
SESSION_SECRET=your_random_session_secret_here
NODE_ENV=development
```

## Notes

- SCIRE means "to know" or "to understand" in Latin
- Maintain backward compatibility with existing users
- Ensure all AI features work with Gemini API
- Keep the tiered learning structure intact
