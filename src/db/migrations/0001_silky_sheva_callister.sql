DO $$ BEGIN
	CREATE TYPE "public"."contract_type" AS ENUM('NONE', 'MONTHLY', 'QUARTERLY', 'BI_ANNUAL', 'ANNUAL');
EXCEPTION
	WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
	CREATE TYPE "public"."support_type" AS ENUM('ON_DEMAND', 'CONTRACT');
EXCEPTION
	WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "contracts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" uuid NOT NULL,
	"contract_type" "contract_type" NOT NULL,
	"support_tier_name" text NOT NULL,
	"monthly_fee" numeric(12, 2) NOT NULL,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp,
	"is_active" boolean DEFAULT true NOT NULL,
	"paystack_plan_code" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "pricing_overrides" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" uuid NOT NULL,
	"service_id" uuid NOT NULL,
	"discount_percentage" numeric(5, 2),
	"custom_fixed_price" numeric(12, 2),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "services" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"category" text NOT NULL,
	"description" text,
	"base_price" numeric(12, 2) NOT NULL,
	"sla_hours" integer,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN IF NOT EXISTS "contract_type" "contract_type" DEFAULT 'NONE' NOT NULL;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN IF NOT EXISTS "support_type" "support_type" DEFAULT 'ON_DEMAND' NOT NULL;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN IF NOT EXISTS "service_id" uuid;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN IF NOT EXISTS "fixed_price" numeric(12, 2);--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN IF NOT EXISTS "currency" text DEFAULT 'NGN' NOT NULL;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN IF NOT EXISTS "milestone_progress" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN IF NOT EXISTS "is_high_priority" boolean DEFAULT false NOT NULL;--> statement-breakpoint
DO $$ BEGIN
	ALTER TABLE "contracts" ADD CONSTRAINT "contracts_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
	WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
	ALTER TABLE "pricing_overrides" ADD CONSTRAINT "pricing_overrides_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
	WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
	ALTER TABLE "pricing_overrides" ADD CONSTRAINT "pricing_overrides_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
	WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "contracts_client_id_idx" ON "contracts" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "contracts_is_active_idx" ON "contracts" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "pricing_overrides_client_service_idx" ON "pricing_overrides" USING btree ("client_id","service_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "services_category_idx" ON "services" USING btree ("category");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "services_is_active_idx" ON "services" USING btree ("is_active");--> statement-breakpoint
DO $$ BEGIN
	ALTER TABLE "tasks" ADD CONSTRAINT "tasks_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
	WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tasks_client_support_type_idx" ON "tasks" USING btree ("client_id","support_type");