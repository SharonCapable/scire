import { storage } from "./storage";
import { generateQuiz, generateUnderstandingPrompt } from "./gemini";

async function generateAssessmentsForAllModules() {
    console.log("Starting assessment generation for all modules...\n");

    const courses = await storage.getAllCourses();

    for (const course of courses) {
        console.log(`\nProcessing Course: ${course.title}`);

        const tiers = await storage.getTiersByCourse(course.id);

        for (const tier of tiers) {
            console.log(`  Tier: ${tier.title} (${tier.level})`);
            const modules = await storage.getModulesByTier(tier.id);

            for (const module of modules) {
                console.log(`    Module: ${module.title}`);

                // Check if assessments already exist
                const existingAssessments = await storage.getAssessmentsByModule(module.id);

                if (existingAssessments.length > 0) {
                    console.log(`      ✓ Already has ${existingAssessments.length} assessments, skipping...`);
                    continue;
                }

                try {
                    // Generate Quiz
                    console.log(`      → Generating quiz...`);
                    const quizQuestions = await generateQuiz(module.content, module.title);
                    await storage.createAssessment({
                        moduleId: module.id,
                        type: "quiz",
                        title: "Module Quiz",
                        questions: quizQuestions,
                        order: 0
                    });
                    console.log(`      ✓ Created quiz with ${quizQuestions.length} questions`);

                    // Generate Understanding Check
                    console.log(`      → Generating understanding check...`);
                    const understandingData = await generateUnderstandingPrompt(module.content, module.title);
                    await storage.createAssessment({
                        moduleId: module.id,
                        type: "understanding",
                        title: "Understanding Check",
                        prompt: understandingData.prompt,
                        rubric: understandingData.rubric,
                        order: 1
                    });
                    console.log(`      ✓ Created understanding check`);

                } catch (error: any) {
                    console.error(`      ✗ Error generating assessments for module "${module.title}":`, error.message);
                }
            }
        }
    }

    console.log("\n✓ Assessment generation complete!");
    process.exit(0);
}

// Run the script
generateAssessmentsForAllModules().catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
});
