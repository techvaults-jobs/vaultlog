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
          name: "CustodianPLC",
          description: "Financial custodian services and asset management",
          status: "ACTIVE",
        },
        {
          name: "SAHCO",
          description: "Airport ground handling and cargo services",
          status: "ACTIVE",
        },
        {
          name: "ElsaTech",
          description: "Technology solutions and cloud infrastructure",
          status: "ACTIVE",
        },
        {
          name: "Acme Corp",
          description: "E-commerce platform and retail solutions",
          status: "ACTIVE",
        },
        {
          name: "TechStart Inc",
          description: "SaaS application and software development",
          status: "ACTIVE",
        },
        {
          name: "Global Solutions Ltd",
          description: "Enterprise infrastructure and consulting",
          status: "ACTIVE",
        },
        {
          name: "FinanceHub",
          description: "Financial technology and payment processing",
          status: "ACTIVE",
        },
        {
          name: "CloudNine Systems",
          description: "Cloud computing and data center operations",
          status: "ACTIVE",
        },
      ]).returning();

      console.log("✅ 8 clients created");

      // Create comprehensive sample tasks
      const sampleTasks = [
        // CustodianPLC tasks
        {
          clientId: clientsData[0].id,
          title: "System Security Audit and Compliance Review",
          description: "Conduct comprehensive security audit of custodial systems, review compliance with regulatory requirements, identify vulnerabilities, and provide remediation recommendations. Include penetration testing and access control review.",
          category: "Security",
          priority: "URGENT",
          status: "IN_PROGRESS",
          assignedToId: staffUsers[0].id,
        },
        {
          clientId: clientsData[0].id,
          title: "Implement Multi-Factor Authentication",
          description: "Deploy MFA across all user accounts and administrative interfaces to enhance security posture",
          category: "Development",
          priority: "HIGH",
          status: "IN_PROGRESS",
          assignedToId: staffUsers[1].id,
        },
        {
          clientId: clientsData[0].id,
          title: "Database Backup and Disaster Recovery Plan",
          description: "Design and implement comprehensive backup strategy with automated recovery procedures",
          category: "Maintenance",
          priority: "HIGH",
          status: "NEW",
          assignedToId: staffUsers[2].id,
        },
        // SAHCO tasks
        {
          clientId: clientsData[1].id,
          title: "Airport Operations Dashboard Development",
          description: "Design and develop real-time operations dashboard for airport ground handling services. Include flight tracking, resource allocation, staff scheduling, and performance metrics. Integrate with existing airport management systems.",
          category: "Development",
          priority: "HIGH",
          status: "IN_PROGRESS",
          assignedToId: staffUsers[0].id,
        },
        {
          clientId: clientsData[1].id,
          title: "Cargo Management System Integration",
          description: "Integrate cargo tracking system with customs and logistics partners for seamless operations",
          category: "Development",
          priority: "MEDIUM",
          status: "NEW",
          assignedToId: staffUsers[1].id,
        },
        {
          clientId: clientsData[1].id,
          title: "Staff Scheduling Optimization",
          description: "Implement AI-based staff scheduling to optimize resource allocation and reduce operational costs",
          category: "Feature Request",
          priority: "MEDIUM",
          status: "BLOCKED",
          assignedToId: staffUsers[2].id,
        },
        // ElsaTech tasks
        {
          clientId: clientsData[2].id,
          title: "Cloud Infrastructure Migration and Optimization",
          description: "Plan and execute migration of on-premises infrastructure to cloud environment. Optimize resource allocation, implement auto-scaling, set up monitoring and alerting, ensure zero-downtime deployment, and provide team training on cloud operations.",
          category: "Infrastructure",
          priority: "HIGH",
          status: "IN_PROGRESS",
          assignedToId: staffUsers[0].id,
        },
        {
          clientId: clientsData[2].id,
          title: "Kubernetes Cluster Setup and Management",
          description: "Deploy and configure production-grade Kubernetes clusters with high availability and disaster recovery",
          category: "Infrastructure",
          priority: "HIGH",
          status: "IN_PROGRESS",
          assignedToId: staffUsers[1].id,
        },
        {
          clientId: clientsData[2].id,
          title: "CI/CD Pipeline Implementation",
          description: "Build automated deployment pipeline with testing, staging, and production environments",
          category: "Development",
          priority: "MEDIUM",
          status: "NEW",
          assignedToId: staffUsers[2].id,
        },
        // Acme Corp tasks
        {
          clientId: clientsData[3].id,
          title: "Fix login page bug",
          description: "Users are unable to login with special characters in password",
          category: "Bug Fix",
          priority: "HIGH",
          status: "IN_PROGRESS",
          assignedToId: staffUsers[0].id,
        },
        {
          clientId: clientsData[3].id,
          title: "Implement payment gateway",
          description: "Integrate Stripe payment processing with support for multiple currencies",
          category: "Development",
          priority: "URGENT",
          status: "IN_PROGRESS",
          assignedToId: staffUsers[1].id,
        },
        {
          clientId: clientsData[3].id,
          title: "Database optimization",
          description: "Optimize slow queries in user dashboard and reporting modules",
          category: "Maintenance",
          priority: "MEDIUM",
          status: "NEW",
          assignedToId: staffUsers[2].id,
        },
        // TechStart Inc tasks
        {
          clientId: clientsData[4].id,
          title: "Add dark mode support",
          description: "Implement dark mode theme for the application with user preference persistence",
          category: "Feature Request",
          priority: "MEDIUM",
          status: "NEW",
          assignedToId: staffUsers[0].id,
        },
        {
          clientId: clientsData[4].id,
          title: "API rate limiting",
          description: "Implement rate limiting for API endpoints to prevent abuse and ensure stability",
          category: "Development",
          priority: "HIGH",
          status: "BLOCKED",
          assignedToId: staffUsers[1].id,
        },
        {
          clientId: clientsData[4].id,
          title: "Update documentation",
          description: "Update API documentation for v2.0 with new endpoints and examples",
          category: "Support",
          priority: "LOW",
          status: "COMPLETED",
          assignedToId: staffUsers[2].id,
        },
        // Global Solutions Ltd tasks
        {
          clientId: clientsData[5].id,
          title: "Server migration",
          description: "Migrate from AWS to Azure with minimal downtime",
          category: "Maintenance",
          priority: "URGENT",
          status: "IN_PROGRESS",
          assignedToId: staffUsers[0].id,
        },
        {
          clientId: clientsData[5].id,
          title: "Security audit",
          description: "Perform comprehensive security audit and penetration testing",
          category: "Support",
          priority: "HIGH",
          status: "NEW",
          assignedToId: staffUsers[1].id,
        },
        {
          clientId: clientsData[5].id,
          title: "Network infrastructure upgrade",
          description: "Upgrade network infrastructure to support increased traffic and redundancy",
          category: "Infrastructure",
          priority: "MEDIUM",
          status: "NEW",
          assignedToId: staffUsers[2].id,
        },
        // FinanceHub tasks
        {
          clientId: clientsData[6].id,
          title: "PCI DSS Compliance Implementation",
          description: "Implement Payment Card Industry Data Security Standard compliance across all systems",
          category: "Security",
          priority: "URGENT",
          status: "IN_PROGRESS",
          assignedToId: staffUsers[0].id,
        },
        {
          clientId: clientsData[6].id,
          title: "Real-time Transaction Monitoring",
          description: "Develop real-time fraud detection and transaction monitoring system",
          category: "Development",
          priority: "HIGH",
          status: "IN_PROGRESS",
          assignedToId: staffUsers[1].id,
        },
        // CloudNine Systems tasks
        {
          clientId: clientsData[7].id,
          title: "Data Center Redundancy Setup",
          description: "Implement multi-region data center redundancy with automatic failover",
          category: "Infrastructure",
          priority: "HIGH",
          status: "IN_PROGRESS",
          assignedToId: staffUsers[2].id,
        },
        {
          clientId: clientsData[7].id,
          title: "Disaster Recovery Plan",
          description: "Create and test comprehensive disaster recovery procedures",
          category: "Support",
          priority: "HIGH",
          status: "NEW",
          assignedToId: staffUsers[0].id,
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

      console.log("✅ 22 sample tasks created");
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
    console.log("\nClients: 8");
    console.log("  • CustodianPLC - Financial custodian services");
    console.log("  • SAHCO - Airport ground handling");
    console.log("  • ElsaTech - Technology solutions");
    console.log("  • Acme Corp - E-commerce platform");
    console.log("  • TechStart Inc - SaaS application");
    console.log("  • Global Solutions Ltd - Enterprise infrastructure");
    console.log("  • FinanceHub - Financial technology");
    console.log("  • CloudNine Systems - Cloud computing");
    console.log("\nTasks: 22 (various statuses and priorities)");
    console.log("================");
    console.log("✅ Seed completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  }
}

seed();
