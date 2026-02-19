import { auth } from "@/auth";
import { db } from "@/db";
import { activityLogs, contracts, tasks } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getEffectiveServicePrice } from "@/lib/pricing";

const taskStatusSchema = z.enum([
  "NEW",
  "IN_PROGRESS",
  "BLOCKED",
  "COMPLETED",
  "ARCHIVED",
]);
const prioritySchema = z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]);
const taskQuerySchema = z.object({
  clientId: z.string().uuid().optional(),
  status: taskStatusSchema.optional(),
  assignedTo: z.string().uuid().optional(),
});
const createTaskSchema = z.object({
  clientId: z.string().uuid(),
  title: z.string().min(1),
  description: z.string().optional().nullable(),
  category: z.string().min(1),
  priority: prioritySchema.optional(),
  assignedToId: z.preprocess(
    (value) => (value === "" ? undefined : value),
    z.string().uuid().optional().nullable()
  ),
  serviceId: z.string().uuid(),
  supportType: z.enum(["ON_DEMAND", "CONTRACT"]),
});

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!["ADMIN", "MANAGER", "STAFF"].includes(session.user?.role || "")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const rawQuery = {
      clientId: searchParams.get("clientId") || undefined,
      status: searchParams.get("status") || undefined,
      assignedTo: searchParams.get("assignedTo") || undefined,
    };
    const parsedQuery = taskQuerySchema.safeParse(rawQuery);
    if (!parsedQuery.success) {
      return NextResponse.json(
        { error: "Invalid query parameters" },
        { status: 400 }
      );
    }
    const { clientId, status, assignedTo } = parsedQuery.data;

    let query = db.query.tasks.findMany({
      with: {
        client: true,
        createdBy: true,
        assignedTo: true,
      },
    });

    // Build filters based on role
    if (session.user?.role === "STAFF") {
      if (assignedTo && assignedTo !== session.user.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      // Staff can only see tasks assigned to them
      query = db.query.tasks.findMany({
        where: eq(tasks.assignedToId, session.user.id),
        with: {
          client: true,
          createdBy: true,
          assignedTo: true,
        },
      });
    }

    const allTasks = await query;

    // Apply additional filters
    let filtered = allTasks;
    if (clientId) {
      filtered = filtered.filter((t) => t.clientId === clientId);
    }
    if (status) {
      filtered = filtered.filter((t) => t.status === status);
    }
    if (assignedTo) {
      filtered = filtered.filter((t) => t.assignedToId === assignedTo);
    }

    return NextResponse.json(filtered);
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return NextResponse.json(
      { error: "Failed to fetch tasks" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || !["ADMIN", "MANAGER"].includes(session.user?.role || "")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsedBody = createTaskSchema.safeParse(body);
    if (!parsedBody.success) {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }
    const {
      clientId,
      title,
      description,
      category,
      priority,
      assignedToId,
      serviceId,
      supportType,
    } = parsedBody.data;

    const normalizedAssignedToId =
      assignedToId && assignedToId.length > 0 ? assignedToId : undefined;

    // Resolve effective pricing
    const pricing = await getEffectiveServicePrice({
      clientId,
      serviceId,
    });

    // Contract validation for high-priority contract tickets
    const isHighPriority = (priority ?? "MEDIUM") === "HIGH" ||
      (priority ?? "MEDIUM") === "URGENT";

    if (supportType === "CONTRACT" && isHighPriority) {
      const activeContract = await db.query.contracts.findFirst({
        where: (fields, { and, eq }) =>
          and(
            eq(fields.clientId, clientId),
            eq(fields.isActive, true)
          ),
      });

      if (!activeContract) {
        return NextResponse.json(
          { error: "Active support contract required for high-priority tickets." },
          { status: 400 }
        );
      }
    }

    const initialStatus =
      supportType === "ON_DEMAND" ? "NEW" : "NEW";

    const newTask = await db
      .insert(tasks)
      .values({
        clientId,
        title,
        description,
        category,
        priority: priority || "MEDIUM",
        createdById: session.user.id,
        assignedToId: normalizedAssignedToId,
        supportType,
        serviceId,
        fixedPrice: pricing.effectivePrice,
        currency: pricing.currency,
        isHighPriority,
        status: initialStatus,
      })
      .returning();

    // Log activity
    await db.insert(activityLogs).values({
      taskId: newTask[0].id,
      userId: session.user.id,
      activityType: "TASK_CREATED",
      description: `Task created: ${title}`,
    });

    return NextResponse.json(newTask[0], { status: 201 });
  } catch (error) {
    console.error("Error creating task:", error);
    return NextResponse.json(
      { error: "Failed to create task" },
      { status: 500 }
    );
  }
}
