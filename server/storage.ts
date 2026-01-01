import { db } from './firebase';
import { Timestamp, FieldValue } from 'firebase-admin/firestore';
import type {
  User, InsertUser,
  Course, InsertCourse,
  Tier, InsertTier,
  Module, InsertModule,
  Flashcard, InsertFlashcard,
  UserInterest, InsertUserInterest,
  UserProgress, InsertUserProgress,
  FlashcardProgress, InsertFlashcardProgress,
  UnderstandingCheck, InsertUnderstandingCheck,
  UserCourseEnrollment, InsertUserCourseEnrollment,
  Assessment, InsertAssessment,
  UserAssessmentSubmission,
  Notification, InsertNotification,
} from '@shared/types';

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserById(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByGoogleId(googleId: string): Promise<User | undefined>;
  getUserByClerkId(clerkId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, data: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: string): Promise<void>;

  // Course methods
  getCourse(id: string): Promise<Course | undefined>;
  getCourseWithDetails(id: string): Promise<any | undefined>;
  getAllCourses(): Promise<any[]>;
  createCourse(course: InsertCourse): Promise<Course>;
  updateCourse(id: string, data: Partial<InsertCourse>): Promise<Course | undefined>;
  deleteCourse(id: string): Promise<void>;

  // Tier methods
  createTier(tier: InsertTier): Promise<Tier>;
  getTiersByCourse(courseId: string): Promise<Tier[]>;
  updateTier(id: string, data: Partial<InsertTier>): Promise<Tier | undefined>;

  // Module methods
  createModule(module: InsertModule): Promise<Module>;
  getModule(id: string): Promise<Module | undefined>;
  getModulesByTier(tierId: string): Promise<Module[]>;

  // Flashcard methods
  createFlashcard(flashcard: InsertFlashcard): Promise<Flashcard>;
  getFlashcardsByModule(moduleId: string): Promise<Flashcard[]>;

  // Assessment methods
  createAssessment(assessment: InsertAssessment): Promise<Assessment>;
  getAssessmentsByModule(moduleId: string): Promise<Assessment[]>;
  createAssessmentSubmission(submission: Omit<UserAssessmentSubmission, 'id' | 'completedAt'>): Promise<UserAssessmentSubmission>;
  getAssessmentSubmissions(userId: string, assessmentId: string): Promise<UserAssessmentSubmission[]>;

  // User Interest methods
  getUserInterest(userId: string): Promise<UserInterest | undefined>;
  createOrUpdateUserInterest(interest: InsertUserInterest): Promise<UserInterest>;

  // Progress methods
  getUserProgress(userId: string, moduleId: string): Promise<UserProgress | undefined>;
  updateUserProgress(progress: InsertUserProgress): Promise<UserProgress>;
  getCourseProgress(userId: string, courseId: string): Promise<number>;
  getCourseProgressDetails(userId: string, courseId: string): Promise<UserProgress[]>;

  // Flashcard Progress
  getFlashcardProgress(userId: string, flashcardId: string): Promise<FlashcardProgress | undefined>;
  updateFlashcardProgress(progress: InsertFlashcardProgress): Promise<FlashcardProgress>;

  // Understanding Checks
  createUnderstandingCheck(check: InsertUnderstandingCheck): Promise<UnderstandingCheck>;
  getUnderstandingChecks(userId: string, moduleId: string): Promise<UnderstandingCheck[]>;

  // Enrollments
  enrollUserInCourse(enrollment: InsertUserCourseEnrollment): Promise<UserCourseEnrollment>;
  getUserEnrollments(userId: string): Promise<UserCourseEnrollment[]>;
  getEnrollment(userId: string, courseId: string): Promise<UserCourseEnrollment | undefined>;

  // Stats
  getUserStats(userId: string): Promise<{
    totalCourses: number;
    totalMinutes: number;
    completedModules: number;
    averageScore: number;
  }>;
  getAdminStats(): Promise<any>;

  // Notifications
  createNotification(notification: InsertNotification): Promise<Notification>;
  getUserNotifications(userId: string): Promise<Notification[]>;
  markNotificationRead(id: string): Promise<void>;
  markAllNotificationsRead(userId: string): Promise<void>;
}

export class FirestoreStorage implements IStorage {
  // User methods
  async getUser(id: string): Promise<User | undefined> {
    const doc = await db.collection('users').doc(id).get();
    return doc.exists ? (doc.data() as User) : undefined;
  }

