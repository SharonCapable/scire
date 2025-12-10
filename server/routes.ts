import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { seedDatabase } from "./seed";
import {
  generateCourseTiers,
  generateFlashcards,
  validateUnderstanding,
  curateCoursesForInterests,
  generateCourseStructure,
  generateModuleContent,
  generateQuiz,
  generateUnderstandingPrompt
} from "./gemini";

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

      const data = {
        ...req.body,
        createdBy: admin.id,
      };
      const course = await storage.createCourse(data);
      res.json(course);
    } catch (error) {
      res.status(500).json({ error: "Failed to create course" });
    }
  });

  app.put("/api/courses/:id", async (req, res) => {
    try {
      const data = req.body;
      const course = await storage.updateCourse(req.params.id, data);
      if (!course) {
        return res.status(404).json({ error: "Course not found" });
      }
      res.json(course);
    } catch (error) {
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

      const data = {
        ...req.body,
        userId,
      };
      const interest = await storage.createOrUpdateUserInterest(data);
      res.json(interest);
    } catch (error) {
      res.status(500).json({ error: "Failed to save interests" });
    }
  });

  app.post("/api/recommendations", async (req, res) => {
    try {
      const { topics, learningGoals, skillLevel } = req.body;

      if (!topics || topics.length === 0) {
        return res.status(400).json({ error: "Topics are required" });
      }

      // Get all courses from database
      const courses = await storage.getAllCourses();

      if (courses.length === 0) {
        return res.json({
          recommendations: [],
          message: "No courses available yet. Try adding some interests and we'll generate personalized courses for you!"
        });
      }

      // Check if we have a relevant course for the primary topic
      const primaryTopic = topics[0];
      const hasRelevantCourse = courses.some(c => c.title.toLowerCase().includes(primaryTopic.toLowerCase()));

      if (!hasRelevantCourse) {
        console.log(`Generating new course for topic: ${primaryTopic}`);
        try {
          // Generate structure
          const structure = await generateCourseStructure(primaryTopic, learningGoals || "General knowledge");

          // Create course
          const newCourse = await storage.createCourse({
            title: structure.title,
            description: structure.description,
            sourceType: "ai_generated",
            content: "AI Generated Course",
            createdBy: "system"
          });

          // Create tiers & modules
          const tierLevelOrder: { [key: string]: number } = { start: 0, intermediate: 1, advanced: 2 };

          for (const tierData of structure.tiers) {
            const tier = await storage.createTier({
              courseId: newCourse.id,
              level: tierData.level,
              title: tierData.title,
              description: tierData.description,
              order: tierLevelOrder[tierData.level] || 0
            });

            for (let i = 0; i < tierData.modules.length; i++) {
              const modData = tierData.modules[i];

              // Generate content for START tier immediately, others placeholder
              let content = "Content is being generated. Please check back later.";
              if (tierData.level === 'start') {
                content = await generateModuleContent(modData.title, modData.summary, structure.title);
              }

              const module = await storage.createModule({
                tierId: tier.id,
                title: modData.title,
                content: content,
                order: i,
                estimatedMinutes: modData.estimatedMinutes
              });

              // Generate assessments for START tier
              if (tierData.level === 'start') {
                const quiz = await generateQuiz(content, modData.title);
                await storage.createAssessment({
                  moduleId: module.id,
                  type: "quiz",
                  title: "Quiz",
                  questions: quiz,
                  order: 0
                });

                const check = await generateUnderstandingPrompt(content, modData.title);
                await storage.createAssessment({
                  moduleId: module.id,
                  type: "understanding",
                  title: "Check",
                  prompt: check.prompt,
                  rubric: check.rubric,
                  order: 1
                });
              }
            }
          }

          // Return the new course
          return res.json({
            recommendations: [{
              courseId: newCourse.id,
              course: newCourse,
              reason: "Custom generated course for your interest",
              suggestedTier: "start"
            }]
          });

        } catch (error) {
          console.error("Failed to generate course:", error);
          // Fallback to standard curation if generation fails
        }
      }

      try {
        // Use AI to intelligently curate courses
        const recommendations = await curateCoursesForInterests(
          topics,
          learningGoals || "General learning",
          courses
        );

        // If AI returns no recommendations, suggest course generation
        if (!recommendations || recommendations.length === 0) {
          return res.json({
            recommendations: [],
            suggestGeneration: true,
            message: `We couldn't find existing courses matching "${topics.join(', ')}". Would you like us to generate a personalized learning path for you?`
          });
        }

        res.json({
          recommendations,
          message: `Found ${recommendations.length} courses curated for your interests and skill level`
        });
      } catch (aiError) {
        console.error("AI recommendation failed:", aiError);

        // Fallback: Simple keyword matching with skill level consideration
        const fallbackRecs = courses
          .map(course => {
            let score = 0;
            const searchText = `${course.title} ${course.description}`.toLowerCase();

            for (const topic of topics) {
              if (searchText.includes(topic.toLowerCase())) {
                score += 10;
              }
            }

            return score > 0 ? {
              courseId: course.id,
              course: {
                id: course.id,
                title: course.title,
                description: course.description,
                sourceType: course.sourceType
              },
              reason: `Matches your interest in ${topics.join(', ')}`,
              suggestedTier: skillLevel === 'beginner' ? 'start' : skillLevel === 'advanced' ? 'advanced' : 'intermediate'
            } : null;
          })
          .filter(r => r !== null)
          .slice(0, 10);

        res.json({
          recommendations: fallbackRecs,
          message: "Recommendations based on keyword matching (AI temporarily unavailable)"
        });
      }
    } catch (error) {
      console.error("Recommendations error:", error);
      res.status(500).json({ error: "Failed to generate recommendations" });
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

      const enrollment = await storage.enrollUserInCourse({ userId, courseId });
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
      const progressPercent = await storage.getCourseProgress(userId, req.params.courseId);
      res.json(progressPercent);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch progress" });
    }
  });

  app.get("/api/progress/:courseId/details", async (req, res) => {
    try {
      const userId = "user1";
      const details = await storage.getCourseProgressDetails(userId, req.params.courseId);
      res.json(details);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch progress details" });
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

      const data = {
        ...req.body,
        userId,
        moduleId: req.params.moduleId,
      };
      const progress = await storage.updateUserProgress(data);
      res.json(progress);
    } catch (error) {
      res.status(500).json({ error: "Failed to update progress" });
    }
  });

  app.post("/api/flashcard-progress", async (req, res) => {
    try {
      const userId = "user1";
      const { flashcardId, correct } = req.body;

      const existing = await storage.getFlashcardProgress(userId, flashcardId);

      const flashcardProgress = await storage.updateFlashcardProgress({
        userId,
        flashcardId,
        correct: existing ? (correct ? existing.correct + 1 : existing.correct) : (correct ? 1 : 0),
        incorrect: existing ? (!correct ? existing.incorrect + 1 : existing.incorrect) : (!correct ? 1 : 0),
        lastReviewed: new Date(),
      });
      res.json(flashcardProgress);
    } catch (error) {
      res.status(500).json({ error: "Failed to record flashcard progress" });
    }
  });

  // Assessment Routes
  app.get("/api/modules/:moduleId/assessments", async (req, res) => {
    try {
      const assessments = await storage.getAssessmentsByModule(req.params.moduleId);
      res.json(assessments);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch assessments" });
    }
  });

  app.post("/api/modules/:moduleId/validate", async (req, res) => {
    try {
      const { explanation } = req.body;
      const moduleId = req.params.moduleId;
      const userId = "user1"; // TODO: Get from auth

      const module = await storage.getModule(moduleId);
      if (!module) {
        return res.status(404).json({ error: "Module not found" });
      }

      const validation = await validateUnderstanding(module.content, explanation);

      const check = await storage.createUnderstandingCheck({
        userId,
        moduleId,
        userExplanation: explanation,
        aiFeedback: validation.feedback,
        score: validation.score,
        areasForImprovement: validation.areasForImprovement,
      });

      res.json({
        score: check.score,
        feedback: check.aiFeedback,
        areasForImprovement: check.areasForImprovement
      });
    } catch (error: any) {
      console.error("Understanding check error:", error);
      res.status(500).json({ error: error?.message || "Failed to validate understanding" });
    }
  });

  // Legacy endpoint - keep for backward compatibility if needed, or remove
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

  // User Dashboard Routes
  app.get("/api/user/enrolled-courses", async (req: any, res) => {
    try {
      const userId = req.user?.id || "user1"; // Fallback for development
      const enrollments = await storage.getUserEnrollments(userId);
      res.json(enrollments);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch enrolled courses" });
    }
  });

  app.get("/api/user/stats", async (req: any, res) => {
    try {
      const userId = req.user?.id || "user1"; // Fallback for development
      const stats = await storage.getUserStats(userId);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch user stats" });
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
