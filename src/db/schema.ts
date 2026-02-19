import {
  pgTable,
  text,
  timestamp,
  uuid,
  integer,
  boolean,
  decimal,
  pgEnum,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Enums
export const roleEnum = pgEnum("role", ["ADMIN", "MANAGER", "STAFF"]);
export const taskStatusEnum = pgEnum("task_status", [
  "NEW",
  "IN_PROGRESS",
  "BLOCKED",
  "COMPLETED",
  "ARCHIVED",
]);
export const priorityEnum = pgEnum("priority", ["LOW", "MEDIUM", "HIGH", "URGENT"]);
export const clientStatusEnum = pgEnum("client_status", ["ACTIVE", "INACTIVE"]);
export const activityTypeEnum = pgEnum("activity_type", [
  "TASK_CREATED",
  "TASK_UPDATED",
  "TASK_ASSIGNED",
  "TASK_COMPLETED",
  "TIME_LOGGED",
  "ATTACHMENT_ADDED",
  "STATUS_CHANGED",
]);

// New enums for service-based support
export const contractTypeEnum = pgEnum("contract_type", [
  "NONE",
  "MONTHLY",
  "QUARTERLY",
  "BI_ANNUAL",
  "ANNUAL",
]);

export const supportTypeEnum = pgEnum("support_type", ["ON_DEMAND", "CONTRACT"]);

// Users table
export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: text("email").unique().notNull(),
    name: text("name").notNull(),
    password: text("password").notNull(),
    role: roleEnum("role").notNull().default("STAFF"),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    emailIdx: index("users_email_idx").on(table.email),
  })
);

// Clients table
export const clients = pgTable(
  "clients",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    description: text("description"),
    status: clientStatusEnum("status").notNull().default("ACTIVE"),
    contractType: contractTypeEnum("contract_type").notNull().default("NONE"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    statusIdx: index("clients_status_idx").on(table.status),
  })
);

// Services table (master price list)
export const services = pgTable(
  "services",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    category: text("category").notNull(),
    description: text("description"),
    basePrice: decimal("base_price", { precision: 12, scale: 2 }).notNull(),
    slaHours: integer("sla_hours"),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    categoryIdx: index("services_category_idx").on(table.category),
    isActiveIdx: index("services_is_active_idx").on(table.isActive),
  })
);

// Contracts table (support subscriptions)
export const contracts = pgTable(
  "contracts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    clientId: uuid("client_id")
      .notNull()
      .references(() => clients.id, { onDelete: "cascade" }),
    contractType: contractTypeEnum("contract_type").notNull(),
    supportTierName: text("support_tier_name").notNull(),
    monthlyFee: decimal("monthly_fee", { precision: 12, scale: 2 }).notNull(),
    startDate: timestamp("start_date").notNull(),
    endDate: timestamp("end_date"),
    isActive: boolean("is_active").notNull().default(true),
    paystackPlanCode: text("paystack_plan_code"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    clientIdIdx: index("contracts_client_id_idx").on(table.clientId),
    isActiveIdx: index("contracts_is_active_idx").on(table.isActive),
  })
);

// Pricing overrides table (client-specific pricing rules)
export const pricingOverrides = pgTable(
  "pricing_overrides",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    clientId: uuid("client_id")
      .notNull()
      .references(() => clients.id, { onDelete: "cascade" }),
    serviceId: uuid("service_id")
      .notNull()
      .references(() => services.id, { onDelete: "cascade" }),
    discountPercentage: decimal("discount_percentage", {
      precision: 5,
      scale: 2,
    }),
    customFixedPrice: decimal("custom_fixed_price", {
      precision: 12,
      scale: 2,
    }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    clientServiceIdx: index("pricing_overrides_client_service_idx").on(
      table.clientId,
      table.serviceId
    ),
  })
);

// Tasks table
export const tasks = pgTable(
  "tasks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    clientId: uuid("client_id")
      .notNull()
      .references(() => clients.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description"),
    category: text("category").notNull(),
    priority: priorityEnum("priority").notNull().default("MEDIUM"),
    status: taskStatusEnum("status").notNull().default("NEW"),
    supportType: supportTypeEnum("support_type").notNull().default("ON_DEMAND"),
    serviceId: uuid("service_id").references(() => services.id, {
      onDelete: "set null",
    }),
    fixedPrice: decimal("fixed_price", { precision: 12, scale: 2 }),
    currency: text("currency").notNull().default("NGN"),
    milestoneProgress: integer("milestone_progress").notNull().default(0),
    isHighPriority: boolean("is_high_priority").notNull().default(false),
    assignedToId: uuid("assigned_to_id").references(() => users.id, {
      onDelete: "set null",
    }),
    createdById: uuid("created_by_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    completedAt: timestamp("completed_at"),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    clientIdIdx: index("tasks_client_id_idx").on(table.clientId),
    statusIdx: index("tasks_status_idx").on(table.status),
    assignedToIdx: index("tasks_assigned_to_idx").on(table.assignedToId),
    clientSupportTypeIdx: index("tasks_client_support_type_idx").on(
      table.clientId,
      table.supportType
    ),
  })
);

