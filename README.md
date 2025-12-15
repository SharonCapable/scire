# SCIRE - AI-Powered Learning Platform

**SCIRE** (Latin: "to know" or "to understand") is an intelligent, adaptive learning platform powered by Google Gemini AI. The platform provides personalized education through tiered learning paths, interactive flashcards, and AI-driven understanding checks.

## 🌟 Features

- **AI-Powered Content Generation**: Uses Google Gemini 1.5 Pro to create structured learning paths
- **Tiered Learning**: Progressive difficulty levels (Start, Intermediate, Advanced)
- **Interactive Flashcards**: AI-generated flashcards for each module
- **Understanding Checks**: AI validates student comprehension and provides feedback
- **User Dashboard**: Track progress, manage enrolled courses, and view learning statistics
- **Google OAuth**: Secure authentication with Google accounts
- **Responsive Design**: Modern UI with dark mode support

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- Firebase Project (Firestore enabled)
- Google Gemini API key
- Google OAuth 2.0 credentials

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd scire
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env` file in the root directory:
   ```env
   # Firebase Configuration
   FIREBASE_PROJECT_ID=your-project-id
   # Optional: For production/local dev with service account
   # FIREBASE_SERVICE_ACCOUNT={"type": "service_account", ...}

   # Google Gemini API
   GEMINI_API_KEY=your_gemini_api_key_here

   # Google OAuth 2.0
   GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=your_google_client_secret

   # Session
   SESSION_SECRET=your_random_session_secret_here

   # Environment
   NODE_ENV=development
   ```

4. **Set up Google OAuth**
   
   a. Go to [Google Cloud Console](https://console.cloud.google.com/)
   
   b. Create a new project or select an existing one
   
   c. Enable the Google+ API
   
   d. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
   
   e. Set authorized redirect URIs:
      - `http://localhost:5000/auth/google/callback` (development)
      - `https://yourdomain.com/auth/google/callback` (production)
   
   f. Copy the Client ID and Client Secret to your `.env` file

5. **Get a Gemini API Key**
   
   a. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
   
   b. Create an API key
   
   c. Add it to your `.env` file as `GEMINI_API_KEY`

6. **Push database schema**
   ```bash
   npm run db:push
   ```

7. **Run the development server**
   ```bash
   npm run dev
   ```

8. **Access the application**
   
   Open your browser and navigate to `http://localhost:5000`

## 📁 Project Structure

```
EduSparkAI/
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Page components
│   │   ├── lib/           # Utilities and helpers
│   │   └── App.tsx        # Main app component
│   └── index.html
├── server/                # Backend Express application
│   ├── app.ts            # Express app configuration
│   ├── auth.ts           # Authentication setup (Passport.js)
│   ├── db.ts             # Database connection
│   ├── gemini.ts         # Gemini AI integration
│   ├── routes.ts         # API routes
│   ├── storage.ts        # Database operations
│   └── seed.ts           # Database seeding
├── shared/               # Shared code between client and server
│   └── schema.ts         # Database schema (Drizzle ORM)
└── package.json
```

## 🔑 Key Technologies

- **Frontend**: React, TypeScript, Tailwind CSS, Wouter (routing), TanStack Query
- **Backend**: Express.js, TypeScript
- **Database**: Firebase Firestore (NoSQL)
- **AI**: Google Gemini 1.5 Pro
- **Authentication**: Passport.js (Local + Google OAuth)
- **Build Tool**: Vite

## 📚 API Endpoints

### Authentication
- `POST /auth/login` - Local login
- `POST /auth/logout` - Logout
- `GET /auth/google` - Initiate Google OAuth
- `GET /auth/google/callback` - Google OAuth callback
- `GET /api/auth/user` - Get current user

### Courses
- `GET /api/courses` - List all courses
- `GET /api/courses/:id` - Get course details
- `POST /api/courses` - Create a new course
- `PUT /api/courses/:id` - Update a course
- `DELETE /api/courses/:id` - Delete a course
- `POST /api/courses/:id/generate-tiers` - Generate AI-powered learning tiers

### User Dashboard
- `GET /api/user/enrolled-courses` - Get user's enrolled courses with progress
- `GET /api/user/stats` - Get user's learning statistics

### Learning
- `GET /api/modules/:id` - Get module details
- `GET /api/flashcards/:moduleId` - Get flashcards for a module
- `POST /api/progress/:moduleId` - Update module progress
- `POST /api/flashcard-progress` - Record flashcard attempt
- `POST /api/understanding-check` - Submit understanding check for AI validation

## 🎨 Features in Detail

### AI-Powered Course Generation
SCIRE uses Google Gemini to analyze course content and automatically generate:
- **Structured Learning Paths**: 3 tiers (Start, Intermediate, Advanced)
- **Modules**: 3-5 modules per tier with progressive difficulty
- **Flashcards**: 5 flashcards per module for knowledge retention
- **Understanding Checks**: AI validates student explanations and provides feedback

### User Dashboard
- **Progress Tracking**: Visual progress bars for each enrolled course
- **Learning Statistics**: Total courses, hours learned, completed modules, average score
- **Course Management**: Continue learning or start new courses
- **Profile Integration**: Google profile picture and name

### Adaptive Learning
- **Tiered Approach**: Students progress through Start → Intermediate → Advanced
- **Spaced Repetition**: Flashcards use ease factors for optimal review timing
- **AI Feedback**: Constructive feedback on understanding checks with areas for improvement

## 🔒 Security

- Session-based authentication with secure cookies
- Google OAuth 2.0 for secure sign-in
- Environment variables for sensitive data
- SQL injection protection via Drizzle ORM
- HTTPS recommended for production

## 📝 Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run check` - TypeScript type checking
- `npm run db:push` - Push database schema changes

### Database Schema

The application uses Firebase Firestore with the following main collections:
- `users` - User accounts (local + Google OAuth)
- `courses` - Course information
- `tiers` - Learning tiers within courses
- `modules` - Individual learning modules
- `flashcards` - Flashcards for modules
- `userProgress` - User progress tracking
- `enrollments` - Course enrollments
- `understandingChecks` - AI validation results

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT License

## 🙏 Acknowledgments

- Google Gemini AI for powering the intelligent features
- The open-source community for the amazing tools and libraries

---

**SCIRE** - Empowering learners through AI-driven education 🎓✨
