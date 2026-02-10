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

  if (status === "loading" || loading) {
    return (
      <LoadingShell
        title="Tasks"
        subtitle="Manage and track all service tasks"
      />
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col md:ml-64 pt-16">
        <Navbar />
        <main className="flex-1 overflow-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Tasks</h1>
                <p className="text-gray-600 mt-2">Manage and track all service tasks</p>
              </div>
              {["ADMIN", "MANAGER"].includes(session?.user?.role || "") && (
                <Link
                  href="/tasks/new"
                  className="px-6 py-3 bg-gray-800 text-white hover:text-white focus:text-white visited:text-white rounded-lg font-semibold hover:bg-gray-900 transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 !text-white hover:!text-white"
                >
                  + New Task
                </Link>
              )}
            </div>

            {/* Filters */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
              {["ALL", "NEW", "IN_PROGRESS", "BLOCKED", "COMPLETED"].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilter(status)}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${
                    filter === status
                      ? "bg-red-600 text-white shadow-md"
                      : "bg-white text-gray-700 border border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>

            {/* Tasks Table */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Title
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Client
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Priority
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Assigned To
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredTasks.map((task) => (
                      <tr key={task.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                          {task.title}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {task.client.name}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${
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
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              task.priority === "URGENT"
                                ? "bg-red-100 text-red-700 border border-red-300"
                                : task.priority === "HIGH"
                                ? "bg-orange-100 text-orange-700 border border-orange-300"
                                : task.priority === "MEDIUM"
                                ? "bg-yellow-100 text-yellow-700 border border-yellow-300"
                                : "bg-gray-100 text-gray-700 border border-gray-300"
                            }`}
                          >
                            {task.priority}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {task.assignedTo?.name || "Unassigned"}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <Link
                            href={`/tasks/${task.id}`}
                            className="text-red-600 hover:text-red-700 font-semibold transition-colors"
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
                <div className="text-center py-12">
                  <p className="text-gray-600">No tasks found</p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
