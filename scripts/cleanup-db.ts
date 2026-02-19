import dotenv from 'dotenv';
import path from 'path';

// Load env before anything else - try both .env and .env.local
const envPath = path.resolve(process.cwd(), '.env');
const envLocalPath = path.resolve(process.cwd(), '.env.local');

dotenv.config({ path: envPath });
dotenv.config({ path: envLocalPath });

// Check if DATABASE_URL is set
if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL not found in .env or .env.local');
  console.error(`   Checked: ${envPath}`);
  console.error(`   Checked: ${envLocalPath}`);
  process.exit(1);
}

async function cleanup() {
  // Dynamic import after env is loaded
  const postgres = (await import("postgres")).default;
  const sql = postgres(process.env.DATABASE_URL!);
  
  console.log("🧹 Cleaning database (keeping users only)...");

  try {
    // Delete in order to respect foreign key constraints
    // Use raw SQL to handle legacy tables and foreign keys
    const deleteTable = async (name: string, tableName: string) => {
      try {
        console.log(`Deleting ${name}...`);
        await sql.unsafe(`DELETE FROM ${tableName}`);
        console.log(`  ✅ ${name} deleted`);
      } catch (error: any) {
        if (error?.code === '42P01') {
          console.log(`  ⚠️  ${name} table does not exist, skipping`);
        } else {
          throw error;
        }
      }
    };
    
    // Delete invoice_line_items first (legacy table that references tasks)
    await deleteTable("invoice line items", "invoice_line_items");
    
    // Delete invoices before clients (invoices references clients)
    await deleteTable("invoices", "invoices");
    
    await deleteTable("attachments", "attachments");
    await deleteTable("time logs", "time_logs");
    await deleteTable("activity logs", "activity_logs");
    await deleteTable("pricing overrides", "pricing_overrides");
    await deleteTable("contracts", "contracts");
    await deleteTable("services", "services");
    await deleteTable("tasks", "tasks");
    await deleteTable("clients", "clients");
    
    await sql.end();
    
    console.log("\n✅ Database cleanup completed successfully!");
    console.log("📊 Users table preserved with all user accounts.");
    process.exit(0);
  } catch (error) {
    console.error("❌ Cleanup failed:", error);
    process.exit(1);
  }
}

cleanup();
