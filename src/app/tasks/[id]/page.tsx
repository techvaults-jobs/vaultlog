"use client";

import { useEffect, useState } from "react";
import { use } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Sidebar } from "@/components/Sidebar";
import { LoadingShell } from "@/components/LoadingShell";
import { getAllowedTransitions, TaskStatus } from "@/lib/workflow";

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  category: string;
  clientId: string;
  assignedToId: string | null;
  createdAt: Date;
  completedAt: Date | null;
  client: { name: string };
  createdBy: { name: string };
  assignedTo: { name: string } | null;
  timeLogs: TimeLog[];
  activityLogs: ActivityLog[];
}

interface TimeLog {
  id: string;
  duration: string;
  billable: boolean;
  description: string | null;
  loggedAt: Date;
  staff: { name: string };
}

interface ActivityLog {
  id: string;
  activityType: string;
  description: string;
  createdAt: Date;
  user: { name: string };
}

export default function TaskDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: session, status } = useSession();
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [loggingTime, setLoggingTime] = useState(false);
  const [error, setError] = useState("");

  const [timeLogForm, setTimeLogForm] = useState({
    duration: "",
    billable: true,
    description: "",
  });

  const [updateForm, setUpdateForm] = useState({
    status: "",
    priority: "",
  });

  const fetchTask = async () => {
    try {
      const res = await fetch(`/api/tasks/${id}`);
      if (res.ok) {
        const data = await res.json();
        setTask(data);
        setUpdateForm({
          status: data.status,
          priority: data.priority,
        });
      } else if (res.status === 403) {
        redirect("/tasks");
      }
    } catch (err) {
      console.error("Error fetching task:", err);
      setError("Failed to load task");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === "unauthenticated") {
      redirect("/login");
    }
  }, [status]);

  useEffect(() => {
    if (session && id) {
      void fetchTask();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, id]);

  const handleTimeLogSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoggingTime(true);

    try {
      const res = await fetch("/api/time-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskId: id,
          duration: parseFloat(timeLogForm.duration),
          billable: timeLogForm.billable,
          description: timeLogForm.description,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to log time");
      }

      setTimeLogForm({ duration: "", billable: true, description: "" });
      await fetchTask();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoggingTime(false);
    }
  };

  const handleUpdateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setUpdating(true);

    try {
      const res = await fetch(`/api/tasks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateForm),
      });

      if (!res.ok) {
        throw new Error("Failed to update task");
      }

      await fetchTask();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setUpdating(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <LoadingShell
        title="Task Details"
        subtitle="Loading task information"
      />
    );
  }

  if (!task) {
    return (
      <div className="flex min-h-screen app-shell">
        <Sidebar />
        <div className="flex-1 flex flex-col md:ml-64 pt-16">
          <Navbar />
          <main className="flex-1 flex items-center justify-center">
            <p className="text-[var(--text-secondary)]">Task not found</p>
          </main>
        </div>
      </div>
    );
  }

  const totalHours = task.timeLogs.reduce((sum, log) => sum + parseFloat(log.duration), 0);
  const canEdit = ["ADMIN", "MANAGER"].includes(session?.user?.role || "");

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

  const statusLabels: Record<TaskStatus, string> = {
    NEW: "New",
    IN_PROGRESS: "In Progress",
    BLOCKED: "Blocked",
    COMPLETED: "Completed",
    ARCHIVED: "Archived",
  };

  const currentStatus = task.status as TaskStatus;
  const nextStatuses = getAllowedTransitions(currentStatus);
  const statusOptions = [currentStatus, ...nextStatuses.filter((status) => status !== currentStatus)];

  const activityTypeConfig: Record<
    string,
    {
      label: string;
      badge: string;
      dot: string;
      border: string;
    }
  > = {
    TASK_CREATED: {
      label: "Task created",
      badge: "badge badge-success",
      dot: "bg-[var(--success)]",
      border: "border-[var(--border-light)]",
    },
    STATUS_CHANGED: {
      label: "Status changed",
      badge: "badge badge-info",
      dot: "bg-[var(--info)]",
      border: "border-[var(--border-light)]",
    },
    TASK_UPDATED: {
      label: "Task updated",
      badge: "badge badge-warning",
      dot: "bg-[var(--warning)]",
      border: "border-[var(--border-light)]",
    },
    TASK_ASSIGNED: {
      label: "Task assigned",
      badge: "badge badge-neutral",
      dot: "bg-[var(--text-muted)]",
      border: "border-[var(--border-light)]",
    },
    TIME_LOGGED: {
      label: "Time logged",
      badge: "badge badge-success",
      dot: "bg-[var(--success)]",
      border: "border-[var(--border-light)]",
    },
  };

  return (
    <div className="flex min-h-screen app-shell">
      <Sidebar />
      <div className="flex-1 flex flex-col md:ml-64 pt-16">
        <Navbar />
        <main className="flex-1 overflow-auto">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
            {error && (
              <div className="mb-6 bg-[var(--error-light)] border border-[var(--error)] text-[var(--error)] px-4 py-3 rounded-lg font-medium">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              {/* Task Info */}
              <div className="col-span-3 lg:col-span-2 panel panel-body">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h1 className="page-title">{task.title}</h1>
                    <p className="page-subtitle">{task.description}</p>
                  </div>
                  <span
                    className={`badge ${statusBadge(task.status)} whitespace-nowrap`}
                  >
                    {task.status}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-6 border-t border-b border-[var(--border-light)]">
                  <div>
                    <p className="text-sm text-[var(--text-tertiary)] font-medium">Client</p>
                    <p className="font-semibold text-[var(--text-primary)] mt-1">{task.client.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-[var(--text-tertiary)] font-medium">Category</p>
                    <p className="font-semibold text-[var(--text-primary)] mt-1">{task.category}</p>
                  </div>
                  <div>
                    <p className="text-sm text-[var(--text-tertiary)] font-medium">Assigned To</p>
                    <p className="font-semibold text-[var(--text-primary)] mt-1">
                      {task.assignedTo?.name || "Unassigned"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-[var(--text-tertiary)] font-medium">Created By</p>
                    <p className="font-semibold text-[var(--text-primary)] mt-1">{task.createdBy.name}</p>
                  </div>
                </div>

                {canEdit && (
                  <form onSubmit={handleUpdateTask} className="mt-6 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-2">
                          Status
                        </label>
                        <select
                          value={updateForm.status}
                          onChange={(e) =>
                            setUpdateForm({ ...updateForm, status: e.target.value })
                          }
                          className="w-full"
                        >
                          {statusOptions.map((statusOption) => (
                            <option key={statusOption} value={statusOption}>
                              {statusOption === currentStatus
                                ? `${statusLabels[statusOption]} (Current)`
                                : statusLabels[statusOption]}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-2">
                          Priority
                        </label>
                        <select
                          value={updateForm.priority}
                          onChange={(e) =>
                            setUpdateForm({ ...updateForm, priority: e.target.value })
                          }
                          className="w-full"
                        >
                          <option value="LOW">Low</option>
                          <option value="MEDIUM">Medium</option>
                          <option value="HIGH">High</option>
                          <option value="URGENT">Urgent</option>
                        </select>
                      </div>
                    </div>
                    <button
                      type="submit"
                      disabled={updating}
                      className="btn btn-primary w-full"
                    >
                      {updating ? "Updating..." : "Update Task"}
                    </button>
                  </form>
                )}
              </div>

              {/* Stats */}
              <div className="col-span-3 lg:col-span-1 space-y-4">
                <div className="panel panel-body">
                  <p className="text-[var(--text-tertiary)] text-sm font-medium">Total Hours Logged</p>
                  <p className="text-3xl font-bold text-[var(--primary)] mt-3">{totalHours.toFixed(1)}h</p>
                </div>
                <div className="panel panel-body">
                  <p className="text-[var(--text-tertiary)] text-sm font-medium">Time Entries</p>
                  <p className="text-3xl font-bold text-[var(--text-primary)] mt-3">{task.timeLogs.length}</p>
                </div>
                <div className="panel panel-body">
                  <p className="text-[var(--text-tertiary)] text-sm font-medium">Priority</p>
                  <div className="mt-3">
                    <span className={`badge ${priorityBadge(task.priority)}`}>{task.priority}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Time Logging */}
            <div className="panel panel-body mb-8">
              <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-6">Log Time</h2>
              <form onSubmit={handleTimeLogSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-2">
                      Hours <span className="text-[var(--primary)]">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      value={timeLogForm.duration}
                      onChange={(e) =>
                        setTimeLogForm({ ...timeLogForm, duration: e.target.value })
                      }
                      required
                      placeholder="0.5"
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-2">
                      Billable
                    </label>
                    <select
                      value={timeLogForm.billable ? "true" : "false"}
                      onChange={(e) =>
                        setTimeLogForm({ ...timeLogForm, billable: e.target.value === "true" })
                      }
                      className="w-full"
                    >
                      <option value="true">Yes</option>
                      <option value="false">No</option>
                    </select>
                  </div>
                  <div className="flex items-end">
                    <button
                      type="submit"
                      disabled={loggingTime}
                      className="btn btn-primary w-full"
                    >
                      {loggingTime ? "Logging..." : "Log Time"}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-2">
                    Description
                  </label>
                  <textarea
                    value={timeLogForm.description}
                    onChange={(e) =>
                      setTimeLogForm({ ...timeLogForm, description: e.target.value })
                    }
                    rows={2}
                    placeholder="What did you work on?"
                    className="w-full resize-none"
                  />
                </div>
              </form>
            </div>

            {/* Time Logs */}
            <div className="panel panel-body mb-8">
              <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-6">Time Entries</h2>
              <div className="space-y-3">
                {task.timeLogs.length === 0 ? (
                  <p className="text-[var(--text-secondary)]">No time entries yet</p>
                ) : (
                  task.timeLogs.map((log) => (
                    <div key={log.id} className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 p-4 bg-[var(--surface-secondary)] rounded-lg border border-[var(--border-light)] hover:border-[var(--border)] transition-all">
                      <div>
                        <p className="font-semibold text-[var(--text-primary)]">{log.staff.name}</p>
                        <p className="text-sm text-[var(--text-secondary)]">{log.description}</p>
                        <p className="text-xs text-[var(--text-tertiary)] mt-2">
                          {new Date(log.loggedAt).toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-[var(--text-primary)]">{log.duration}h</p>
                        <p className={`text-xs font-medium mt-1 ${log.billable ? "text-[var(--success)]" : "text-[var(--text-tertiary)]"}`}>
                          {log.billable ? "Billable" : "Non-billable"}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Activity Log */}
            <div className="panel panel-body">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-[var(--info-light)] rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-[var(--info)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-[var(--text-primary)]">Activity Log</h2>
              </div>

              <div className="space-y-4">
                {task.activityLogs.length === 0 ? (
                  <div className="empty-state">
                    <svg className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="font-medium">No activity yet</p>
                  </div>
                ) : (
                  <div className="relative">
                    {/* Timeline line */}
                    <div className="absolute left-3 top-0 bottom-0 w-px bg-gradient-to-b from-[var(--info-light)] via-[var(--border-light)] to-transparent"></div>

                    {/* Activity items */}
                    <div className="space-y-4">
                      {task.activityLogs.map((log) => {
                        const config = activityTypeConfig[log.activityType] || {
                          label: "Activity",
                          badge: "badge badge-neutral",
                          dot: "bg-[var(--text-muted)]",
                          border: "border-[var(--border-light)]",
                        };

                        return (
                          <div key={log.id} className="relative pl-10">
                            <div
                              className={`absolute left-[6px] top-5 h-3 w-3 rounded-full ${config.dot} ring-4 ring-white`}
                            />

                            <div
                              className={`bg-[var(--surface)] rounded-lg border ${config.border} shadow-sm px-5 py-4`}
                            >
                              <div className="flex flex-wrap items-start justify-between gap-3">
                                <div>
                                  <p className="text-sm font-semibold text-[var(--text-primary)]">
                                    {config.label}
                                  </p>
                                  <p className="text-sm text-[var(--text-secondary)] mt-1">
                                    {log.description}
                                  </p>
                                </div>
                                <span
                                  className={`${config.badge}`}
                                >
                                  {log.activityType.replace(/_/g, " ")}
                                </span>
                              </div>

                              <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-[var(--text-tertiary)]">
                                <span className="font-semibold text-[var(--text-secondary)]">
                                  {log.user?.name || "Unknown User"}
                                </span>
                                <span className="h-3 w-px bg-[var(--border)]"></span>
                                <time dateTime={new Date(log.createdAt).toISOString()}>
                                  {new Date(log.createdAt).toLocaleString()}
                                </time>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
