import { auth } from "@/auth";
import { db } from "@/db";
import { timeLogs, activityLogs, tasks } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const timeLogQuerySchema = z.object({
  taskId: z.string().uuid().optional(),
});
const createTimeLogSchema = z.object({
  taskId: z.string().uuid(),
  duration: z.preprocess((value) => {
    if (typeof value === "string" || typeof value === "number") {
      const num = Number(value);
      return Number.isNaN(num) ? value : num;
    }
    return value;
  }, z.number().positive()),
  billable: z.boolean().optional(),
  description: z.string().optional().nullable(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rawQuery = {
      taskId: request.nextUrl.searchParams.get("taskId") || undefined,
    };
    const parsedQuery = timeLogQuerySchema.safeParse(rawQuery);
    if (!parsedQuery.success) {
      return NextResponse.json(
        { error: "Invalid query parameters" },
        { status: 400 }
      );
    }
    const { taskId } = parsedQuery.data;

    let logs: Awaited<ReturnType<typeof db.query.timeLogs.findMany>> = [];

    if (taskId) {
      const task = await db.query.tasks.findFirst({
        where: eq(tasks.id, taskId),
      });

      if (!task) {
        return NextResponse.json({ error: "Task not found" }, { status: 404 });
      }

      if (session.user?.role === "STAFF" && task.assignedToId !== session.user.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      logs = await db.query.timeLogs.findMany({
        where: eq(timeLogs.taskId, taskId),
        with: {
          staff: true,
          task: true,
        },
      });
    } else if (session.user?.role === "STAFF") {
      logs = await db.query.timeLogs.findMany({
        where: eq(timeLogs.staffId, session.user.id),
        with: {
          staff: true,
          task: true,
        },
      });
    } else {
      logs = await db.query.timeLogs.findMany({
        with: {
          staff: true,
          task: true,
        },
      });
    }

    return NextResponse.json(logs);
  } catch (error) {
    console.error("Error fetching time logs:", error);
    return NextResponse.json(
      { error: "Failed to fetch time logs" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsedBody = createTimeLogSchema.safeParse(body);
    if (!parsedBody.success) {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }
    const { taskId, duration, billable, description } = parsedBody.data;

    const task = await db.query.tasks.findFirst({
      where: eq(tasks.id, taskId),
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    if (session.user?.role === "STAFF" && task.assignedToId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const newLog = await db
      .insert(timeLogs)
      .values({
        taskId,
        staffId: session.user.id,
        duration: duration.toString(),
        billable: billable !== false,
        description,
      })
      .returning();

    // Log activity
    await db.insert(activityLogs).values({
      taskId,
      userId: session.user.id,
      activityType: "TIME_LOGGED",
      description: `Logged ${duration} hours`,
    });

    return NextResponse.json(newLog[0], { status: 201 });
  } catch (error) {
    console.error("Error creating time log:", error);
    return NextResponse.json(
      { error: "Failed to create time log" },
      { status: 500 }
    );
  }
}
