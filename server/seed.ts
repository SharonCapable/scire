import { db } from "./db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";

export async function seedDatabase() {
  const existingAdmin = await db.select().from(users).where(eq(users.username, "admin"));
  
  if (existingAdmin.length === 0) {
    await db.insert(users).values({
      username: "admin",
      password: "admin123",
      isAdmin: true,
    });
    console.log("✅ Admin user created (username: admin, password: admin123)");
  }

  const existingUser = await db.select().from(users).where(eq(users.username, "user1"));
  
  if (existingUser.length === 0) {
    await db.insert(users).values({
      id: "user1",
      username: "user1",
      password: "user123",
      isAdmin: false,
    });
    console.log("✅ Default learner user created (id: user1, username: user1)");
  }
}
