export type TaskStatus = "NEW" | "IN_PROGRESS" | "BLOCKED" | "COMPLETED" | "ARCHIVED";
export type TaskPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export const WORKFLOW_RULES = {
  allowedTransitions: {
    NEW: ["IN_PROGRESS", "BLOCKED", "COMPLETED"],
    IN_PROGRESS: ["BLOCKED", "COMPLETED"],
    BLOCKED: ["IN_PROGRESS", "COMPLETED"],
    COMPLETED: ["IN_PROGRESS", "ARCHIVED"],
    ARCHIVED: [],
  } satisfies Record<TaskStatus, TaskStatus[]>,
  wipLimits: {
    IN_PROGRESS: 12,
    BLOCKED: 6,
  } satisfies Partial<Record<TaskStatus, number>>,
  slaTargetsHours: {
    default: {
      timeToStart: 24,
      timeToComplete: 72,
    },
    byPriority: {
      URGENT: { timeToStart: 4, timeToComplete: 24 },
      HIGH: { timeToStart: 8, timeToComplete: 48 },
      MEDIUM: { timeToStart: 24, timeToComplete: 72 },
      LOW: { timeToStart: 48, timeToComplete: 120 },
    } satisfies Record<TaskPriority, { timeToStart: number; timeToComplete: number }>,
  },
};

export function getAllowedTransitions(status: TaskStatus): TaskStatus[] {
  return WORKFLOW_RULES.allowedTransitions[status] ?? [];
}

export function isTransitionAllowed(from: TaskStatus, to: TaskStatus): boolean {
  return getAllowedTransitions(from).includes(to);
}

export function getWipLimit(status: TaskStatus): number | undefined {
  return WORKFLOW_RULES.wipLimits[status as keyof typeof WORKFLOW_RULES.wipLimits];
}

export function getSlaTargets(priority: TaskPriority): {
  timeToStart: number;
  timeToComplete: number;
} {
  return WORKFLOW_RULES.slaTargetsHours.byPriority[priority] ?? WORKFLOW_RULES.slaTargetsHours.default;
}

export function hoursBetween(start: Date, end: Date): number {
  return (end.getTime() - start.getTime()) / 36e5;
}
