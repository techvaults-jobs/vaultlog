"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Sidebar } from "@/components/Sidebar";
import { LoadingShell } from "@/components/LoadingShell";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  active: boolean;
}

export default function AdminPage() {
  const { data: session, status } = useSession();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "STAFF",
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      redirect("/login");
    }
    if (session?.user?.role !== "ADMIN") {
      redirect("/dashboard");
    }
  }, [status, session]);

  useEffect(() => {
    if (session?.user?.role === "ADMIN") {
      fetchUsers();
    }
  }, [session]);

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/users");
      if (res.ok) {
        setUsers(await res.json());
      }
    } catch (err) {
      console.error("Error fetching users:", err);
      setError("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
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
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create user");
      }

      setSuccess("User created successfully");
      setFormData({ name: "", email: "", password: "", role: "STAFF" });
      setShowForm(false);
      await fetchUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <LoadingShell
        title="Admin"
        subtitle="Manage team members and access"
      />
    );
  }

  return (
    <div className="flex min-h-screen app-shell">
      <Sidebar />
      <div className="flex-1 flex flex-col md:ml-64 pt-16">
        <Navbar />
        <main className="flex-1 overflow-auto">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
            <div className="page-header">
              <div>
                <h1 className="page-title">Admin Panel</h1>
                <p className="page-subtitle">Manage users and system settings</p>
              </div>
              <button
                onClick={() => setShowForm(!showForm)}
                className="btn btn-primary"
              >
                {showForm ? "Cancel" : "+ Add User"}
              </button>
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

            {/* Add User Form */}
            {showForm && (
              <div className="panel panel-body mb-8">
                <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-6">Create New User</h2>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-2">
                        Name <span className="text-[var(--primary)]">*</span>
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        placeholder="Full name"
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-2">
                        Email <span className="text-[var(--primary)]">*</span>
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        placeholder="user@example.com"
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-2">
                        Password <span className="text-[var(--primary)]">*</span>
                      </label>
                      <input
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                        placeholder="••••••••"
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-2">
                        Role <span className="text-[var(--primary)]">*</span>
                      </label>
                      <select
                        name="role"
                        value={formData.role}
                        onChange={handleChange}
                        className="w-full"
                      >
                        <option value="STAFF">Staff</option>
                        <option value="MANAGER">Manager</option>
                        <option value="ADMIN">Admin</option>
                      </select>
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn btn-primary w-full"
                  >
                    {submitting ? "Creating..." : "Create User"}
                  </button>
                </form>
              </div>
            )}

            {/* Users Table */}
            <div className="panel overflow-hidden">
              <div className="panel-header">
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">Users</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-light)]">
                    {users.map((user) => (
                      <tr key={user.id} className="hover:bg-[var(--surface-secondary)] transition-colors">
                        <td className="px-6 py-4 text-sm font-semibold text-[var(--text-primary)]">
                          {user.name}
                        </td>
                        <td className="px-6 py-4 text-sm text-[var(--text-secondary)]">{user.email}</td>
                        <td className="px-6 py-4 text-sm">
                          <span
                            className={`badge ${
                              user.role === "ADMIN"
                                ? "badge-error"
                                : user.role === "MANAGER"
                                ? "badge-info"
                                : "badge-neutral"
                            }`}
                          >
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <span
                            className={`badge ${
                              user.active
                                ? "badge-success"
                                : "badge-neutral"
                            }`}
                          >
                            {user.active ? "Active" : "Inactive"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {users.length === 0 && (
                <div className="empty-state">
                  <p>No users found</p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
