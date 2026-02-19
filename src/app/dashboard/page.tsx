"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Sidebar } from "@/components/Sidebar";
import { LoadingShell } from "@/components/LoadingShell";
import { getSlaTargets, TaskPriority } from "@/lib/workflow";

interface Task {
  id: string;
  title: string;
  status: string;
  priority: string;
  assignedToId: string | null;
  createdAt: Date;
  completedAt: Date | null;
}

interface TimeLog {
  id: string;
  duration: string;
  loggedAt: Date;
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [timeLogs, setTimeLogs] = useState<TimeLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      redirect("/login");
    }
  }, [status]);

  useEffect(() => {
    if (session) {
      fetchDashboardData();
    }
  }, [session]);

  const fetchDashboardData = async () => {
    try {
      const [tasksRes, timeLogsRes] = await Promise.all([
        fetch("/api/tasks"),
        fetch("/api/time-logs"),
      ]);

      if (tasksRes.ok) {
        setTasks(await tasksRes.json());
      }
      if (timeLogsRes.ok) {
        setTimeLogs(await timeLogsRes.json());
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <LoadingShell
        title="Dashboard"
        subtitle={`Welcome back, ${session?.user?.name || "User"}`}
      />
    );
  }

  const tasksByStatus = {
    NEW: tasks.filter((t) => t.status === "NEW").length,
    IN_PROGRESS: tasks.filter((t) => t.status === "IN_PROGRESS").length,
    BLOCKED: tasks.filter((t) => t.status === "BLOCKED").length,
    COMPLETED: tasks.filter((t) => t.status === "COMPLETED").length,
  };

  const completedTasks = tasks.filter((task) => task.status === "COMPLETED" && task.completedAt);
  const validPriorities: TaskPriority[] = ["LOW", "MEDIUM", "HIGH", "URGENT"];
  const resolvePriority = (priority: string) =>
    validPriorities.includes(priority as TaskPriority)
      ? (priority as TaskPriority)
      : "MEDIUM";

  const avgCycleHours = completedTasks.length
    ? completedTasks.reduce((sum, task) => {
        const createdAt = new Date(task.createdAt);
        const completedAt = new Date(task.completedAt as Date);
        return sum + (completedAt.getTime() - createdAt.getTime()) / 36e5;
      }, 0) / completedTasks.length
    : 0;

  const cycleTimeDisplay =
    avgCycleHours >= 24
      ? `${(avgCycleHours / 24).toFixed(1)}d`
      : `${avgCycleHours.toFixed(1)}h`;

  const slaMetCount = completedTasks.reduce((count, task) => {
    const createdAt = new Date(task.createdAt);
    const completedAt = new Date(task.completedAt as Date);
    const cycleHours = (completedAt.getTime() - createdAt.getTime()) / 36e5;
    const targets = getSlaTargets(resolvePriority(task.priority));
    return cycleHours <= targets.timeToComplete ? count + 1 : count;
  }, 0);

  const slaCompliance =
    completedTasks.length > 0
      ? Math.round((slaMetCount / completedTasks.length) * 100)
      : 0;

  const todayHours = timeLogs
    .filter((log) => {
      const logDate = new Date(log.loggedAt);
      const today = new Date();
      return (
        logDate.toDateString() === today.toDateString()
      );
    })
    .reduce((sum, log) => sum + parseFloat(log.duration), 0);

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

  return (
    <div className="flex min-h-screen app-shell">
      <Sidebar />
      <div className="flex-1 flex flex-col md:ml-64 pt-16">
        <Navbar />
        <main className="flex-1 overflow-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
            <div className="page-header">
              <div>
                <h1 className="page-title">Dashboard</h1>
                <p className="page-subtitle">Welcome back, {session?.user?.name}</p>
              </div>
              <div className="flex gap-3">
                {["ADMIN", "MANAGER"].includes(session?.user?.role || "") && (
                  <Link href="/tasks/new" className="btn btn-primary btn-sm">
                    + New Request
                  </Link>
                )}
                <Link href="/tasks" className="btn btn-secondary btn-sm">
                  View Tasks
                </Link>
              </div>
            </div>

            {/* Primary KPIs - F-pattern: 3 cards in top row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
              <div className="kpi-card kpi-info card-hover">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="kpi-label">New Tasks</p>
                    <p className="kpi-value">{tasksByStatus.NEW}</p>
                  </div>
                  <div className="icon-badge info">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                </div>
              </div>
              <div className="kpi-card kpi-warning card-hover">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="kpi-label">In Progress</p>
                    <p className="kpi-value">{tasksByStatus.IN_PROGRESS}</p>
                  </div>
                  <div className="icon-badge warning">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                </div>
              </div>
              <div className="kpi-card kpi-success card-hover">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="kpi-label">SLA Compliance</p>
                    <p className="kpi-value">{slaCompliance}%</p>
                  </div>
                  <div className="icon-badge success">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Secondary KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              <div className="kpi-card kpi-neutral card-hover">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="kpi-label">Avg Cycle Time</p>
                    <p className="kpi-value text-xl">{cycleTimeDisplay}</p>
                  </div>
                </div>
              </div>
              <div className="kpi-card kpi-error card-hover">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="kpi-label">Blocked</p>
                    <p className="kpi-value">{tasksByStatus.BLOCKED}</p>
                  </div>
                </div>
              </div>
              <div className="kpi-card kpi-success card-hover">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="kpi-label">Hours Today</p>
                    <p className="kpi-value">{todayHours.toFixed(1)}h</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Tasks */}
            <div className="panel overflow-hidden">
              <div className="panel-header flex items-center justify-between">
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">Recent Tasks</h2>
                <Link href="/tasks" className="text-sm font-semibold text-[var(--primary)] hover:text-[var(--primary-hover)]">
                  View all →
                </Link>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">
                        Title
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">
                        Priority
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">
                        Created
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-light)]">
                    {tasks.slice(0, 5).map((task) => (
                      <tr key={task.id} className="hover:bg-[var(--surface-secondary)] transition-colors">
                        <td className="px-6 py-4 text-sm font-medium text-[var(--text-primary)]">
                          {task.title}
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
                        <td className="px-6 py-4 text-sm text-[var(--text-tertiary)]">
                          {new Date(task.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <Link
                            href={`/tasks/${task.id}`}
                            className="font-semibold text-[var(--primary)] hover:text-[var(--primary-hover)]"
                          >
                            View
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
