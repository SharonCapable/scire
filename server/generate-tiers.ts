// Script to generate tiers for all courses that don't have them yet
import { storage } from "./storage";
import { generateCourseTiers, generateFlashcards, generateModuleContent } from "./gemini";

async function generateTiersForAllCourses() {
    console.log("Starting tier generation for all courses...\n");

    const courses = await storage.getAllCourses();

    for (const course of courses) {
        console.log(`\nProcessing: ${course.title}`);
        console.log(`Course ID: ${course.id}`);

        // Check if tiers already exist
        const existingTiers = await storage.getTiersByCourse(course.id);

        if (existingTiers.length > 0) {
            console.log(`  ✓ Already has ${existingTiers.length} tiers, skipping...`);
            continue;
        }

        try {
            console.log(`  → Generating tier outline with AI...`);
            // Step 1: Generate Outline (Tiers + Module Summaries)
            const tiersData = await generateCourseTiers(course.content, course.title);

            const tierLevelOrder: { [key: string]: number } = {
                start: 0,
                intermediate: 1,
                advanced: 2
            };

            for (const tierData of tiersData) {
                console.log(`    → Creating tier: ${tierData.title} (${tierData.level})`);

                const tier = await storage.createTier({
                    courseId: course.id,
                    level: tierData.level,
                    title: tierData.title,
                    description: tierData.description || "",
                    order: tierLevelOrder[tierData.level] || 0,
                });

                for (let i = 0; i < tierData.modules.length; i++) {
                    const moduleSummary = tierData.modules[i];
                    console.log(`      → Generating content for module ${i + 1}/${tierData.modules.length}: ${moduleSummary.title}`);

                    // Step 2: Generate Full Content + Image Keyword
                    let moduleContentData;
                    try {
                        moduleContentData = await generateModuleContent(
                            moduleSummary.title,
                            moduleSummary.summary || "Comprehensive educational module",
                            course.title
                        );
                    } catch (err) {
                        console.error("        ✗ Failed to generate content, retrying...", err);
                        // Retry once
                        moduleContentData = await generateModuleContent(
                            moduleSummary.title,
                            moduleSummary.summary || "Comprehensive educational module",
                            course.title
                        );
                    }

                    // Generate Image URL from keyword
                    const imageKeyword = moduleContentData.imageKeyword || moduleSummary.title;
                    const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(imageKeyword)}?width=800&height=400&nologo=true`;

                    const module = await storage.createModule({
                        tierId: tier.id,
                        title: moduleSummary.title,
                        content: moduleContentData.content,
                        imageUrl: imageUrl,
                        order: i,
                        estimatedMinutes: moduleSummary.estimatedMinutes || 20,
                    });

                    console.log(`        → Generating flashcards...`);
                    const flashcardsData = await generateFlashcards(module.content, module.title, 5);

                    for (let j = 0; j < flashcardsData.length; j++) {
                        await storage.createFlashcard({
                            moduleId: module.id,
                            question: flashcardsData[j].question,
                            answer: flashcardsData[j].answer,
                            order: j,
                        });
                    }
                    console.log(`        ✓ Created ${flashcardsData.length} flashcards`);
                }
            }

            console.log(`  ✓ Successfully generated ${tiersData.length} tiers for "${course.title}"`);

        } catch (error: any) {
            console.error(`  ✗ Error generating tiers for "${course.title}":`, error.message);
        }
    }

    console.log("\n✓ Tier generation complete!");
    process.exit(0);
}

// Run the script
generateTiersForAllCourses().catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
});
