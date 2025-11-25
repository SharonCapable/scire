import {
  users,
  courses,
  tiers,
  modules,
  flashcards,
  userInterests,
  userProgress,
  flashcardProgress,
  understandingChecks,
  userCourseEnrollments,
  type User,
  type InsertUser,
  type Course,
  type InsertCourse,
  type Tier,
  type InsertTier,
  type Module,
  type InsertModule,
  type Flashcard,
  type InsertFlashcard,
  type UserInterest,
  type InsertUserInterest,
  type UserProgress,
  type InsertUserProgress,
  type FlashcardProgress,
  type InsertFlashcardProgress,
  type UnderstandingCheck,
  type InsertUnderstandingCheck,
  type UserCourseEnrollment,
  type InsertUserCourseEnrollment,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  getCourse(id: string): Promise<any | undefined>;
  getCourseWithDetails(id: string): Promise<any | undefined>;
  getAllCourses(): Promise<any[]>;
  createCourse(course: InsertCourse): Promise<Course>;
  updateCourse(id: string, data: Partial<InsertCourse>): Promise<Course | undefined>;
  deleteCourse(id: string): Promise<void>;
  
  createTier(tier: InsertTier): Promise<Tier>;
  getTiersByCourse(courseId: string): Promise<Tier[]>;
  
  createModule(module: InsertModule): Promise<Module>;
  getModule(id: string): Promise<Module | undefined>;
  getModulesByTier(tierId: string): Promise<Module[]>;
  
  createFlashcard(flashcard: InsertFlashcard): Promise<Flashcard>;
  getFlashcardsByModule(moduleId: string): Promise<Flashcard[]>;
  
  getUserInterest(userId: string): Promise<UserInterest | undefined>;
  createOrUpdateUserInterest(interest: InsertUserInterest): Promise<UserInterest>;
  
  getUserProgress(userId: string, moduleId: string): Promise<UserProgress | undefined>;
  getUserProgressForCourse(userId: string, courseId: string): Promise<UserProgress[]>;
  createOrUpdateUserProgress(progress: InsertUserProgress): Promise<UserProgress>;
  
  createFlashcardProgress(progress: InsertFlashcardProgress): Promise<FlashcardProgress>;
  getFlashcardProgress(userId: string, flashcardId: string): Promise<FlashcardProgress | undefined>;
  updateFlashcardProgress(id: string, data: Partial<InsertFlashcardProgress>): Promise<FlashcardProgress | undefined>;
  
  createUnderstandingCheck(check: InsertUnderstandingCheck): Promise<UnderstandingCheck>;
  
  createEnrollment(enrollment: InsertUserCourseEnrollment): Promise<UserCourseEnrollment>;
  getEnrollment(userId: string, courseId: string): Promise<UserCourseEnrollment | undefined>;
  
  getAdminStats(): Promise<any>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getCourse(id: string): Promise<any | undefined> {
    const [course] = await db.select().from(courses).where(eq(courses.id, id));
    return course || undefined;
  }

  async getCourseWithDetails(id: string): Promise<any | undefined> {
    const [course] = await db.query.courses.findMany({
      where: eq(courses.id, id),
      with: {
        tiers: {
          orderBy: (tiers, { asc }) => [asc(tiers.order)],
          with: {
            modules: {
              orderBy: (modules, { asc }) => [asc(modules.order)],
            },
          },
        },
      },
    });
    
    return course || undefined;
  }

  async getAllCourses(): Promise<any[]> {
    const result = await db.select({
      id: courses.id,
      title: courses.title,
      description: courses.description,
      sourceType: courses.sourceType,
      sourceUrl: courses.sourceUrl,
      createdAt: courses.createdAt,
      tierCount: sql<number>`(SELECT COUNT(*) FROM ${tiers} WHERE ${tiers.courseId} = ${courses.id})`,
      moduleCount: sql<number>`(
        SELECT COUNT(*) FROM ${modules} 
        WHERE ${modules.tierId} IN (
          SELECT ${tiers.id} FROM ${tiers} WHERE ${tiers.courseId} = ${courses.id}
        )
      )`,
    }).from(courses).orderBy(desc(courses.createdAt));
    
    return result;
  }

  async createCourse(course: InsertCourse): Promise<Course> {
    const [newCourse] = await db.insert(courses).values(course).returning();
    return newCourse;
  }

  async updateCourse(id: string, data: Partial<InsertCourse>): Promise<Course | undefined> {
    const [updated] = await db.update(courses).set(data).where(eq(courses.id, id)).returning();
    return updated || undefined;
  }

  async deleteCourse(id: string): Promise<void> {
    await db.delete(courses).where(eq(courses.id, id));
  }

  async createTier(tier: InsertTier): Promise<Tier> {
    const [newTier] = await db.insert(tiers).values(tier).returning();
    return newTier;
  }

  async getTiersByCourse(courseId: string): Promise<Tier[]> {
    return await db.select().from(tiers).where(eq(tiers.courseId, courseId)).orderBy(tiers.order);
  }

  async createModule(module: InsertModule): Promise<Module> {
    const [newModule] = await db.insert(modules).values(module).returning();
    return newModule;
  }

  async getModule(id: string): Promise<Module | undefined> {
    const [module] = await db.select().from(modules).where(eq(modules.id, id));
    return module || undefined;
  }

  async getModulesByTier(tierId: string): Promise<Module[]> {
    return await db.select().from(modules).where(eq(modules.tierId, tierId)).orderBy(modules.order);
  }

  async createFlashcard(flashcard: InsertFlashcard): Promise<Flashcard> {
    const [newFlashcard] = await db.insert(flashcards).values(flashcard).returning();
    return newFlashcard;
  }

  async getFlashcardsByModule(moduleId: string): Promise<Flashcard[]> {
    return await db.select().from(flashcards).where(eq(flashcards.moduleId, moduleId)).orderBy(flashcards.order);
  }

  async getUserInterest(userId: string): Promise<UserInterest | undefined> {
    const [interest] = await db.select().from(userInterests).where(eq(userInterests.userId, userId));
    return interest || undefined;
  }

  async createOrUpdateUserInterest(interest: InsertUserInterest): Promise<UserInterest> {
    const existing = await this.getUserInterest(interest.userId);
    
    if (existing) {
      const [updated] = await db.update(userInterests)
        .set({ ...interest, updatedAt: new Date() })
        .where(eq(userInterests.userId, interest.userId))
        .returning();
      return updated;
    } else {
      const [created] = await db.insert(userInterests).values(interest).returning();
      return created;
    }
  }

  async getUserProgress(userId: string, moduleId: string): Promise<UserProgress | undefined> {
    const [progress] = await db.select().from(userProgress)
      .where(and(eq(userProgress.userId, userId), eq(userProgress.moduleId, moduleId)));
    return progress || undefined;
  }

  async getUserProgressForCourse(userId: string, courseId: string): Promise<UserProgress[]> {
    const result = await db.select()
      .from(userProgress)
      .innerJoin(modules, eq(userProgress.moduleId, modules.id))
      .innerJoin(tiers, eq(modules.tierId, tiers.id))
      .where(and(eq(userProgress.userId, userId), eq(tiers.courseId, courseId)));
    
    return result.map(r => r.user_progress);
  }

  async createOrUpdateUserProgress(progress: InsertUserProgress): Promise<UserProgress> {
    const existing = await this.getUserProgress(progress.userId, progress.moduleId);
    
    if (existing) {
      const [updated] = await db.update(userProgress)
        .set({ ...progress, updatedAt: new Date() })
        .where(and(eq(userProgress.userId, progress.userId), eq(userProgress.moduleId, progress.moduleId)))
        .returning();
      return updated;
    } else {
      const [created] = await db.insert(userProgress).values(progress).returning();
      return created;
    }
  }

  async createFlashcardProgress(progress: InsertFlashcardProgress): Promise<FlashcardProgress> {
    const [newProgress] = await db.insert(flashcardProgress).values(progress).returning();
    return newProgress;
  }

  async getFlashcardProgress(userId: string, flashcardId: string): Promise<FlashcardProgress | undefined> {
    const [progress] = await db.select().from(flashcardProgress)
      .where(and(eq(flashcardProgress.userId, userId), eq(flashcardProgress.flashcardId, flashcardId)));
    return progress || undefined;
  }

  async updateFlashcardProgress(id: string, data: Partial<InsertFlashcardProgress>): Promise<FlashcardProgress | undefined> {
    const [updated] = await db.update(flashcardProgress).set(data).where(eq(flashcardProgress.id, id)).returning();
    return updated || undefined;
  }

  async createUnderstandingCheck(check: InsertUnderstandingCheck): Promise<UnderstandingCheck> {
    const [newCheck] = await db.insert(understandingChecks).values(check).returning();
    return newCheck;
  }

  async createEnrollment(enrollment: InsertUserCourseEnrollment): Promise<UserCourseEnrollment> {
    const [newEnrollment] = await db.insert(userCourseEnrollments).values(enrollment).returning();
    return newEnrollment;
  }

  async getEnrollment(userId: string, courseId: string): Promise<UserCourseEnrollment | undefined> {
    const [enrollment] = await db.select().from(userCourseEnrollments)
      .where(and(eq(userCourseEnrollments.userId, userId), eq(userCourseEnrollments.courseId, courseId)));
    return enrollment || undefined;
  }

  async getAdminStats(): Promise<any> {
    const [stats] = await db.select({
      totalCourses: sql<number>`COUNT(DISTINCT ${courses.id})`,
      totalUsers: sql<number>`COUNT(DISTINCT ${users.id})`,
      totalEnrollments: sql<number>`COUNT(DISTINCT ${userCourseEnrollments.id})`,
    }).from(courses)
      .leftJoin(users, sql`true`)
      .leftJoin(userCourseEnrollments, sql`true`);
    
    return stats;
  }
}

export const storage = new DatabaseStorage();