// Time logs table (immutable after submission)
export const timeLogs = pgTable(
  "time_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    taskId: uuid("task_id")
      .notNull()
      .references(() => tasks.id, { onDelete: "cascade" }),
    staffId: uuid("staff_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    duration: decimal("duration", { precision: 10, scale: 2 }).notNull(), // in hours
    billable: boolean("billable").notNull().default(true),
    description: text("description"),
    loggedAt: timestamp("logged_at").notNull().defaultNow(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    taskIdIdx: index("time_logs_task_id_idx").on(table.taskId),
    staffIdIdx: index("time_logs_staff_id_idx").on(table.staffId),
  })
);

// Activity logs table (immutable audit trail)
export const activityLogs = pgTable(
  "activity_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    taskId: uuid("task_id").references(() => tasks.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    activityType: activityTypeEnum("activity_type").notNull(),
    description: text("description").notNull(),
    metadata: text("metadata"), // JSON string for additional context
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    taskIdIdx: index("activity_logs_task_id_idx").on(table.taskId),
    userIdIdx: index("activity_logs_user_id_idx").on(table.userId),
    createdAtIdx: index("activity_logs_created_at_idx").on(table.createdAt),
  })
);

// Attachments table
export const attachments = pgTable(
  "attachments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    taskId: uuid("task_id")
      .notNull()
      .references(() => tasks.id, { onDelete: "cascade" }),
    fileName: text("file_name").notNull(),
    fileUrl: text("file_url").notNull(),
    fileSize: integer("file_size").notNull(),
    mimeType: text("mime_type").notNull(),
    uploadedById: uuid("uploaded_by_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    taskIdIdx: index("attachments_task_id_idx").on(table.taskId),
  })
);

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  tasksCreated: many(tasks, { relationName: "createdBy" }),
  tasksAssigned: many(tasks, { relationName: "assignedTo" }),
  timeLogs: many(timeLogs),
  activityLogs: many(activityLogs),
  attachments: many(attachments),
}));

export const clientsRelations = relations(clients, ({ many }) => ({
  tasks: many(tasks),
  contracts: many(contracts),
  pricingOverrides: many(pricingOverrides),
}));

export const tasksRelations = relations(tasks, ({ one, many }) => ({
  client: one(clients, {
    fields: [tasks.clientId],
    references: [clients.id],
  }),
  createdBy: one(users, {
    fields: [tasks.createdById],
    references: [users.id],
    relationName: "createdBy",
  }),
  assignedTo: one(users, {
    fields: [tasks.assignedToId],
    references: [users.id],
    relationName: "assignedTo",
  }),
  service: one(services, {
    fields: [tasks.serviceId],
    references: [services.id],
  }),
  timeLogs: many(timeLogs),
  activityLogs: many(activityLogs),
  attachments: many(attachments),
}));

export const servicesRelations = relations(services, ({ many }) => ({
  tasks: many(tasks),
  pricingOverrides: many(pricingOverrides),
}));

export const contractsRelations = relations(contracts, ({ one }) => ({
  client: one(clients, {
    fields: [contracts.clientId],
    references: [clients.id],
  }),
}));

export const pricingOverridesRelations = relations(
  pricingOverrides,
  ({ one }) => ({
    client: one(clients, {
      fields: [pricingOverrides.clientId],
      references: [clients.id],
    }),
    service: one(services, {
      fields: [pricingOverrides.serviceId],
      references: [services.id],
    }),
  })
);

export const timeLogsRelations = relations(timeLogs, ({ one }) => ({
  task: one(tasks, {
    fields: [timeLogs.taskId],
    references: [tasks.id],
  }),
  staff: one(users, {
    fields: [timeLogs.staffId],
    references: [users.id],
  }),
}));

export const activityLogsRelations = relations(activityLogs, ({ one }) => ({
  task: one(tasks, {
    fields: [activityLogs.taskId],
    references: [tasks.id],
  }),
  user: one(users, {
    fields: [activityLogs.userId],
    references: [users.id],
  }),
}));

export const attachmentsRelations = relations(attachments, ({ one }) => ({
  task: one(tasks, {
    fields: [attachments.taskId],
    references: [tasks.id],
  }),
  uploadedBy: one(users, {
    fields: [attachments.uploadedById],
    references: [users.id],
  }),
}));
