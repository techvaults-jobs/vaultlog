"use client";

import { useEffect, useState } from "react";
import { use } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Sidebar } from "@/components/Sidebar";
import { LoadingShell } from "@/components/LoadingShell";

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
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex flex-col md:ml-64 pt-16">
          <Navbar />
          <main className="flex-1 flex items-center justify-center">
            <p className="text-gray-600">Task not found</p>
          </main>
        </div>
      </div>
    );
  }

  const totalHours = task.timeLogs.reduce((sum, log) => sum + parseFloat(log.duration), 0);
  const canEdit = ["ADMIN", "MANAGER"].includes(session?.user?.role || "");

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col md:ml-64 pt-16">
        <Navbar />
        <main className="flex-1 overflow-auto">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg font-medium">
                {error}
              </div>
            )}

            <div className="grid grid-cols-3 gap-6 mb-8">
              {/* Task Info */}
              <div className="col-span-2 bg-white rounded-lg border border-gray-200 shadow-sm p-8">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900">{task.title}</h1>
                    <p className="text-gray-600 mt-2">{task.description}</p>
                  </div>
                  <span
                    className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap ${
                      task.status === "COMPLETED"
                        ? "bg-green-100 text-green-700 border border-green-300"
                        : task.status === "IN_PROGRESS"
                        ? "bg-blue-100 text-blue-700 border border-blue-300"
                        : task.status === "BLOCKED"
                        ? "bg-red-100 text-red-700 border border-red-300"
                        : "bg-gray-100 text-gray-700 border border-gray-300"
                    }`}
                  >
                    {task.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 py-6 border-t border-b border-gray-200">
                  <div>
                    <p className="text-sm text-gray-600 font-medium">Client</p>
                    <p className="font-semibold text-gray-900 mt-1">{task.client.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 font-medium">Category</p>
                    <p className="font-semibold text-gray-900 mt-1">{task.category}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 font-medium">Assigned To</p>
                    <p className="font-semibold text-gray-900 mt-1">
                      {task.assignedTo?.name || "Unassigned"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 font-medium">Created By</p>
                    <p className="font-semibold text-gray-900 mt-1">{task.createdBy.name}</p>
                  </div>
                </div>

                {canEdit && (
                  <form onSubmit={handleUpdateTask} className="mt-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Status
                        </label>
                        <select
                          value={updateForm.status}
                          onChange={(e) =>
                            setUpdateForm({ ...updateForm, status: e.target.value })
                          }
                          className="w-full px-4 py-3 bg-white border border-gray-300 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent transition-all"
                        >
                          <option value="NEW">New</option>
                          <option value="IN_PROGRESS">In Progress</option>
                          <option value="BLOCKED">Blocked</option>
                          <option value="COMPLETED">Completed</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Priority
                        </label>
                        <select
                          value={updateForm.priority}
                          onChange={(e) =>
                            setUpdateForm({ ...updateForm, priority: e.target.value })
                          }
                          className="w-full px-4 py-3 bg-white border border-gray-300 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent transition-all"
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
                      className="w-full bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 disabled:opacity-50 transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5"
                    >
                      {updating ? "Updating..." : "Update Task"}
                    </button>
                  </form>
                )}
              </div>

              {/* Stats */}
              <div className="space-y-4">
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                  <p className="text-gray-600 text-sm font-medium">Total Hours Logged</p>
                  <p className="text-3xl font-bold text-red-600 mt-3">{totalHours.toFixed(1)}h</p>
                </div>
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                  <p className="text-gray-600 text-sm font-medium">Time Entries</p>
                  <p className="text-3xl font-bold text-gray-900 mt-3">{task.timeLogs.length}</p>
                </div>
              </div>
            </div>

            {/* Time Logging */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-8 mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Log Time</h2>
              <form onSubmit={handleTimeLogSubmit} className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Hours <span className="text-red-600">*</span>
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
                      className="w-full px-4 py-3 bg-white border border-gray-300 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent placeholder-gray-500 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Billable
                    </label>
                    <select
                      value={timeLogForm.billable ? "true" : "false"}
                      onChange={(e) =>
                        setTimeLogForm({ ...timeLogForm, billable: e.target.value === "true" })
                      }
                      className="w-full px-4 py-3 bg-white border border-gray-300 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent transition-all"
                    >
                      <option value="true">Yes</option>
                      <option value="false">No</option>
                    </select>
                  </div>
                  <div className="flex items-end">
                    <button
                      type="submit"
                      disabled={loggingTime}
                      className="w-full bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 disabled:opacity-50 transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5"
                    >
                      {loggingTime ? "Logging..." : "Log Time"}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={timeLogForm.description}
                    onChange={(e) =>
                      setTimeLogForm({ ...timeLogForm, description: e.target.value })
                    }
                    rows={2}
                    placeholder="What did you work on?"
                    className="w-full px-4 py-3 bg-white border border-gray-300 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent placeholder-gray-500 transition-all resize-none"
                  />
                </div>
              </form>
            </div>

            {/* Time Logs */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-8 mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Time Entries</h2>
              <div className="space-y-3">
                {task.timeLogs.length === 0 ? (
                  <p className="text-gray-600">No time entries yet</p>
                ) : (
                  task.timeLogs.map((log) => (
                    <div key={log.id} className="flex justify-between items-start p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 transition-all">
                      <div>
                        <p className="font-semibold text-gray-900">{log.staff.name}</p>
                        <p className="text-sm text-gray-600">{log.description}</p>
                        <p className="text-xs text-gray-500 mt-2">
                          {new Date(log.loggedAt).toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">{log.duration}h</p>
                        <p className={`text-xs font-medium mt-1 ${log.billable ? "text-green-600" : "text-gray-600"}`}>
                          {log.billable ? "Billable" : "Non-billable"}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Activity Log */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-gray-900">Activity Log</h2>
              </div>

              <div className="space-y-4">
                {task.activityLogs.length === 0 ? (
                  <div className="text-center py-8">
                    <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-gray-500 font-medium">No activity yet</p>
                  </div>
                ) : (
                  <div className="relative">
                    {/* Timeline line */}
                    <div className="absolute left-3 top-0 bottom-0 w-px bg-gradient-to-b from-blue-200 via-gray-200 to-gray-100"></div>

                    {/* Activity items */}
                    <div className="space-y-4">
                      {task.activityLogs.map((log) => {
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
                            badge: "bg-green-50 text-green-700 border-green-200",
                            dot: "bg-green-500",
                            border: "border-green-200",
                          },
                          STATUS_CHANGED: {
                            label: "Status changed",
                            badge: "bg-blue-50 text-blue-700 border-blue-200",
                            dot: "bg-blue-500",
                            border: "border-blue-200",
                          },
                          TASK_UPDATED: {
                            label: "Task updated",
                            badge: "bg-amber-50 text-amber-700 border-amber-200",
                            dot: "bg-amber-500",
                            border: "border-amber-200",
                          },
                          TASK_ASSIGNED: {
                            label: "Task assigned",
                            badge: "bg-purple-50 text-purple-700 border-purple-200",
                            dot: "bg-purple-500",
                            border: "border-purple-200",
                          },
                          TIME_LOGGED: {
                            label: "Time logged",
                            badge: "bg-cyan-50 text-cyan-700 border-cyan-200",
                            dot: "bg-cyan-500",
                            border: "border-cyan-200",
                          },
                        };

                        const config = activityTypeConfig[log.activityType] || {
                          label: "Activity",
                          badge: "bg-gray-50 text-gray-700 border-gray-200",
                          dot: "bg-gray-400",
                          border: "border-gray-200",
                        };

                        return (
                          <div key={log.id} className="relative pl-10">
                            <div
                              className={`absolute left-[6px] top-5 h-3 w-3 rounded-full ${config.dot} ring-4 ring-white`}
                            />

                            <div
                              className={`bg-white rounded-lg border ${config.border} shadow-sm px-5 py-4`}
                            >
                              <div className="flex flex-wrap items-start justify-between gap-3">
                                <div>
                                  <p className="text-sm font-semibold text-gray-900">
                                    {config.label}
                                  </p>
                                  <p className="text-sm text-gray-600 mt-1">
                                    {log.description}
                                  </p>
                                </div>
                                <span
                                  className={`text-xs font-semibold px-3 py-1 rounded-full border ${config.badge}`}
                                >
                                  {log.activityType.replace(/_/g, " ")}
                                </span>
                              </div>

                              <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-gray-500">
                                <span className="font-semibold text-gray-700">
                                  {log.user?.name || "Unknown User"}
                                </span>
                                <span className="h-3 w-px bg-gray-300"></span>
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
