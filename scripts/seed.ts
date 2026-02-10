import dotenv from 'dotenv';
import path from 'path';

// Load env before anything else
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// Now we can import db
import { db } from "@/db";
import { users, clients, tasks } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

async function seed() {
  console.log("🌱 Seeding database...");

  try {
    // Check if manager already exists
    const existingManager = await db.query.users.findFirst({
      where: eq(users.email, "manager@vaultlog.local"),
    });

    if (existingManager) {
      console.log("⚠️  Manager account already exists, skipping user creation");
    } else {
      // Create manager user
      const managerPassword = await bcrypt.hash("manager123", 10);
      await db.insert(users).values({
        email: "manager@vaultlog.local",
        name: "John Manager",
        password: managerPassword,
        role: "MANAGER",
        active: true,
      }).returning();

      console.log("✅ Manager user created");

      // Create staff users
      const staffPassword1 = await bcrypt.hash("staff123", 10);
      await db.insert(users).values({
        email: "alice@vaultlog.local",
        name: "Alice Johnson",
        password: staffPassword1,
        role: "STAFF",
        active: true,
      });

      const staffPassword2 = await bcrypt.hash("staff123", 10);
      await db.insert(users).values({
        email: "bob@vaultlog.local",
        name: "Bob Smith",
        password: staffPassword2,
        role: "STAFF",
        active: true,
      });

      const staffPassword3 = await bcrypt.hash("staff123", 10);
      await db.insert(users).values({
        email: "carol@vaultlog.local",
        name: "Carol Davis",
        password: staffPassword3,
        role: "STAFF",
        active: true,
      });

      console.log("✅ Staff users created (Alice, Bob, Carol)");
    }

    // Get all users for task assignment
    const allUsers = await db.query.users.findMany();
    const manager = allUsers.find(u => u.role === "MANAGER");
    const staffUsers = allUsers.filter(u => u.role === "STAFF");

    if (!manager || staffUsers.length === 0) {
      throw new Error("Manager or staff users not found");
    }

    // Check if clients already exist
    const existingClients = await db.query.clients.findMany();

    if (existingClients.length === 0) {
      // Create sample clients
      const clientsData = await db.insert(clients).values([
        {
          name: "Acme Corp",
          description: "Primary client - E-commerce platform",
          status: "ACTIVE",
        },
        {
          name: "TechStart Inc",
          description: "Secondary client - SaaS application",
          status: "ACTIVE",
        },
        {
          name: "Global Solutions Ltd",
          description: "Enterprise client - Infrastructure",
          status: "ACTIVE",
        },
      ]).returning();

      console.log("✅ Sample clients created");

      // Create sample tasks
      const sampleTasks = [
        {
          clientId: clientsData[0].id,
          title: "Fix login page bug",
          description: "Users are unable to login with special characters in password",
          category: "Bug Fix",
          priority: "HIGH",
          status: "IN_PROGRESS",
          assignedToId: staffUsers[0].id,
        },
        {
          clientId: clientsData[0].id,
          title: "Implement payment gateway",
          description: "Integrate Stripe payment processing",
          category: "Development",
          priority: "URGENT",
          status: "IN_PROGRESS",
          assignedToId: staffUsers[1].id,
        },
        {
          clientId: clientsData[0].id,
          title: "Database optimization",
          description: "Optimize slow queries in user dashboard",
          category: "Maintenance",
          priority: "MEDIUM",
          status: "NEW",
          assignedToId: staffUsers[2].id,
        },
        {
          clientId: clientsData[1].id,
          title: "Add dark mode support",
          description: "Implement dark mode theme for the application",
          category: "Feature Request",
          priority: "MEDIUM",
          status: "NEW",
          assignedToId: staffUsers[0].id,
        },
        {
          clientId: clientsData[1].id,
          title: "API rate limiting",
          description: "Implement rate limiting for API endpoints",
          category: "Development",
          priority: "HIGH",
          status: "BLOCKED",
          assignedToId: staffUsers[1].id,
        },
        {
          clientId: clientsData[1].id,
          title: "Update documentation",
          description: "Update API documentation for v2.0",
          category: "Support",
          priority: "LOW",
          status: "COMPLETED",
          assignedToId: staffUsers[2].id,
        },
        {
          clientId: clientsData[2].id,
          title: "Server migration",
          description: "Migrate from AWS to Azure",
          category: "Maintenance",
          priority: "URGENT",
          status: "IN_PROGRESS",
          assignedToId: staffUsers[0].id,
        },
        {
          clientId: clientsData[2].id,
          title: "Security audit",
          description: "Perform comprehensive security audit",
          category: "Support",
          priority: "HIGH",
          status: "NEW",
          assignedToId: staffUsers[1].id,
        },
      ];

      for (const taskData of sampleTasks) {
        await db.insert(tasks).values({
          clientId: taskData.clientId,
          title: taskData.title,
          description: taskData.description,
          category: taskData.category,
          priority: taskData.priority as "LOW" | "MEDIUM" | "HIGH" | "URGENT",
          status: taskData.status as "NEW" | "IN_PROGRESS" | "BLOCKED" | "COMPLETED" | "ARCHIVED",
          assignedToId: taskData.assignedToId,
          createdById: manager.id,
        });
      }

      console.log("✅ Sample tasks created");
    } else {
      console.log("⚠️  Clients and tasks already exist, skipping creation");
    }

    console.log("\n📋 Seed Summary:");
    console.log("================");
    console.log("Admin Account:");
    console.log("  Email: admin@vaultlog.local");
    console.log("  Password: admin123");
    console.log("\nManager Account:");
    console.log("  Email: manager@vaultlog.local");
    console.log("  Password: manager123");
    console.log("\nStaff Accounts:");
    console.log("  Email: alice@vaultlog.local | Password: staff123");
    console.log("  Email: bob@vaultlog.local | Password: staff123");
    console.log("  Email: carol@vaultlog.local | Password: staff123");
    console.log("\nClients: 3 (Acme Corp, TechStart Inc, Global Solutions Ltd)");
    console.log("Tasks: 8 (various statuses and priorities)");
    console.log("================");
    console.log("✅ Seed completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  }
}

seed();
