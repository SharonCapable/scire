// Generic Timestamp interface to avoid firebase-admin dependency in shared code
export interface Timestamp {
    seconds: number;
    nanoseconds: number;
    toDate(): Date;
    toMillis(): number;
}

// User types
export interface User {
    id: string;
    username: string;
    password?: string; // Optional for OAuth users
    email?: string;
    name?: string;
    picture?: string;
    googleId?: string;
    clerkId?: string;
    provider: 'local' | 'google' | 'clerk';
    isAdmin: boolean;
    role?: 'student' | 'educator';
    onboardingCompleted?: boolean;
    createdAt: Timestamp;
}

export interface InsertUser {
    username: string;
    password?: string;
    email?: string;
    name?: string;
    picture?: string;
    googleId?: string;
    clerkId?: string;
    provider?: 'local' | 'google' | 'clerk';
    isAdmin?: boolean;
    role?: 'student' | 'educator';
    onboardingCompleted?: boolean;
}

// Course types
export interface Course {
    id: string;
    title: string;
    description: string;
    sourceType: string;
    sourceUrl?: string;
    content: string;
    createdBy: string;
    // Personalized course fields
    isPersonalized?: boolean;
    generatedForUserId?: string;
    generationStatus?: 'pending' | 'generating' | 'completed' | 'failed';
    createdAt: Timestamp;
}

export interface InsertCourse {
    title: string;
    description: string;
    sourceType: string;
    sourceUrl?: string;
    content: string;
    createdBy: string;
    isPersonalized?: boolean;
    generatedForUserId?: string;
    generationStatus?: 'pending' | 'generating' | 'completed' | 'failed';
}

// Tier types
export interface Tier {
    id: string;
    courseId: string;
    level: 'start' | 'intermediate' | 'advanced';
    order: number;
    title: string;
    description?: string;
    // Generation status for tier-by-tier generation
    generationStatus?: 'locked' | 'generating' | 'completed';
    unlockedAt?: Timestamp;
    createdAt: Timestamp;
}

export interface InsertTier {
    courseId: string;
    level: string;
    order: number;
    title: string;
    description?: string;
    generationStatus?: 'locked' | 'generating' | 'completed';
}

// Module types
export interface Module {
    id: string;
    tierId: string;
    title: string;
    content: string;
    imageUrl?: string;
    order: number;
    estimatedMinutes: number;
    createdAt: Timestamp;
}

export interface InsertModule {
    tierId: string;
    title: string;
    content: string;
    imageUrl?: string;
    order: number;
    estimatedMinutes?: number;
}

// Flashcard types
export interface Flashcard {
    id: string;
    moduleId: string;
    question: string;
    answer: string;
    order: number;
    createdAt: Timestamp;
}

export interface InsertFlashcard {
    moduleId: string;
    question: string;
    answer: string;
    order: number;
}

// Assessment types
export type AssessmentType = 'quiz' | 'understanding';

export interface QuizQuestion {
    id: string;
    question: string;
    options: string[];
    correctAnswer: number; // index of the correct option
    explanation?: string;
}

export interface Assessment {
    id: string;
    moduleId: string;
    type: AssessmentType;
    title: string;
    // For Quiz
    questions?: QuizQuestion[];
    // For Understanding Check
    prompt?: string;
    rubric?: string; // Guidelines for AI evaluation
    order: number;
    createdAt: Timestamp;
}

export interface InsertAssessment {
    moduleId: string;
    type: AssessmentType;
    title: string;
    questions?: QuizQuestion[];
    prompt?: string;
    rubric?: string;
    order: number;
}

export interface UserAssessmentSubmission {
    id: string;
    userId: string;
    assessmentId: string;
    // For Quiz: array of selected indices
    // For Understanding: the user's text response
    response: number[] | string;
    score: number; // 0-100
    feedback?: string;
    completedAt: Timestamp;
}

// User Interest types
export interface UserInterest {
    id: string;
    userId: string;
    topics: string[];
    learningGoals: string;
    preferredPace: string;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

export interface InsertUserInterest {
    userId: string;
    topics: string[];
    learningGoals: string;
    preferredPace: string;
}

// User Progress types
export interface UserProgress {
    id: string;
    userId: string;
    moduleId: string;
    completed: boolean;
    completedAt?: Timestamp;
    progressPercent: number;
    timeSpentMinutes: number;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

export interface InsertUserProgress {
    userId: string;
    moduleId: string;
    completed?: boolean;
    completedAt?: Date;
    progressPercent?: number;
    timeSpentMinutes?: number;
}

// Flashcard Progress types
export interface FlashcardProgress {
    id: string;
    userId: string;
    flashcardId: string;
    correct: number;
    incorrect: number;
    lastReviewed?: Timestamp;
    nextReview?: Timestamp;
    easeFactor: number;
    createdAt: Timestamp;
}

export interface InsertFlashcardProgress {
    userId: string;
    flashcardId: string;
    correct?: number;
    incorrect?: number;
    lastReviewed?: Date;
    nextReview?: Date;
    easeFactor?: number;
}

// Understanding Check types
export interface UnderstandingCheck {
    id: string;
    userId: string;
    moduleId: string;
    userExplanation: string;
    aiFeedback: string;
    score: number;
    areasForImprovement?: string[];
    createdAt: Timestamp;
}

export interface InsertUnderstandingCheck {
    userId: string;
    moduleId: string;
    userExplanation: string;
    aiFeedback: string;
    score: number;
    areasForImprovement?: string[];
}

// User Course Enrollment types
export interface UserCourseEnrollment {
    id: string;
    userId: string;
    courseId: string;
    enrolledAt: Timestamp;
    currentTierId?: string;
}

export interface InsertUserCourseEnrollment {
    userId: string;
    courseId: string;
    currentTierId?: string;
}

// Notification types
export type NotificationType =
    | 'course_created'
    | 'tier_unlocked'
    | 'course_completed'
    | 'achievement_earned'
    | 'enrollment_confirmed';

export interface Notification {
    id: string;
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    data?: {
        courseId?: string;
        tierId?: string;
        achievementId?: string;
    };
    read: boolean;
    createdAt: Timestamp;
}

export interface InsertNotification {
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    data?: {
        courseId?: string;
        tierId?: string;
        achievementId?: string;
    };
    read?: boolean;
}

// User Settings types
export interface UserSettings {
    id: string;
    userId: string;
    // Notification preferences
    notifyNewCourses: boolean;
    notifyFlashcardReminders: boolean;
    notifyAssessmentReminders: boolean;
    // Frequency: 'daily' | 'weekly' | 'never'
    flashcardReminderFrequency: 'daily' | 'weekly' | 'never';
    assessmentReminderFrequency: 'daily' | 'weekly' | 'never';
    // Preferred time for reminders (24h format, e.g., "09:00")
    preferredReminderTime?: string;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

export interface InsertUserSettings {
    userId: string;
    notifyNewCourses?: boolean;
    notifyFlashcardReminders?: boolean;
    notifyAssessmentReminders?: boolean;
    flashcardReminderFrequency?: 'daily' | 'weekly' | 'never';
    assessmentReminderFrequency?: 'daily' | 'weekly' | 'never';
    preferredReminderTime?: string;
}
