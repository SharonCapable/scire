import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { seedDatabase } from "./seed";
import { requireAuth, optionalAuth } from "./auth";
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

  // Public courses endpoint - excludes personalized courses
  app.get("/api/courses", async (req, res) => {
    try {
      const allCourses = await storage.getAllCourses();
      // Filter out personalized courses from public browse
      const publicCourses = allCourses.filter(
        (course) => !course.isPersonalized
      );
      res.json(publicCourses);
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

  // Get modules by tier for navigation
  app.get("/api/tiers/:tierId/modules", async (req, res) => {
    try {
      const modules = await storage.getModulesByTier(req.params.tierId);
      res.json(modules);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch modules" });
    }
  });

  // Get tier by ID
  app.get("/api/tiers/:tierId", async (req, res) => {
    try {
      const tier = await storage.getTier(req.params.tierId);
      if (!tier) {
        return res.status(404).json({ error: "Tier not found" });
      }
      res.json(tier);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch tier" });
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

  // Generate flashcards for a module
  app.post("/api/modules/:moduleId/generate-flashcards", async (req, res) => {
    try {
      const moduleId = req.params.moduleId;

      // Get the module content
      const module = await storage.getModule(moduleId);
      if (!module) {
        return res.status(404).json({ error: "Module not found" });
      }

      // Check if flashcards already exist
      const existingFlashcards = await storage.getFlashcardsByModule(moduleId);
      if (existingFlashcards.length > 0) {
        return res.json(existingFlashcards);
      }

      // Generate flashcards using AI
      const prompt = `Based on the following educational content, generate 5-8 flashcards. Each flashcard should test understanding of key concepts.

Content:
${module.content.substring(0, 3000)}

Return ONLY a valid JSON array of flashcards in this exact format, with no additional text:
[
  {"question": "What is...", "answer": "..."},
  {"question": "How does...", "answer": "..."}
]`;

      const { GoogleGenerativeAI } = await import("@google/generative-ai");
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      const result = await model.generateContent(prompt);
      const responseText = result.response.text();

      // Extract JSON from response
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        console.error("Failed to parse flashcards JSON:", responseText);
        return res.status(500).json({ error: "Failed to generate flashcards" });
      }

      const flashcardsData = JSON.parse(jsonMatch[0]);

      // Save flashcards to database
      const savedFlashcards = [];
      for (let i = 0; i < flashcardsData.length; i++) {
        const fc = flashcardsData[i];
        const savedFlashcard = await storage.createFlashcard({
          moduleId,
          question: fc.question,
          answer: fc.answer,
          order: i + 1,
        });
        savedFlashcards.push(savedFlashcard);
      }

      res.json(savedFlashcards);
    } catch (error) {
      console.error("Error generating flashcards:", error);
      res.status(500).json({ error: "Failed to generate flashcards" });
    }
  });

  app.get("/api/interests", requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      const interest = await storage.getUserInterest(userId);
      res.json(interest || null);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch interests" });
    }
  });

  app.post("/api/interests", requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;

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

  // Get all user interests (array format for multiple interests)
  app.get("/api/interests/all", requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      const interests = await storage.getAllUserInterests(userId);
      res.json(interests || []);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch interests" });
    }
  });

  // User Settings endpoints
  app.get("/api/user/settings", requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      let settings = await storage.getUserSettings(userId);

      // Return default settings if none exist
      if (!settings) {
        settings = {
          id: "",
          userId,
          notifyNewCourses: true,
          notifyFlashcardReminders: true,
          notifyAssessmentReminders: true,
          flashcardReminderFrequency: "daily",
          assessmentReminderFrequency: "daily",
          preferredReminderTime: "09:00",
          createdAt: new Date() as any,
          updatedAt: new Date() as any,
        };
      }
      res.json(settings);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch settings" });
    }
  });

  app.put("/api/user/settings", requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      const settings = await storage.updateUserSettings(userId, req.body);
      res.json(settings);
    } catch (error) {
      res.status(500).json({ error: "Failed to update settings" });
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
              let imageUrl = undefined;

              if (tierData.level === 'start') {
                try {
                  const moduleContentData = await generateModuleContent(modData.title, modData.summary, structure.title);
                  content = moduleContentData.content;
                  const imageKeyword = moduleContentData.imageKeyword || modData.title;
                  imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(imageKeyword)}?width=800&height=400&nologo=true`;
                } catch (e) {
                  console.error("Failed to generate content:", e);
                  // Fallback to basic content if generation fails
                  content = `Welcome to potential content for ${modData.title}. Generation failed, please try regenerating later.`;
                }
              }

              const module = await storage.createModule({
                tierId: tier.id,
                title: modData.title,
                content: content,
                imageUrl: imageUrl,
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

  app.post("/api/enrollments", requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
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

  app.get("/api/enrollments/:courseId", requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      const enrollment = await storage.getEnrollment(userId, req.params.courseId);
      res.json(enrollment || null);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch enrollment" });
    }
  });

  app.get("/api/progress/:courseId", requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      const progressPercent = await storage.getCourseProgress(userId, req.params.courseId);
      res.json(progressPercent);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch progress" });
    }
  });

  app.get("/api/progress/:courseId/details", requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      const details = await storage.getCourseProgressDetails(userId, req.params.courseId);
      res.json(details);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch progress details" });
    }
  });

  app.get("/api/progress/module/:moduleId", requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      const progress = await storage.getUserProgress(userId, req.params.moduleId);
      res.json(progress || null);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch module progress" });
    }
  });

  app.post("/api/progress/:moduleId", requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;

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

  // Track time spent on a module
  app.post("/api/progress/:moduleId/time", requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      const { additionalMinutes } = req.body;

      if (typeof additionalMinutes !== 'number' || additionalMinutes < 0) {
        return res.status(400).json({ error: "Invalid time value" });
      }

      // Get current progress
      const currentProgress = await storage.getUserProgress(userId, req.params.moduleId);
      const currentTimeSpent = currentProgress?.timeSpentMinutes || 0;

      // Update with additional time
      const progress = await storage.updateUserProgress({
        userId,
        moduleId: req.params.moduleId,
        timeSpentMinutes: currentTimeSpent + additionalMinutes,
      });

      res.json(progress);
    } catch (error) {
      console.error("Time tracking error:", error);
      res.status(500).json({ error: "Failed to update time spent" });
    }
  });

  app.post("/api/flashcard-progress", requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
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

  // Generate flashcards for a module
  app.post("/api/modules/:moduleId/generate-flashcards", requireAuth, async (req, res) => {
    try {
      const moduleId = req.params.moduleId;
      const module = await storage.getModule(moduleId);

      if (!module) {
        return res.status(404).json({ error: "Module not found" });
      }

      // Generate flashcards using AI
      const flashcardsData = await generateFlashcards(module.content, module.title);

      const createdFlashcards = await Promise.all(
        flashcardsData.map((f: any, index: number) => storage.createFlashcard({
          moduleId,
          question: f.question,
          answer: f.answer,
          order: index,
        }))
      );

      res.json(createdFlashcards);
    } catch (error: any) {
      console.error("Flashcard generation error:", error);
      res.status(500).json({ error: error?.message || "Failed to generate flashcards" });
    }
  });

  app.post("/api/modules/:moduleId/validate", requireAuth, async (req, res) => {
    try {
      const { explanation } = req.body;
      const moduleId = req.params.moduleId;
      const userId = req.user!.id;

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
  // Legacy endpoint - keep for backward compatibility if needed, or remove
  app.post("/api/understanding-check", requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
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
  app.get("/api/user/enrolled-courses", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const enrollments = await storage.getUserEnrollments(userId);

      // Fetch full course details for each enrollment
      const coursesWithDetails = await Promise.all(
        enrollments.map(async (enrollment) => {
          const course = await storage.getCourseWithDetails(enrollment.courseId);
          if (!course) {
            return null;
          }

          // Calculate progress
          const progress = await storage.getCourseProgress(userId, enrollment.courseId);

          // Get tiers with generation status
          const tiers = course.tiers?.map((tier: any) => ({
            id: tier.id,
            level: tier.level,
            title: tier.title,
            generationStatus: tier.generationStatus || (tier.modules?.length > 0 ? 'completed' : 'locked'),
            modulesCount: tier.modules?.length || 0,
          })) || [];

          return {
            id: course.id,
            title: course.title,
            description: course.description,
            progress,
            timeSpent: 0, // Can calculate from progress entries
            isPersonalized: course.isPersonalized || false,
            generationStatus: course.generationStatus || 'completed',
            generatedForUserId: course.generatedForUserId,
            tiers,
            enrolledAt: enrollment.enrolledAt,
          };
        })
      );

      // Filter out nulls and return
      const result = coursesWithDetails.filter(Boolean);
      res.json(result);
    } catch (error) {
      console.error("[enrolled-courses] ERROR:", error);
      console.error("[enrolled-courses] Stack:", (error as Error).stack);
      res.status(500).json({ error: "Failed to fetch enrolled courses" });
    }
  });

  app.get("/api/user/stats", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
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

  app.get("/api/admin/stats", optionalAuth, async (req: any, res) => {
    try {
      // Check if user is an educator
      if (req.user && req.user.role !== 'educator') {
        return res.status(403).json({ error: "Access denied. Educators only." });
      }
      const stats = await storage.getAdminStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  });

  // User's personalized courses endpoint
  app.get("/api/user/personalized-courses", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const allCourses = await storage.getAllCourses();
      const personalizedCourses = allCourses.filter(
        (course) => course.isPersonalized && course.generatedForUserId === userId
      );
      res.json(personalizedCourses);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch personalized courses" });
    }
  });

  // Generate course from interests (Tier 1 auto-generates)
  app.post("/api/courses/generate-from-interests", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { topics, learningGoals } = req.body;

      if (!topics || topics.length === 0) {
        return res.status(400).json({ error: "Topics are required" });
      }

      const primaryTopic = topics[0];

      // Generate course structure
      const structure = await generateCourseStructure(primaryTopic, learningGoals || "General knowledge");

      // Create personalized course
      const course = await storage.createCourse({
        title: structure.title,
        description: structure.description,
        sourceType: "ai_generated",
        content: "AI Generated Course",
        createdBy: userId,
        isPersonalized: true,
        generatedForUserId: userId,
        generationStatus: "generating"
      });

      // Create tiers - only generate content for Tier 1 (start)
      const tierLevelOrder: { [key: string]: number } = { start: 0, intermediate: 1, advanced: 2 };

      for (const tierData of structure.tiers) {
        const isStartTier = tierData.level === 'start';

        const tier = await storage.createTier({
          courseId: course.id,
          level: tierData.level,
          title: tierData.title,
          description: tierData.description,
          order: tierLevelOrder[tierData.level] || 0,
          generationStatus: isStartTier ? 'completed' : 'locked'
        });

        // Only generate modules for start tier
        if (isStartTier) {
          for (let i = 0; i < tierData.modules.length; i++) {
            const modData = tierData.modules[i];
            try {
              const moduleContentData = await generateModuleContent(modData.title, modData.summary, structure.title);
              const imageKeyword = moduleContentData.imageKeyword || modData.title;
              const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(imageKeyword)}?width=800&height=400&nologo=true`;

              const module = await storage.createModule({
                tierId: tier.id,
                title: modData.title,
                content: moduleContentData.content,
                imageUrl: imageUrl,
                order: i,
                estimatedMinutes: modData.estimatedMinutes
              });

              // Generate assessments
              const quiz = await generateQuiz(moduleContentData.content, modData.title);
              await storage.createAssessment({
                moduleId: module.id,
                type: "quiz",
                title: "Quiz",
                questions: quiz,
                order: 0
              });

              const check = await generateUnderstandingPrompt(moduleContentData.content, modData.title);
              await storage.createAssessment({
                moduleId: module.id,
                type: "understanding",
                title: "Check",
                prompt: check.prompt,
                rubric: check.rubric,
                order: 1
              });
            } catch (error) {
              console.error(`Failed to generate module ${modData.title}:`, error);
              // Continue to next module even if one fails
            }
          }
        }
      }

      // Update course status to completed
      await storage.updateCourse(course.id, { generationStatus: "completed" });

      // Auto-enroll user
      await storage.enrollUserInCourse({ userId, courseId: course.id });

      // Create notification for course creation
      await storage.createNotification({
        userId,
        type: 'course_created',
        title: 'Course Created!',
        message: `Your personalized course "${structure.title}" is ready! Tier 1 is available to start learning.`,
        data: { courseId: course.id }
      });

      res.json({
        success: true,
        course: { ...course, generationStatus: "completed" },
        message: "Course generated successfully! Tier 1 is ready to learn."
      });
    } catch (error: any) {
      console.error("Generate from interests error:", error);
      res.status(500).json({ error: error?.message || "Failed to generate course" });
    }
  });

  // Generate a specific tier for a course
  app.post("/api/courses/:id/generate-tier/:tierLevel", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { id, tierLevel } = req.params;

      // Get course and verify ownership
      const course = await storage.getCourse(id);
      if (!course) {
        return res.status(404).json({ error: "Course not found" });
      }

      if (course.generatedForUserId && course.generatedForUserId !== userId) {
        return res.status(403).json({ error: "You don't have access to this course" });
      }

      // Get all tiers for this course
      const tiers = await storage.getTiersByCourse(id);
      const targetTier = tiers.find(t => t.level === tierLevel);

      if (!targetTier) {
        return res.status(404).json({ error: "Tier not found" });
      }

      // Check if previous tier is completed (can't skip tiers)
      const tierOrder = ['start', 'intermediate', 'advanced'];
      const currentTierIndex = tierOrder.indexOf(tierLevel);

      if (currentTierIndex > 0) {
        const previousTierLevel = tierOrder[currentTierIndex - 1];
        const previousTier = tiers.find(t => t.level === previousTierLevel);

        if (!previousTier || previousTier.generationStatus !== 'completed') {
          return res.status(400).json({
            error: "You must complete the previous tier before generating this one"
          });
        }
      }

      // Update tier status to generating
      await storage.updateTier(targetTier.id, { generationStatus: 'generating' });

      // Get course structure data
      const structure = await generateCourseStructure(course.title, course.description);
      const tierData = structure.tiers.find((t: any) => t.level === tierLevel);

      if (!tierData) {
        await storage.updateTier(targetTier.id, { generationStatus: 'locked' });
        return res.status(500).json({ error: "Failed to get tier structure" });
      }

      // Generate modules for this tier
      for (let i = 0; i < tierData.modules.length; i++) {
        const modData = tierData.modules[i];

        let content = "";
        let imageUrl: string | undefined;

        try {
          const moduleContentData = await generateModuleContent(modData.title, modData.summary, course.title);
          content = moduleContentData.content;
          const imageKeyword = moduleContentData.imageKeyword || modData.title;
          imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(imageKeyword)}?width=800&height=400&nologo=true`;
        } catch (e) {
          console.error("Content generation failed:", e);
          content = "Failed to generate content. Please try again.";
        }

        const module = await storage.createModule({
          tierId: targetTier.id,
          title: modData.title,
          content: content,
          imageUrl: imageUrl,
          order: i,
          estimatedMinutes: modData.estimatedMinutes
        });

        // Generate assessments
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

      // Update tier status to completed
      await storage.updateTier(targetTier.id, { generationStatus: 'completed' });

      // Create notification for tier unlock
      await storage.createNotification({
        userId,
        type: 'tier_unlocked',
        title: 'New Tier Unlocked!',
        message: `${tierLevel.charAt(0).toUpperCase() + tierLevel.slice(1)} tier is now available in "${course.title}"!`,
        data: { courseId: course.id, tierId: targetTier.id }
      });

      res.json({
        success: true,
        message: `${tierLevel} tier generated successfully!`
      });
    } catch (error: any) {
      console.error("Generate tier error:", error);
      res.status(500).json({ error: error?.message || "Failed to generate tier" });
    }
  });

  // =====================================
  // NOTIFICATION ROUTES
  // =====================================

  // Get user's notifications
  app.get("/api/notifications", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const notifications = await storage.getUserNotifications(userId);
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch notifications" });
    }
  });

  // Get unread count
  app.get("/api/notifications/unread-count", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const notifications = await storage.getUserNotifications(userId);
      const unreadCount = notifications.filter(n => !n.read).length;
      res.json({ unreadCount });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch unread count" });
    }
  });

  // Mark notification as read
  app.patch("/api/notifications/:id/read", requireAuth, async (req: any, res) => {
    try {
      await storage.markNotificationRead(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to mark notification as read" });
    }
  });

  // Mark all notifications as read
  app.post("/api/notifications/mark-all-read", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      await storage.markAllNotificationsRead(userId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to mark all notifications as read" });
    }
  });

  // DEBUG ENDPOINT - Remove after fixing
  app.get("/api/debug/user-data", optionalAuth, async (req: any, res) => {
    try {
      const userId = req.user?.id || "user1";
      const clerkUserId = req.user?.clerkId;

      const enrollments = await storage.getUserEnrollments(userId);
      const allCourses = await storage.getAllCourses();
      const personalizedCourses = allCourses.filter(c => c.isPersonalized);

      res.json({
        currentUser: {
          id: userId,
          clerkId: clerkUserId,
          fullUser: req.user
        },
        enrollments: enrollments.map(e => ({
          id: e.id,
          courseId: e.courseId,
          userId: e.userId
        })),
        personalizedCourses: personalizedCourses.map(c => ({
          id: c.id,
          title: c.title,
          generatedForUserId: c.generatedForUserId,
          createdBy: c.createdBy
        })),
        summary: {
          totalEnrollments: enrollments.length,
          totalPersonalizedCourses: personalizedCourses.length,
          userIdMatch: personalizedCourses.some(c => c.generatedForUserId === userId)
        }
      });
    } catch (error) {
      console.error("Debug endpoint error:", error);
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // WORKING MIGRATION ENDPOINT - Fixes user ID mismatch
  app.post("/api/fix-user-data", optionalAuth, async (req: any, res) => {
    try {
      const toUserId = req.user?.id;
      const fromUserId = req.body.fromUserId || "user1";

      if (!toUserId) {
        return res.status(401).json({ error: "Must be authenticated" });
      }

      console.log(`[FIX] Starting migration: ${fromUserId} → ${toUserId}`);

      const { db } = await import("./firebase");
      let stats = {
        courses: 0,
        enrollments: 0,
        progress: 0,
        notifications: 0,
        interests: 0
      };

      // Fix courses
      const coursesSnapshot = await db.collection('courses').get();
      for (const doc of coursesSnapshot.docs) {
        const course = doc.data();
        const updates: any = {};
        if (course.createdBy === fromUserId) updates.createdBy = toUserId;
        if (course.generatedForUserId === fromUserId) updates.generatedForUserId = toUserId;

        if (Object.keys(updates).length > 0) {
          await doc.ref.update(updates);
          console.log(`[FIX] Updated course: ${course.title}`);
          stats.courses++;
        }
      }

      // Fix enrollments
      const enrollmentsSnapshot = await db.collection('enrollments').where('userId', '==', fromUserId).get();
      for (const doc of enrollmentsSnapshot.docs) {
        await doc.ref.update({ userId: toUserId });
        stats.enrollments++;
      }

      // Fix progress
      const progressSnapshot = await db.collection('user_progress').where('userId', '==', fromUserId).get();
      for (const doc of progressSnapshot.docs) {
        await doc.ref.update({ userId: toUserId });
        stats.progress++;
      }

      // Fix notifications
      const notificationsSnapshot = await db.collection('notifications').where('userId', '==', fromUserId).get();
      for (const doc of notificationsSnapshot.docs) {
        await doc.ref.update({ userId: toUserId });
        stats.notifications++;
      }

      // Fix interests
      const interestsSnapshot = await db.collection('user_interests').where('userId', '==', fromUserId).get();
      for (const doc of interestsSnapshot.docs) {
        await doc.ref.update({ userId: toUserId });
        stats.interests++;
      }

      console.log(`[FIX] Migration complete:`, stats);

      res.json({
        success: true,
        message: "Data migration completed",
        stats
      });
    } catch (error) {
      console.error("[FIX] Error:", error);
      res.status(500).json({ error: (error as Error).message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
