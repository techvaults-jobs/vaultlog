"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Sidebar } from "@/components/Sidebar";
import Link from "next/link";
import { LoadingShell } from "@/components/LoadingShell";

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

export default function TasksPage() {
  const { data: session, status } = useSession();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("ALL");

  useEffect(() => {
    if (status === "unauthenticated") {
      redirect("/login");
    }
  }, [status]);

  useEffect(() => {
    if (session) {
      fetchTasks();
    }
  }, [session]);

  const fetchTasks = async () => {
    try {
      const res = await fetch("/api/tasks");
      if (res.ok) {
        setTasks(await res.json());
      }
    } catch (error) {
      console.error("Error fetching tasks:", error);
    } finally {
      setLoading(false);
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
              {["ADMIN", "MANAGER"].includes(session?.user?.role || "") && (
                <Link
                  href="/tasks/new"
                  className="btn btn-primary"
                >
                  + New Task
                </Link>
              )}
            </div>

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
          </div>
        </main>
      </div>
    </div>
  );
}
