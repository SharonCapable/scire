import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { seedDatabase } from "./seed";
import { generateCourseTiers, generateFlashcards, validateUnderstanding, curateCoursesForInterests } from "./openai";
import { z } from "zod";
import { insertCourseSchema, insertUserInterestSchema, insertUserProgressSchema, insertFlashcardProgressSchema, insertUnderstandingCheckSchema, insertUserCourseEnrollmentSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  await seedDatabase();
  
  app.get("/api/courses", async (req, res) => {
    try {
      const courses = await storage.getAllCourses();
      res.json(courses);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch courses" });
    }
  });

  app.get("/api/courses/:id", async (req, res) => {
    try {
      const course = await storage.getCourseWithDetails(req.params.id);
      if (!course) {
        return res.status(404).json({ error: "Course not found" });
      }
      res.json(course);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch course" });
    }
  });

  app.post("/api/courses", async (req, res) => {
    try {
      const admin = await storage.getUserByUsername("admin");
      if (!admin) {
        return res.status(500).json({ error: "Admin user not found" });
      }
      
      const data = insertCourseSchema.parse({
        ...req.body,
        createdBy: admin.id,
      });
      const course = await storage.createCourse(data);
      res.json(course);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create course" });
    }
  });

  app.put("/api/courses/:id", async (req, res) => {
    try {
      const data = insertCourseSchema.partial().parse(req.body);
      const course = await storage.updateCourse(req.params.id, data);
      if (!course) {
        return res.status(404).json({ error: "Course not found" });
      }
      res.json(course);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to update course" });
    }
  });

  app.delete("/api/courses/:id", async (req, res) => {
    try {
      await storage.deleteCourse(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete course" });
    }
  });

  app.post("/api/courses/:id/generate-tiers", async (req, res) => {
    try {
      const course = await storage.getCourse(req.params.id);
      if (!course) {
        return res.status(404).json({ error: "Course not found" });
      }

      const tiersData = await generateCourseTiers(course.content, course.title);

      const tierLevelOrder: { [key: string]: number } = { start: 0, intermediate: 1, advanced: 2 };

      for (const tierData of tiersData) {
        const tier = await storage.createTier({
          courseId: course.id,
          level: tierData.level,
          title: tierData.title,
          description: tierData.description || "",
          order: tierLevelOrder[tierData.level] || 0,
        });

        for (let i = 0; i < tierData.modules.length; i++) {
          const moduleData = tierData.modules[i];
          const module = await storage.createModule({
            tierId: tier.id,
            title: moduleData.title,
            content: moduleData.content,
            order: i,
            estimatedMinutes: moduleData.estimatedMinutes || 15,
          });

          const flashcardsData = await generateFlashcards(module.content, module.title, 5);
          for (let j = 0; j < flashcardsData.length; j++) {
            await storage.createFlashcard({
              moduleId: module.id,
              question: flashcardsData[j].question,
              answer: flashcardsData[j].answer,
              order: j,
            });
          }
        }
      }

      res.json({ success: true, message: "Tiers generated successfully" });
    } catch (error: any) {
      console.error("Generate tiers error:", error);
      res.status(500).json({ error: error?.message || "Failed to generate tiers" });
    }
  });

  app.post("/api/fetch-content", async (req, res) => {
    try {
      const { url } = req.body;
      if (!url) {
        return res.status(400).json({ error: "URL is required" });
      }

      res.json({
        title: "Fetched Content",
        content: "This is placeholder content. In production, implement web scraping for OpenStax, YouTube transcripts, etc.",
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch content" });
    }
  });

  app.get("/api/modules/:id", async (req, res) => {
    try {
      const module = await storage.getModule(req.params.id);
      if (!module) {
        return res.status(404).json({ error: "Module not found" });
      }
      res.json(module);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch module" });
    }
  });

  app.get("/api/flashcards/:moduleId", async (req, res) => {
    try {
      const flashcards = await storage.getFlashcardsByModule(req.params.moduleId);
      res.json(flashcards);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch flashcards" });
    }
  });

  app.get("/api/interests", async (req, res) => {
    try {
      const userId = "user1";
      const interest = await storage.getUserInterest(userId);
      res.json(interest || null);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch interests" });
    }
  });

  app.post("/api/interests", async (req, res) => {
    try {
      const userId = "user1";
      const data = insertUserInterestSchema.parse({
        ...req.body,
        userId,
      });
      const interest = await storage.createOrUpdateUserInterest(data);
      res.json(interest);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to save interests" });
    }
  });

  app.post("/api/enrollments", async (req, res) => {
    try {
      const userId = "user1";
      const { courseId } = req.body;
      
      const existing = await storage.getEnrollment(userId, courseId);
      if (existing) {
        return res.json(existing);
      }

      const enrollment = await storage.createEnrollment({ userId, courseId });
      res.json(enrollment);
    } catch (error) {
      res.status(500).json({ error: "Failed to enroll in course" });
    }
  });

  app.get("/api/enrollments/:courseId", async (req, res) => {
    try {
      const userId = "user1";
      const enrollment = await storage.getEnrollment(userId, req.params.courseId);
      res.json(enrollment || null);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch enrollment" });
    }
  });

  app.get("/api/progress/:courseId", async (req, res) => {
    try {
      const userId = "user1";
      const progress = await storage.getUserProgressForCourse(userId, req.params.courseId);
      res.json(progress);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch progress" });
    }
  });

  app.get("/api/progress/module/:moduleId", async (req, res) => {
    try {
      const userId = "user1";
      const progress = await storage.getUserProgress(userId, req.params.moduleId);
      res.json(progress || null);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch module progress" });
    }
  });

  app.post("/api/progress/:moduleId", async (req, res) => {
    try {
      const userId = "user1";
      const data = insertUserProgressSchema.parse({
        ...req.body,
        userId,
        moduleId: req.params.moduleId,
      });
      const progress = await storage.createOrUpdateUserProgress(data);
      res.json(progress);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to update progress" });
    }
  });

  app.post("/api/flashcard-progress", async (req, res) => {
    try {
      const userId = "user1";
      const { flashcardId, correct } = req.body;

      const existing = await storage.getFlashcardProgress(userId, flashcardId);
      
      if (existing) {
        const updated = await storage.updateFlashcardProgress(existing.id, {
          correct: correct ? existing.correct + 1 : existing.correct,
          incorrect: !correct ? existing.incorrect + 1 : existing.incorrect,
          lastReviewed: new Date(),
        });
        return res.json(updated);
      }

      const progress = await storage.createFlashcardProgress({
        userId,
        flashcardId,
        correct: correct ? 1 : 0,
        incorrect: correct ? 0 : 1,
        lastReviewed: new Date(),
      });
      res.json(progress);
    } catch (error) {
      res.status(500).json({ error: "Failed to record flashcard progress" });
    }
  });

  app.post("/api/understanding-check", async (req, res) => {
    try {
      const userId = "user1";
      const { moduleId, userExplanation } = req.body;

      const module = await storage.getModule(moduleId);
      if (!module) {
        return res.status(404).json({ error: "Module not found" });
      }

      const validation = await validateUnderstanding(module.content, userExplanation);

      const check = await storage.createUnderstandingCheck({
        userId,
        moduleId,
        userExplanation,
        aiFeedback: validation.feedback,
        score: validation.score,
        areasForImprovement: validation.areasForImprovement,
      });

      res.json(check);
    } catch (error: any) {
      console.error("Understanding check error:", error);
      res.status(500).json({ error: error?.message || "Failed to validate understanding" });
    }
  });

  app.get("/api/admin/courses", async (req, res) => {
    try {
      const courses = await storage.getAllCourses();
      res.json(courses);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch courses" });
    }
  });

  app.get("/api/admin/stats", async (req, res) => {
    try {
      const stats = await storage.getAdminStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
