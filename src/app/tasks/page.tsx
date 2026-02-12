"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Sidebar } from "@/components/Sidebar";
import Link from "next/link";
import { LoadingShell } from "@/components/LoadingShell";
import type { TaskStatus } from "@/lib/workflow";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  clientId: string;
  assignedToId: string | null;
  createdAt: Date;
  client: { name: string };
  assignedTo: { name: string } | null;
}

type ColumnItems = Record<TaskStatus, string[]>;

const BOARD_STATUSES: TaskStatus[] = [
  "NEW",
  "IN_PROGRESS",
  "BLOCKED",
  "COMPLETED",
  "ARCHIVED",
];

const STATUS_LABELS: Record<TaskStatus, string> = {
  NEW: "New",
  IN_PROGRESS: "In Progress",
  BLOCKED: "Blocked",
  COMPLETED: "Completed",
  ARCHIVED: "Archived",
};

const createEmptyColumns = (): ColumnItems => ({
  NEW: [],
  IN_PROGRESS: [],
  BLOCKED: [],
  COMPLETED: [],
  ARCHIVED: [],
});

const cloneColumns = (columns: ColumnItems): ColumnItems => ({
  NEW: [...columns.NEW],
  IN_PROGRESS: [...columns.IN_PROGRESS],
  BLOCKED: [...columns.BLOCKED],
  COMPLETED: [...columns.COMPLETED],
  ARCHIVED: [...columns.ARCHIVED],
});

const buildColumnItems = (tasks: Task[]): ColumnItems => {
  const columns = createEmptyColumns();
  tasks.forEach((task) => {
    const status = task.status as TaskStatus;
    if (columns[status]) {
      columns[status].push(task.id);
    }
  });
  return columns;
};

type KanbanColumnProps = {
  id: TaskStatus;
  title: string;
  count: number;
  wipLimit?: number;
  overLimit: boolean;
  children: React.ReactNode;
};

function KanbanColumn({
  id,
  title,
  count,
  wipLimit,
  overLimit,
  children,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={`panel panel-body min-w-[280px] max-w-[320px] flex-1 transition-shadow ${
        isOver ? "shadow-md ring-2 ring-[var(--primary)]/20" : ""
      }`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-[var(--text-primary)]">
            {title}
          </p>
          <p className="text-xs text-[var(--text-tertiary)] mt-1">
            {count} task{count === 1 ? "" : "s"}
          </p>
        </div>
        <span className={`badge ${overLimit ? "badge-error" : "badge-neutral"}`}>
          {wipLimit !== undefined ? `${count}/${wipLimit}` : count}
        </span>
      </div>
      <div className="mt-4 space-y-3">{children}</div>
    </div>
  );
}

type SortableTaskCardProps = {
  id: string;
  disabled?: boolean;
  children: React.ReactNode;
};

function SortableTaskCard({ id, disabled, children }: SortableTaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`rounded-lg border border-[var(--border-light)] bg-[var(--surface)] p-4 shadow-sm ${
        isDragging ? "opacity-70" : ""
      }`}
    >
      {children}
    </div>
  );
}

