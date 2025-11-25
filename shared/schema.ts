import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, jsonb, boolean } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  isAdmin: boolean("is_admin").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const courses = pgTable("courses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description").notNull(),
  sourceType: text("source_type").notNull(),
  sourceUrl: text("source_url"),
  content: text("content").notNull(),
  createdBy: varchar("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const tiers = pgTable("tiers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  courseId: varchar("course_id").notNull().references(() => courses.id, { onDelete: "cascade" }),
  level: text("level").notNull(),
  order: integer("order").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const modules = pgTable("modules", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tierId: varchar("tier_id").notNull().references(() => tiers.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  content: text("content").notNull(),
  order: integer("order").notNull(),
  estimatedMinutes: integer("estimated_minutes").notNull().default(15),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const flashcards = pgTable("flashcards", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  moduleId: varchar("module_id").notNull().references(() => modules.id, { onDelete: "cascade" }),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  order: integer("order").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const userInterests = pgTable("user_interests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  topics: text("topics").array().notNull(),
  learningGoals: text("learning_goals").notNull(),
  preferredPace: text("preferred_pace").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const userProgress = pgTable("user_progress", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  moduleId: varchar("module_id").notNull().references(() => modules.id, { onDelete: "cascade" }),
  completed: boolean("completed").notNull().default(false),
  completedAt: timestamp("completed_at"),
  progressPercent: integer("progress_percent").notNull().default(0),
  timeSpentMinutes: integer("time_spent_minutes").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const flashcardProgress = pgTable("flashcard_progress", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  flashcardId: varchar("flashcard_id").notNull().references(() => flashcards.id, { onDelete: "cascade" }),
  correct: integer("correct").notNull().default(0),
  incorrect: integer("incorrect").notNull().default(0),
  lastReviewed: timestamp("last_reviewed"),
  nextReview: timestamp("next_review"),
  easeFactor: integer("ease_factor").notNull().default(250),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const understandingChecks = pgTable("understanding_checks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  moduleId: varchar("module_id").notNull().references(() => modules.id, { onDelete: "cascade" }),
  userExplanation: text("user_explanation").notNull(),
  aiFeedback: text("ai_feedback").notNull(),
  score: integer("score").notNull(),
  areasForImprovement: text("areas_for_improvement").array(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const userCourseEnrollments = pgTable("user_course_enrollments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  courseId: varchar("course_id").notNull().references(() => courses.id, { onDelete: "cascade" }),
  enrolledAt: timestamp("enrolled_at").notNull().defaultNow(),
  currentTierId: varchar("current_tier_id").references(() => tiers.id),
});

export const usersRelations = relations(users, ({ many }) => ({
  courses: many(courses),
  interests: many(userInterests),
  progress: many(userProgress),
  enrollments: many(userCourseEnrollments),
  understandingChecks: many(understandingChecks),
}));

export const coursesRelations = relations(courses, ({ one, many }) => ({
  creator: one(users, { fields: [courses.createdBy], references: [users.id] }),
  tiers: many(tiers),
  enrollments: many(userCourseEnrollments),
}));

export const tiersRelations = relations(tiers, ({ one, many }) => ({
  course: one(courses, { fields: [tiers.courseId], references: [courses.id] }),
  modules: many(modules),
}));

export const modulesRelations = relations(modules, ({ one, many }) => ({
  tier: one(tiers, { fields: [modules.tierId], references: [tiers.id] }),
  flashcards: many(flashcards),
  progress: many(userProgress),
  understandingChecks: many(understandingChecks),
}));

export const flashcardsRelations = relations(flashcards, ({ one, many }) => ({
  module: one(modules, { fields: [flashcards.moduleId], references: [modules.id] }),
  progress: many(flashcardProgress),
}));

export const userInterestsRelations = relations(userInterests, ({ one }) => ({
  user: one(users, { fields: [userInterests.userId], references: [users.id] }),
}));

export const userProgressRelations = relations(userProgress, ({ one }) => ({
  user: one(users, { fields: [userProgress.userId], references: [users.id] }),
  module: one(modules, { fields: [userProgress.moduleId], references: [modules.id] }),
}));

export const flashcardProgressRelations = relations(flashcardProgress, ({ one }) => ({
  user: one(users, { fields: [flashcardProgress.userId], references: [users.id] }),
  flashcard: one(flashcards, { fields: [flashcardProgress.flashcardId], references: [flashcards.id] }),
}));

export const understandingChecksRelations = relations(understandingChecks, ({ one }) => ({
  user: one(users, { fields: [understandingChecks.userId], references: [users.id] }),
  module: one(modules, { fields: [understandingChecks.moduleId], references: [modules.id] }),
}));

export const userCourseEnrollmentsRelations = relations(userCourseEnrollments, ({ one }) => ({
  user: one(users, { fields: [userCourseEnrollments.userId], references: [users.id] }),
  course: one(courses, { fields: [userCourseEnrollments.courseId], references: [courses.id] }),
  currentTier: one(tiers, { fields: [userCourseEnrollments.currentTierId], references: [tiers.id] }),
}));

export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertCourseSchema = createInsertSchema(courses).omit({ id: true, createdAt: true });
export const insertTierSchema = createInsertSchema(tiers).omit({ id: true, createdAt: true });
export const insertModuleSchema = createInsertSchema(modules).omit({ id: true, createdAt: true });
export const insertFlashcardSchema = createInsertSchema(flashcards).omit({ id: true, createdAt: true });
export const insertUserInterestSchema = createInsertSchema(userInterests).omit({ id: true, createdAt: true, updatedAt: true });
export const insertUserProgressSchema = createInsertSchema(userProgress).omit({ id: true, createdAt: true, updatedAt: true });
export const insertFlashcardProgressSchema = createInsertSchema(flashcardProgress).omit({ id: true, createdAt: true });
export const insertUnderstandingCheckSchema = createInsertSchema(understandingChecks).omit({ id: true, createdAt: true });
export const insertUserCourseEnrollmentSchema = createInsertSchema(userCourseEnrollments).omit({ id: true, enrolledAt: true });

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertCourse = z.infer<typeof insertCourseSchema>;
export type Course = typeof courses.$inferSelect;
export type InsertTier = z.infer<typeof insertTierSchema>;
export type Tier = typeof tiers.$inferSelect;
export type InsertModule = z.infer<typeof insertModuleSchema>;
export type Module = typeof modules.$inferSelect;
export type InsertFlashcard = z.infer<typeof insertFlashcardSchema>;
export type Flashcard = typeof flashcards.$inferSelect;
export type InsertUserInterest = z.infer<typeof insertUserInterestSchema>;
export type UserInterest = typeof userInterests.$inferSelect;
export type InsertUserProgress = z.infer<typeof insertUserProgressSchema>;
export type UserProgress = typeof userProgress.$inferSelect;
export type InsertFlashcardProgress = z.infer<typeof insertFlashcardProgressSchema>;
export type FlashcardProgress = typeof flashcardProgress.$inferSelect;
export type InsertUnderstandingCheck = z.infer<typeof insertUnderstandingCheckSchema>;
export type UnderstandingCheck = typeof understandingChecks.$inferSelect;
export type InsertUserCourseEnrollment = z.infer<typeof insertUserCourseEnrollmentSchema>;
export type UserCourseEnrollment = typeof userCourseEnrollments.$inferSelect;
