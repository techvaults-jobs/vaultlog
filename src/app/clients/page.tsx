"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Sidebar } from "@/components/Sidebar";
import { LoadingShell } from "@/components/LoadingShell";

interface Client {
  id: string;
  name: string;
  description: string | null;
  status: string;
  createdAt: Date;
  tasks: Array<{ id: string }>;
}

export default function ClientsPage() {
  const { data: session, status } = useSession();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      redirect("/login");
    }
  }, [status]);

  useEffect(() => {
    if (session) {
      fetchClients();
    }
  }, [session]);

  const fetchClients = async () => {
    try {
      const res = await fetch("/api/clients");
      if (res.ok) {
        setClients(await res.json());
      }
    } catch (error) {
      console.error("Error fetching clients:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSubmitting(true);

    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create client");
      }

      setSuccess("Client created successfully");
      setFormData({ name: "", description: "" });
      setShowForm(false);
      await fetchClients();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <LoadingShell
        title="Clients"
        subtitle="Manage and view all client accounts"
      />
    );
  }

  const statusCounts = clients.reduce<Record<string, number>>((acc, client) => {
    acc[client.status] = (acc[client.status] || 0) + 1;
    return acc;
  }, {});

  const filterOptions = [
    { key: "ALL", label: "All", count: clients.length },
    { key: "ACTIVE", label: "Active", count: statusCounts.ACTIVE || 0 },
    { key: "INACTIVE", label: "Inactive", count: statusCounts.INACTIVE || 0 },
  ];

  const filteredClients =
    filter === "ALL" ? clients : clients.filter((client) => client.status === filter);

  const statusBadge = (statusValue: string) =>
    statusValue === "ACTIVE" ? "badge-success" : "badge-neutral";

  return (
    <div className="flex min-h-screen app-shell">
      <Sidebar />
      <div className="flex-1 flex flex-col md:ml-64 pt-16">
        <Navbar />
        <main className="flex-1 overflow-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
            <div className="page-header">
              <div>
                <h1 className="page-title">Clients</h1>
                <p className="page-subtitle">Manage and view all client accounts</p>
              </div>
              {["ADMIN", "MANAGER"].includes(session?.user?.role || "") && (
                <button
                  onClick={() => setShowForm(!showForm)}
                  className="btn btn-primary"
                >
                  {showForm ? "Cancel" : "+ New Client"}
                </button>
              )}
            </div>

            {error && (
              <div className="mb-6 bg-[var(--error-light)] border border-[var(--error)] text-[var(--error)] px-4 py-3 rounded-lg font-medium">
                {error}
              </div>
            )}

            {success && (
              <div className="mb-6 bg-[var(--success-light)] border border-[var(--success)] text-[var(--success)] px-4 py-3 rounded-lg font-medium">
                {success}
              </div>
            )}

            {showForm && (
              <div className="panel panel-body mb-8">
                <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-6">Create New Client</h2>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-2">
                      Client Name <span className="text-[var(--primary)]">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      placeholder="Enter client name"
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-2">
                      Description
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      rows={3}
                      placeholder="Enter client description"
                      className="w-full resize-none"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn btn-primary w-full"
                  >
                    {submitting ? "Creating..." : "Create Client"}
                  </button>
                </form>
              </div>
            )}

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

            {/* Clients Table */}
            <div className="panel overflow-hidden">
              <div className="panel-header">
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">Client Directory</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">
                        Client
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">
                        Tasks
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">
                        Created
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-light)]">
                    {filteredClients.map((client) => (
                      <tr key={client.id} className="hover:bg-[var(--surface-secondary)] transition-colors">
                        <td className="px-6 py-4">
                          <div className="text-sm font-semibold text-[var(--text-primary)]">
                            {client.name}
                          </div>
                          <div className="text-sm text-[var(--text-secondary)]">
                            {client.description || "No description"}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <span className={`badge ${statusBadge(client.status)}`}>
                            {client.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-[var(--text-secondary)]">
                          {client.tasks.length}
                        </td>
                        <td className="px-6 py-4 text-sm text-[var(--text-tertiary)]">
                          {new Date(client.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {filteredClients.length === 0 && (
                <div className="empty-state">
                  <p>No clients found</p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
