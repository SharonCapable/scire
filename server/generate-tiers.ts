// Script to generate tiers for all courses that don't have them yet
import { storage } from "./storage";
import { generateCourseTiers, generateFlashcards } from "./gemini";

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
            console.log(`  → Generating tiers with AI...`);
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
                    const moduleData = tierData.modules[i];
                    console.log(`      → Creating module ${i + 1}/${tierData.modules.length}: ${moduleData.title}`);

                    const module = await storage.createModule({
                        tierId: tier.id,
                        title: moduleData.title,
                        content: moduleData.content,
                        order: i,
                        estimatedMinutes: moduleData.estimatedMinutes || 15,
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
