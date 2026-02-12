"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Sidebar } from "@/components/Sidebar";
import { LoadingShell } from "@/components/LoadingShell";

interface ReportData {
  clientName: string;
  totalTasks: number;
  completedTasks: number;
  totalHours: number;
}

export default function ReportsPage() {
  const { data: session, status } = useSession();
  const [reports, setReports] = useState<ReportData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      redirect("/login");
    }
  }, [status]);

  useEffect(() => {
    if (session) {
      fetchReports();
    }
  }, [session]);

  const fetchReports = async () => {
    try {
      // Fetch tasks and time logs to generate reports
      const [tasksRes, timeLogsRes] = await Promise.all([
        fetch("/api/tasks"),
        fetch("/api/time-logs"),
      ]);

      if (tasksRes.ok && timeLogsRes.ok) {
        const tasks = await tasksRes.json();
        const timeLogs = await timeLogsRes.json();

        // Group by client
        const clientMap = new Map<string, ReportData>();

        tasks.forEach((task: Record<string, unknown>) => {
          const key = (task.client as Record<string, unknown>).name as string;
          if (!clientMap.has(key)) {
            clientMap.set(key, {
              clientName: key,
              totalTasks: 0,
              completedTasks: 0,
              totalHours: 0,
            });
          }
          const data = clientMap.get(key)!;
          data.totalTasks++;
          if (task.status === "COMPLETED") {
            data.completedTasks++;
          }
        });

        timeLogs.forEach((log: Record<string, unknown>) => {
          const task = tasks.find((t: Record<string, unknown>) => t.id === log.taskId);
          if (task) {
            const key = (task.client as Record<string, unknown>).name as string;
            const data = clientMap.get(key);
            if (data) {
              data.totalHours += parseFloat(log.duration as string);
            }
          }
        });

        setReports(Array.from(clientMap.values()));
      }
    } catch (error) {
      console.error("Error fetching reports:", error);
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <LoadingShell
        title="Reports"
        subtitle="View client performance and billing reports"
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
                <h1 className="page-title">Reports</h1>
                <p className="page-subtitle">View client performance and billing reports</p>
              </div>
            </div>

            {/* Reports Table */}
            <div className="panel overflow-hidden">
              <div className="panel-header">
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">Client Reports</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">
                        Client
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">
                        Total Tasks
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">
                        Completed
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">
                        Completion Rate
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">
                        Total Hours
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-light)]">
                    {reports.map((report, idx) => {
                      const completionRate =
                        report.totalTasks > 0
                          ? ((report.completedTasks / report.totalTasks) * 100).toFixed(1)
                          : 0;
                      return (
                        <tr key={idx} className="hover:bg-[var(--surface-secondary)] transition-colors">
                          <td className="px-6 py-4 text-sm font-semibold text-[var(--text-primary)]">
                            {report.clientName}
                          </td>
                          <td className="px-6 py-4 text-sm text-[var(--text-secondary)]">
                            {report.totalTasks}
                          </td>
                          <td className="px-6 py-4 text-sm text-[var(--text-secondary)]">
                            {report.completedTasks}
                          </td>
                          <td className="px-6 py-4 text-sm">
                            <div className="flex items-center gap-2">
                              <div className="w-20 bg-[var(--surface-tertiary)] rounded-full h-2">
                                <div
                                  className="bg-[var(--primary)] h-2 rounded-full"
                                  style={{ width: `${completionRate}%` }}
                                ></div>
                              </div>
                              <span className="text-[var(--text-secondary)] font-medium">{completionRate}%</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-[var(--text-secondary)]">
                            {report.totalHours.toFixed(1)}h
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {reports.length === 0 && (
                <div className="empty-state">
                  <p>No report data available</p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
