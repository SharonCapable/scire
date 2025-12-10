import { storage } from "./storage";
import { sampleCourses } from "./sample-courses";

let seeded = false;

/**
 * Clear development sample courses
 * Use this when switching to production with real API data
 */
export async function clearSampleCourses() {
  console.log("🗑️  Clearing sample development courses...");

  const allCourses = await storage.getAllCourses();
  let deleted = 0;

  for (const course of allCourses) {
    // Only delete courses that match our sample course titles
    const isSampleCourse = sampleCourses.some(sc => sc.title === course.title);

    if (isSampleCourse) {
      await storage.deleteCourse(course.id);
      console.log(`   ✓ Deleted: ${course.title}`);
      deleted++;
    }
  }

  console.log(`✅ Cleared ${deleted} sample courses`);
  return deleted;
}

export async function seedDatabase(useSampleCourses: boolean = true) {
  if (seeded) return;

  try {
    // Check if admin user exists
    let admin = await storage.getUserByUsername("admin");

    if (!admin) {
      console.log("Seeding database with admin user...");
      admin = await storage.createUser({
        username: "admin",
        password: "admin123", // Change this in production!
        email: "admin@scire.app",
        isAdmin: true,
        provider: "local",
      });
      console.log("Admin user created successfully");
    }

    // Only seed sample courses if requested (for development)
    if (useSampleCourses) {
      const existingCourses = await storage.getAllCourses();

      if (existingCourses.length === 0) {
        console.log("Seeding database with sample courses...");

        for (const courseData of sampleCourses) {
          await storage.createCourse({
            ...courseData,
            createdBy: admin.id,
          });
        }

        console.log(`${sampleCourses.length} sample courses created successfully`);
      }
    }

    seeded = true;
  } catch (error) {
    console.error("Error seeding database:", error);
  }
}
