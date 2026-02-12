import dotenv from 'dotenv';
import path from 'path';

// Load env before anything else
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// Now we can import db
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

async function createAdmin() {
  console.log("👤 Creating admin account...");

  try {
    // Check if admin already exists
    const existingAdmin = await db.query.users.findFirst({
      where: eq(users.email, "techvaults@gmail.com"),
    });

    if (existingAdmin) {
      console.log("⚠️  Admin account already exists with email: techvaults@gmail.com");
      process.exit(0);
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash("95R(nR1'>eA~\"4-9m8\\s£1\"lUfy/Vq)0Ge@W", 10);

    // Create admin user
    await db.insert(users).values({
      email: "techvaults@gmail.com",
      name: "Admin",
      password: hashedPassword,
      role: "ADMIN",
      active: true,
    }).returning();

    console.log("✅ Admin account created successfully!");
    console.log("\n📋 Admin Account Details:");
    console.log("========================");
    console.log("Email: techvaults@gmail.com");
    console.log("Password: 95R(nR1'>eA~\"4-9m8\\s£1\"lUfy/Vq)0Ge@W");
    console.log("Role: ADMIN");
    console.log("========================");
    process.exit(0);
  } catch (error) {
    console.error("❌ Failed to create admin account:", error);
    process.exit(1);
  }
}

createAdmin();