export default function TasksPage() {
  const { data: session, status } = useSession();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("ALL");
  const [view, setView] = useState<"list" | "board">("list");
  const [columnItems, setColumnItems] = useState<ColumnItems>(createEmptyColumns);
  const [workflow, setWorkflow] = useState<{
    allowedTransitions: Record<string, string[]>;
    wipLimits: Record<string, number>;
    slaTargetsHours: Record<string, unknown>;
  } | null>(null);
  const [actionError, setActionError] = useState("");
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      redirect("/login");
    }
  }, [status]);

  useEffect(() => {
    if (session) {
      fetchTasks();
      fetchWorkflow();
    }
  }, [session]);

  const fetchTasks = async () => {
    try {
      const res = await fetch("/api/tasks");
      if (res.ok) {
        const data = await res.json();
        setTasks(data);
        setColumnItems(buildColumnItems(data));
      }
    } catch (error) {
      console.error("Error fetching tasks:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchWorkflow = async () => {
    try {
      const res = await fetch("/api/workflow");
      if (res.ok) {
        setWorkflow(await res.json());
      }
    } catch (error) {
      console.error("Error fetching workflow rules:", error);
    }
  };

  const filteredTasks = filter === "ALL" ? tasks : tasks.filter((t) => t.status === filter);
  const statusCounts = tasks.reduce<Record<string, number>>((acc, task) => {
    acc[task.status] = (acc[task.status] || 0) + 1;
    return acc;
  }, {});

  const filterOptions = ["ALL", "NEW", "IN_PROGRESS", "BLOCKED", "COMPLETED"].map((status) => ({
    key: status,
    label: status === "IN_PROGRESS" ? "In Progress" : status.charAt(0) + status.slice(1).toLowerCase(),
    count: status === "ALL" ? tasks.length : statusCounts[status] || 0,
  }));

  const statusBadge = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "badge-success";
      case "IN_PROGRESS":
        return "badge-info";
      case "BLOCKED":
        return "badge-error";
      default:
        return "badge-neutral";
    }
  };

  const priorityBadge = (priority: string) => {
    switch (priority) {
      case "URGENT":
        return "badge-error";
      case "HIGH":
        return "badge-warning";
      case "MEDIUM":
        return "badge-info";
      default:
        return "badge-neutral";
    }
  };

  const canEdit = ["ADMIN", "MANAGER"].includes(session?.user?.role || "");
  const taskById = useMemo(() => new Map(tasks.map((task) => [task.id, task])), [tasks]);
  const activeTask = activeTaskId ? taskById.get(activeTaskId) : null;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const findContainer = (id: string) => {
    if (BOARD_STATUSES.includes(id as TaskStatus)) {
      return id as TaskStatus;
    }
    return BOARD_STATUSES.find((status) => columnItems[status].includes(id)) ?? null;
  };

  const moveTaskBetweenColumns = (
    columns: ColumnItems,
    taskId: string,
    fromStatus: TaskStatus,
    toStatus: TaskStatus,
    targetIndex?: number
  ) => {
    const nextColumns = cloneColumns(columns);
    nextColumns[fromStatus] = nextColumns[fromStatus].filter((id) => id !== taskId);
    const insertIndex =
      targetIndex === undefined || targetIndex < 0
        ? nextColumns[toStatus].length
        : targetIndex;
    nextColumns[toStatus].splice(insertIndex, 0, taskId);
    return nextColumns;
  };

  const handleStatusChange = async (
    taskId: string,
    currentStatus: TaskStatus,
    nextStatus: TaskStatus,
    targetIndex?: number
  ) => {
    if (!canEdit || currentStatus === nextStatus) return;

    const allowedTransitions = workflow?.allowedTransitions?.[currentStatus];
    if (allowedTransitions && !allowedTransitions.includes(nextStatus)) {
      setActionError("This status change is not allowed by the workflow rules.");
      return;
    }

    const wipLimit = workflow?.wipLimits?.[nextStatus];
    const currentCount = columnItems[nextStatus]?.length ?? 0;
    if (wipLimit !== undefined && currentCount >= wipLimit) {
      setActionError(
        `WIP limit reached for ${STATUS_LABELS[nextStatus]} (${currentCount}/${wipLimit}).`
      );
      return;
    }

    const prevTasks = tasks;
    const prevColumns = cloneColumns(columnItems);
    const updatedColumns = moveTaskBetweenColumns(
      columnItems,
      taskId,
      currentStatus,
      nextStatus,
      targetIndex
    );

    setActionError("");
    setUpdatingTaskId(taskId);
    setColumnItems(updatedColumns);
    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId
          ? {
              ...task,
              status: nextStatus,
            }
          : task
      )
    );

    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setActionError(data.error || "Failed to update task status.");
        setTasks(prevTasks);
        setColumnItems(prevColumns);
        return;
      }
    } catch (error) {
      console.error("Error updating task status:", error);
      setActionError("Failed to update task status.");
      setTasks(prevTasks);
      setColumnItems(prevColumns);
    } finally {
      setUpdatingTaskId(null);
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveTaskId(String(event.active.id));
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveTaskId(null);
    const { active, over } = event;
    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);
    const sourceColumn = findContainer(activeId);
    const destinationColumn = findContainer(overId);

    if (!sourceColumn || !destinationColumn) return;

    if (sourceColumn === destinationColumn) {
      if (overId === destinationColumn) return;
      const activeIndex = columnItems[sourceColumn].indexOf(activeId);
      const overIndex = columnItems[destinationColumn].indexOf(overId);
      if (activeIndex !== overIndex && activeIndex !== -1 && overIndex !== -1) {
        setColumnItems((prev) => ({
          ...prev,
          [sourceColumn]: arrayMove(prev[sourceColumn], activeIndex, overIndex),
        }));
      }
      return;
    }

    const targetIndex =
      overId === destinationColumn
        ? columnItems[destinationColumn].length
        : columnItems[destinationColumn].indexOf(overId);

    await handleStatusChange(
      activeId,
      sourceColumn,
      destinationColumn,
      targetIndex
    );
  };

  if (status === "loading" || loading) {
    return (
      <LoadingShell
        title="Tasks"
        subtitle="Manage and track all service tasks"
      />
    );
  }

  return (
    <div className="flex min-h-screen app-shell">
      <Sidebar />
      <div className="flex-1 flex flex-col md:ml-64 pt-16">
        <Navbar />
        <main className="flex-1 overflow-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
            <div className="page-header">
              <div>
                <h1 className="page-title">Tasks</h1>
                <p className="page-subtitle">Manage and track all service tasks</p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-1 rounded-full border border-[var(--border-light)] bg-[var(--surface-secondary)] p-1">
                  <button
                    onClick={() => setView("list")}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-full transition-all ${
                      view === "list"
                        ? "bg-[var(--surface)] text-[var(--text-primary)] shadow-sm"
                        : "text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
                    }`}
                  >
                    List
                  </button>
                  <button
                    onClick={() => setView("board")}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-full transition-all ${
                      view === "board"
                        ? "bg-[var(--surface)] text-[var(--text-primary)] shadow-sm"
                        : "text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
                    }`}
                  >
                    Board
                  </button>
                </div>
                {["ADMIN", "MANAGER"].includes(session?.user?.role || "") && (
                  <Link
                    href="/tasks/new"
                    className="btn btn-primary"
                  >
                    + New Task
                  </Link>
                )}
              </div>
            </div>

            {actionError && (
              <div className="mb-6 bg-[var(--error-light)] border border-[var(--error)] text-[var(--error)] px-4 py-3 rounded-lg font-medium">
                {actionError}
              </div>
            )}

            {view === "list" && (
              <>
                {/* Filters */}
                <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                  {filterOptions.map((option) => (
                    <button
                      key={option.key}
                      onClick={() => setFilter(option.key)}
                      className={`chip whitespace-nowrap ${filter === option.key ? "chip-active" : ""}`}
                    >
                      <span>{option.label}</span>
                      <span className={`text-xs ${filter === option.key ? "text-white/80" : "text-[var(--text-muted)]"}`}>
                        {option.count}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Tasks Table */}
                <div className="panel overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">
                            Title
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">
                            Client
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">
                            Priority
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">
                            Assigned To
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">
                            Action
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--border-light)]">
                        {filteredTasks.map((task) => (
                          <tr key={task.id} className="hover:bg-[var(--surface-secondary)] transition-colors">
                            <td className="px-6 py-4 text-sm font-medium text-[var(--text-primary)]">
                              {task.title}
                            </td>
                            <td className="px-6 py-4 text-sm text-[var(--text-secondary)]">
                              {task.client.name}
                            </td>
                            <td className="px-6 py-4 text-sm">
                              <span
                                className={`badge ${statusBadge(task.status)}`}
                              >
                                {task.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm">
                              <span
                                className={`badge ${priorityBadge(task.priority)}`}
                              >
                                {task.priority}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-[var(--text-secondary)]">
                              {task.assignedTo?.name || "Unassigned"}
                            </td>
                            <td className="px-6 py-4 text-sm">
                              <Link
                                href={`/tasks/${task.id}`}
                                className="text-[var(--primary)] hover:text-[var(--primary-hover)] font-semibold transition-colors"
                              >
                                View
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {filteredTasks.length === 0 && (
                    <div className="empty-state">
                      <p>No tasks found</p>
                    </div>
                  )}
                </div>
              </>
            )}

            {view === "board" && (
              <DndContext
                sensors={sensors}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
              >
                <div className="flex gap-4 overflow-x-auto pb-4">
                  {BOARD_STATUSES.map((statusKey) => {
                    const columnTaskIds = columnItems[statusKey] || [];
                    const columnTasks = columnTaskIds
                      .map((taskId) => taskById.get(taskId))
                      .filter((task): task is Task => Boolean(task));
                    const wipLimit = workflow?.wipLimits?.[statusKey];
                    const overLimit =
                      wipLimit !== undefined && columnTaskIds.length >= wipLimit;

                    return (
                      <KanbanColumn
                        key={statusKey}
                        id={statusKey}
                        title={STATUS_LABELS[statusKey]}
                        count={columnTaskIds.length}
                        wipLimit={wipLimit}
                        overLimit={overLimit}
                      >
                        {columnTaskIds.length === 0 ? (
                          <div className="text-sm text-[var(--text-tertiary)]">
                            No tasks
                          </div>
                        ) : (
                          <SortableContext
                            items={columnTaskIds}
                            strategy={verticalListSortingStrategy}
                          >
                            {columnTasks.map((task) => {
                              const transitions =
                                workflow?.allowedTransitions?.[task.status] || [];

                              return (
                                <SortableTaskCard
                                  key={task.id}
                                  id={task.id}
                                  disabled={!canEdit}
                                >
                                  <div className="text-sm font-semibold text-[var(--text-primary)]">
                                    {task.title}
                                  </div>
                                  <div className="text-xs text-[var(--text-tertiary)] mt-1">
                                    {task.client.name}
                                  </div>
                                  <div className="flex items-center justify-between mt-3">
                                    <span className={`badge ${priorityBadge(task.priority)}`}>
                                      {task.priority}
                                    </span>
                                    {canEdit ? (
                                      <select
                                        value=""
                                        className="text-xs rounded-md border border-[var(--border-light)] bg-[var(--surface-secondary)] px-2 py-1 text-[var(--text-secondary)]"
                                        disabled={
                                          updatingTaskId === task.id || transitions.length === 0
                                        }
                                        onChange={(event) => {
                                          const nextStatus = event.target.value as TaskStatus;
                                          if (nextStatus) {
                                            handleStatusChange(
                                              task.id,
                                              task.status as TaskStatus,
                                              nextStatus
                                            );
                                          }
                                        }}
                                      >
                                        <option value="" disabled>
                                          {transitions.length === 0 ? "No moves" : "Move"}
                                        </option>
                                        {transitions.map((nextStatus) => {
                                          const limit = workflow?.wipLimits?.[nextStatus];
                                          const count = columnItems[nextStatus]?.length ?? 0;
                                          const disabled =
                                            limit !== undefined && count >= limit;
                                          return (
                                            <option key={nextStatus} value={nextStatus} disabled={disabled}>
                                              {STATUS_LABELS[nextStatus as TaskStatus]}
                                              {limit !== undefined ? ` (${count}/${limit})` : ""}
                                            </option>
                                          );
                                        })}
                                      </select>
                                    ) : null}
                                  </div>
                                </SortableTaskCard>
                              );
                            })}
                          </SortableContext>
                        )}
                      </KanbanColumn>
                    );
                  })}
                </div>
                <DragOverlay>
                  {activeTask ? (
                    <div className="rounded-lg border border-[var(--border-light)] bg-[var(--surface)] p-4 shadow-lg">
                      <div className="text-sm font-semibold text-[var(--text-primary)]">
                        {activeTask.title}
                      </div>
                      <div className="text-xs text-[var(--text-tertiary)] mt-1">
                        {activeTask.client.name}
                      </div>
                    </div>
                  ) : null}
                </DragOverlay>
              </DndContext>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
