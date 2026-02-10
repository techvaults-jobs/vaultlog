import { db } from "@/db";
import { activityLogs } from "@/db/schema";

export async function logActivity(
  taskId: string | null,
  userId: string,
  activityType: "TASK_CREATED" | "TASK_UPDATED" | "TASK_ASSIGNED" | "TASK_COMPLETED" | "TIME_LOGGED" | "ATTACHMENT_ADDED" | "STATUS_CHANGED",
  description: string,
  metadata?: Record<string, unknown>
) {
  try {
    await db.insert(activityLogs).values({
      taskId: taskId || undefined,
      userId,
      activityType,
      description,
      metadata: metadata ? JSON.stringify(metadata) : undefined,
    });
  } catch (error) {
    console.error("Error logging activity:", error);
  }
}