  async getUserById(id: string): Promise<User | undefined> {
    return this.getUser(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const snapshot = await db.collection('users').where('username', '==', username).limit(1).get();
    if (snapshot.empty) return undefined;
    return snapshot.docs[0].data() as User;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const snapshot = await db.collection('users').where('email', '==', email).limit(1).get();
    if (snapshot.empty) return undefined;
    return snapshot.docs[0].data() as User;
  }

  async getUserByGoogleId(googleId: string): Promise<User | undefined> {
    const snapshot = await db.collection('users').where('googleId', '==', googleId).limit(1).get();
    if (snapshot.empty) return undefined;
    return snapshot.docs[0].data() as User;
  }

  async getUserByClerkId(clerkId: string): Promise<User | undefined> {
    const snapshot = await db.collection('users').where('clerkId', '==', clerkId).limit(1).get();
    if (snapshot.empty) return undefined;
    return snapshot.docs[0].data() as User;
  }

  async createUser(user: InsertUser): Promise<User> {
    const docRef = db.collection('users').doc();
    const newUser: User = {
      ...user,
      id: docRef.id,
      provider: user.provider || 'local',
      isAdmin: user.isAdmin || false,
      createdAt: FieldValue.serverTimestamp() as Timestamp
    };
    await docRef.set(newUser);
    return newUser;
  }

  async updateUser(id: string, data: Partial<InsertUser>): Promise<User | undefined> {
    const docRef = db.collection('users').doc(id);
    await docRef.update(data);
    const doc = await docRef.get();
    return doc.data() as User;
  }

  async deleteUser(id: string): Promise<void> {
    await db.collection('users').doc(id).delete();
  }

  // Course methods
  async getCourse(id: string): Promise<Course | undefined> {
    const doc = await db.collection('courses').doc(id).get();
    return doc.exists ? (doc.data() as Course) : undefined;
  }

  async getCourseWithDetails(id: string): Promise<any | undefined> {
    const course = await this.getCourse(id);
    if (!course) return undefined;

    const tiers = await this.getTiersByCourse(id);
    const tiersWithModules = await Promise.all(tiers.map(async (tier) => {
      const modules = await this.getModulesByTier(tier.id);
      return { ...tier, modules };
    }));

    return { ...course, tiers: tiersWithModules };
  }

  async getAllCourses(): Promise<any[]> {
    const [coursesSnap, tiersSnap, modulesSnap] = await Promise.all([
      db.collection('courses').get(),
      db.collection('tiers').get(),
      db.collection('modules').get()
    ]);

    const tiers = tiersSnap.docs.map(d => ({ id: d.id, ...d.data() } as Tier));
    const modules = modulesSnap.docs.map(d => ({ id: d.id, ...d.data() } as Module));

    return coursesSnap.docs.map(doc => {
      const course = { id: doc.id, ...doc.data() } as Course;
      const courseTiers = tiers.filter(t => t.courseId === course.id);
      const tierIds = new Set(courseTiers.map(t => t.id));
      const courseModules = modules.filter(m => tierIds.has(m.tierId));

      return {
        ...course,
        tierCount: courseTiers.length,
        moduleCount: courseModules.length
      };
    });
  }

  async createCourse(course: InsertCourse): Promise<Course> {
    const docRef = db.collection('courses').doc();
    const newCourse: Course = { ...course, id: docRef.id, createdAt: FieldValue.serverTimestamp() as Timestamp };
    await docRef.set(newCourse);
    return newCourse;
  }

  async updateCourse(id: string, data: Partial<InsertCourse>): Promise<Course | undefined> {
    const docRef = db.collection('courses').doc(id);
    await docRef.update(data);
    const doc = await docRef.get();
    return doc.data() as Course;
  }

  async deleteCourse(id: string): Promise<void> {
    await db.collection('courses').doc(id).delete();
  }

  // Tier methods
  async createTier(tier: InsertTier): Promise<Tier> {
    const docRef = db.collection('tiers').doc();
    const newTier: Tier = {
      ...tier,
      id: docRef.id,
      level: tier.level as 'start' | 'intermediate' | 'advanced',
      createdAt: FieldValue.serverTimestamp() as Timestamp
    };
    await docRef.set(newTier);
    return newTier;
  }

  async getTiersByCourse(courseId: string): Promise<Tier[]> {
    const snapshot = await db.collection('tiers').where('courseId', '==', courseId).get();
    const tiers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Tier));
    return tiers.sort((a, b) => a.order - b.order);
  }

  async updateTier(id: string, data: Partial<InsertTier>): Promise<Tier | undefined> {
    const docRef = db.collection('tiers').doc(id);
    const doc = await docRef.get();
    if (!doc.exists) return undefined;

    await docRef.update(data);
    const updated = await docRef.get();
    return { id: updated.id, ...updated.data() } as Tier;
  }

  // Module methods
  async createModule(module: InsertModule): Promise<Module> {
    const docRef = db.collection('modules').doc();
    const newModule: Module = {
      ...module,
      id: docRef.id,
      estimatedMinutes: module.estimatedMinutes || 15,
      createdAt: FieldValue.serverTimestamp() as Timestamp
    };
    await docRef.set(newModule);
    return newModule;
  }

  async getModule(id: string): Promise<Module | undefined> {
    const doc = await db.collection('modules').doc(id).get();
    return doc.exists ? (doc.data() as Module) : undefined;
  }

  async getModulesByTier(tierId: string): Promise<Module[]> {
    const snapshot = await db.collection('modules').where('tierId', '==', tierId).get();
    const modules = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Module));
    return modules.sort((a, b) => a.order - b.order);
  }

  // Flashcard methods
  async createFlashcard(flashcard: InsertFlashcard): Promise<Flashcard> {
    const docRef = db.collection('flashcards').doc();
    const newFlashcard: Flashcard = { ...flashcard, id: docRef.id, createdAt: FieldValue.serverTimestamp() as Timestamp };
    await docRef.set(newFlashcard);
    return newFlashcard;
  }

  async getFlashcardsByModule(moduleId: string): Promise<Flashcard[]> {
    const snapshot = await db.collection('flashcards').where('moduleId', '==', moduleId).get();
    const flashcards = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Flashcard));
    return flashcards.sort((a, b) => a.order - b.order);
  }

  // Assessment methods
  async createAssessment(assessment: InsertAssessment): Promise<Assessment> {
    const docRef = db.collection('assessments').doc();
    const newAssessment: Assessment = {
      id: docRef.id,
      ...assessment,
      createdAt: FieldValue.serverTimestamp() as Timestamp,
    };
    await docRef.set(newAssessment);
    return newAssessment;
  }

  async getAssessmentsByModule(moduleId: string): Promise<Assessment[]> {
    const snapshot = await db.collection('assessments')
      .where('moduleId', '==', moduleId)
      .get();

    const assessments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Assessment));
    return assessments.sort((a, b) => a.order - b.order);
  }

  async createAssessmentSubmission(submission: Omit<UserAssessmentSubmission, 'id' | 'completedAt'>): Promise<UserAssessmentSubmission> {
    const docRef = db.collection('assessment_submissions').doc();
    const newSubmission: UserAssessmentSubmission = {
      id: docRef.id,
      ...submission,
      completedAt: FieldValue.serverTimestamp() as Timestamp,
    };
    await docRef.set(newSubmission);
    return newSubmission;
  }

  async getAssessmentSubmissions(userId: string, assessmentId: string): Promise<UserAssessmentSubmission[]> {
    const snapshot = await db.collection('assessment_submissions')
      .where('userId', '==', userId)
      .where('assessmentId', '==', assessmentId)
      .orderBy('completedAt', 'desc')
      .get();

    return snapshot.docs.map(doc => doc.data() as UserAssessmentSubmission);
  }

  // User Interest methods
  async getUserInterest(userId: string): Promise<UserInterest | undefined> {
    const snapshot = await db.collection('user_interests').where('userId', '==', userId).limit(1).get();
    if (snapshot.empty) return undefined;
    return snapshot.docs[0].data() as UserInterest;
  }

  async createOrUpdateUserInterest(interest: InsertUserInterest): Promise<UserInterest> {
    const snapshot = await db.collection('user_interests').where('userId', '==', interest.userId).limit(1).get();

    if (!snapshot.empty) {
      const docRef = snapshot.docs[0].ref;
      await docRef.update({ ...interest, updatedAt: FieldValue.serverTimestamp() });
      const updated = await docRef.get();
      return updated.data() as UserInterest;
    }

    const docRef = db.collection('user_interests').doc();
    const newInterest: UserInterest = {
      ...interest,
      id: docRef.id,
      createdAt: FieldValue.serverTimestamp() as Timestamp,
      updatedAt: FieldValue.serverTimestamp() as Timestamp
    };
    await docRef.set(newInterest);
    return newInterest;
  }

  // Progress methods
  async getUserProgress(userId: string, moduleId: string): Promise<UserProgress | undefined> {
    const snapshot = await db.collection('user_progress')
      .where('userId', '==', userId)
      .where('moduleId', '==', moduleId)
      .limit(1)
      .get();

    if (snapshot.empty) return undefined;
    return snapshot.docs[0].data() as UserProgress;
  }

  async updateUserProgress(progress: InsertUserProgress): Promise<UserProgress> {
    const snapshot = await db.collection('user_progress')
      .where('userId', '==', progress.userId)
      .where('moduleId', '==', progress.moduleId)
      .limit(1)
      .get();

    if (!snapshot.empty) {
      const docRef = snapshot.docs[0].ref;
      await docRef.update({ ...progress, updatedAt: FieldValue.serverTimestamp() });
      const updated = await docRef.get();
      return updated.data() as UserProgress;
    }

    const docRef = db.collection('user_progress').doc();
    const newProgress: UserProgress = {
      ...progress,
      id: docRef.id,
      updatedAt: FieldValue.serverTimestamp() as Timestamp,
      createdAt: FieldValue.serverTimestamp() as Timestamp,
      completed: progress.completed || false,
      progressPercent: progress.progressPercent || 0,
      timeSpentMinutes: progress.timeSpentMinutes || 0,
      completedAt: progress.completedAt ? Timestamp.fromDate(progress.completedAt) : undefined,
    };
    await docRef.set(newProgress);
    return newProgress;
  }

  async getCourseProgress(userId: string, courseId: string): Promise<number> {
    const tiers = await this.getTiersByCourse(courseId);
    if (tiers.length === 0) return 0;

    let totalModules = 0;
    let completedModules = 0;

    for (const tier of tiers) {
      const modules = await this.getModulesByTier(tier.id);
      totalModules += modules.length;

      for (const module of modules) {
        const progress = await this.getUserProgress(userId, module.id);
        if (progress?.completed) {
          completedModules++;
        }
      }
    }

    if (totalModules === 0) return 0;
    return Math.round((completedModules / totalModules) * 100);
  }

  async getCourseProgressDetails(userId: string, courseId: string): Promise<UserProgress[]> {
    const tiers = await this.getTiersByCourse(courseId);
    const progressList: UserProgress[] = [];

    for (const tier of tiers) {
      const modules = await this.getModulesByTier(tier.id);
      for (const module of modules) {
        const progress = await this.getUserProgress(userId, module.id);
        if (progress) {
          progressList.push(progress);
        }
      }
    }
    return progressList;
  }

  // Flashcard Progress
  async getFlashcardProgress(userId: string, flashcardId: string): Promise<FlashcardProgress | undefined> {
    const snapshot = await db.collection('flashcard_progress')
      .where('userId', '==', userId)
      .where('flashcardId', '==', flashcardId)
      .limit(1)
      .get();

    if (snapshot.empty) return undefined;
    return snapshot.docs[0].data() as FlashcardProgress;
  }

  async updateFlashcardProgress(progress: InsertFlashcardProgress): Promise<FlashcardProgress> {
    const snapshot = await db.collection('flashcard_progress')
      .where('userId', '==', progress.userId)
      .where('flashcardId', '==', progress.flashcardId)
      .limit(1)
      .get();

    if (!snapshot.empty) {
      const docRef = snapshot.docs[0].ref;
      await docRef.update({ ...progress, lastReviewed: FieldValue.serverTimestamp() });
      const updated = await docRef.get();
      return updated.data() as FlashcardProgress;
    }

    const docRef = db.collection('flashcard_progress').doc();
    const newProgress: FlashcardProgress = {
      ...progress,
      id: docRef.id,
      lastReviewed: FieldValue.serverTimestamp() as Timestamp,
      createdAt: FieldValue.serverTimestamp() as Timestamp,
      easeFactor: progress.easeFactor || 2.5,
      correct: progress.correct || 0,
      incorrect: progress.incorrect || 0,
      nextReview: progress.nextReview ? Timestamp.fromDate(progress.nextReview) : undefined,
    };
    await docRef.set(newProgress);
    return newProgress;
  }

  // Understanding Checks
  async createUnderstandingCheck(check: InsertUnderstandingCheck): Promise<UnderstandingCheck> {
    const docRef = db.collection('understanding_checks').doc();
    const newCheck: UnderstandingCheck = {
      ...check,
      id: docRef.id,
      createdAt: FieldValue.serverTimestamp() as Timestamp,
    };
    await docRef.set(newCheck);
    return newCheck;
  }

  async getUnderstandingChecks(userId: string, moduleId: string): Promise<UnderstandingCheck[]> {
    const snapshot = await db.collection('understanding_checks')
      .where('userId', '==', userId)
      .where('moduleId', '==', moduleId)
      .orderBy('createdAt', 'desc')
      .get();

    return snapshot.docs.map(doc => doc.data() as UnderstandingCheck);
  }

  // Enrollments
  async enrollUserInCourse(enrollment: InsertUserCourseEnrollment): Promise<UserCourseEnrollment> {
    const docRef = db.collection('enrollments').doc();
    const newEnrollment: UserCourseEnrollment = {
      ...enrollment,
      id: docRef.id,
      enrolledAt: FieldValue.serverTimestamp() as Timestamp,
    };
    await docRef.set(newEnrollment);
    return newEnrollment;
  }

  async getUserEnrollments(userId: string): Promise<UserCourseEnrollment[]> {
    const snapshot = await db.collection('enrollments')
      .where('userId', '==', userId)
      .orderBy('enrolledAt', 'desc')
      .get();

    return snapshot.docs.map(doc => doc.data() as UserCourseEnrollment);
  }

  async getEnrollment(userId: string, courseId: string): Promise<UserCourseEnrollment | undefined> {
    const snapshot = await db.collection('enrollments')
      .where('userId', '==', userId)
      .where('courseId', '==', courseId)
      .limit(1)
      .get();

    if (snapshot.empty) return undefined;
    return snapshot.docs[0].data() as UserCourseEnrollment;
  }

  // Stats
  async getUserStats(userId: string): Promise<{
    totalCourses: number;
    totalMinutes: number;
    completedModules: number;
    averageScore: number;
  }> {
    const enrollments = await this.getUserEnrollments(userId);

    const progressSnapshot = await db.collection('user_progress')
      .where('userId', '==', userId)
      .get();

    const progress = progressSnapshot.docs.map(doc => doc.data() as UserProgress);

    const totalMinutes = progress.reduce((acc, curr) => acc + (curr.timeSpentMinutes || 0), 0);
    const completedModules = progress.filter(p => p.completed).length;

    const checksSnapshot = await db.collection('understanding_checks')
      .where('userId', '==', userId)
      .get();

    const checks = checksSnapshot.docs.map(doc => doc.data() as UnderstandingCheck);
    const averageScore = checks.length > 0
      ? Math.round(checks.reduce((acc, curr) => acc + curr.score, 0) / checks.length)
      : 0;

    return {
      totalCourses: enrollments.length,
      totalMinutes,
      completedModules,
      averageScore,
    };
  }

  async getAdminStats(): Promise<any> {
    const [coursesSnapshot, usersSnapshot, enrollmentsSnapshot] = await Promise.all([
      db.collection('courses').get(),
      db.collection('users').get(),
      db.collection('enrollments').get(),
    ]);

    return {
      totalCourses: coursesSnapshot.size,
      totalUsers: usersSnapshot.size,
      totalEnrollments: enrollmentsSnapshot.size,
    };
  }

  // Notification methods
  async createNotification(notification: InsertNotification): Promise<Notification> {
    const docRef = db.collection('notifications').doc();
    const newNotification: Notification = {
      ...notification,
      id: docRef.id,
      read: notification.read || false,
      createdAt: FieldValue.serverTimestamp() as Timestamp,
    };
    await docRef.set(newNotification);
    return newNotification;
  }

  async getUserNotifications(userId: string): Promise<Notification[]> {
    const snapshot = await db.collection('notifications')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .limit(50)
      .get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notification));
  }

  async markNotificationRead(id: string): Promise<void> {
    await db.collection('notifications').doc(id).update({ read: true });
  }

  async markAllNotificationsRead(userId: string): Promise<void> {
    const snapshot = await db.collection('notifications')
      .where('userId', '==', userId)
      .where('read', '==', false)
      .get();

    const batch = db.batch();
    snapshot.docs.forEach(doc => {
      batch.update(doc.ref, { read: true });
    });
    await batch.commit();
  }
}

export const storage = new FirestoreStorage();
