"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { redirect, useRouter } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Sidebar } from "@/components/Sidebar";
import { LoadingShell } from "@/components/LoadingShell";

interface Client {
  id: string;
  name: string;
}

interface User {
  id: string;
  name: string;
}

export default function NewTaskPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    clientId: "",
    supportType: "ON_DEMAND" as "ON_DEMAND" | "CONTRACT",
    serviceId: "",
    title: "",
    description: "",
    category: "",
    priority: "MEDIUM",
    assignedToId: "",
  });

  const [services, setServices] = useState<
    { id: string; name: string; category: string }[]
  >([]);
  const [effectivePrice, setEffectivePrice] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      redirect("/login");
    }
    if (session?.user?.role && !["ADMIN", "MANAGER"].includes(session.user.role)) {
      redirect("/dashboard");
    }
  }, [status, session]);

  useEffect(() => {
    if (session) {
      fetchData();
    }
  }, [session]);

  const fetchData = async () => {
    try {
      const [clientsRes, usersRes, servicesRes] = await Promise.all([
        fetch("/api/clients"),
        fetch("/api/users"),
        fetch("/api/services?active=true"),
      ]);

      if (clientsRes.ok) {
        setClients(await clientsRes.json());
      }
      if (usersRes.ok) {
        setUsers(await usersRes.json());
      }
      if (servicesRes.ok) {
        setServices(await servicesRes.json());
      }
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Failed to load form data");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  useEffect(() => {
    const loadPricing = async () => {
      setEffectivePrice(null);
      if (!formData.clientId || !formData.serviceId) return;
      try {
        const res = await fetch(
          `/api/clients/${formData.clientId}/pricing`
        );
        if (!res.ok) return;
        const data = await res.json();
        const match = data.pricing.find(
          (p: { serviceId: string }) => p.serviceId === formData.serviceId
        );
        if (match) {
          setEffectivePrice(match.effectivePrice);
        }
      } catch {
        // silent failure – pricing is a nice-to-have on this screen
      }
    };
    void loadPricing();
  }, [formData.clientId, formData.serviceId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create task");
      }

      const task = await res.json();
      router.push(`/tasks/${task.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <LoadingShell
        title="Create New Task"
        subtitle="Add a new service task to the system"
      />
    );
  }

  return (
    <div className="flex min-h-screen app-shell">
      <Sidebar />
      <div className="flex-1 flex flex-col md:ml-64 pt-16">
        <Navbar />
        <main className="flex-1 overflow-auto">
          <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
            <div className="page-header">
              <div>
                <h1 className="page-title">New Service Request</h1>
                <p className="page-subtitle">
                  Log a one-time support task or a contract-backed ticket.
                </p>
              </div>
            </div>

            <div className="panel panel-body">
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <div className="bg-[var(--error-light)] border border-[var(--error)] text-[var(--error)] px-4 py-3 rounded-lg font-medium">
                    {error}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-2">
                    Client <span className="text-[var(--primary)]">*</span>
                  </label>
                  <select
                    name="clientId"
                    value={formData.clientId}
                    onChange={handleChange}
                    required
                    className="w-full"
                  >
                    <option value="">Select a client</option>
                    {clients.map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-2">
                    Support Type <span className="text-[var(--primary)]">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          supportType: "ON_DEMAND",
                        }))
                      }
                      className={`chip w-full justify-center ${
                        formData.supportType === "ON_DEMAND" ? "chip-active" : ""
                      }`}
                    >
                      On-Demand
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          supportType: "CONTRACT",
                        }))
                      }
                      className={`chip w-full justify-center ${
                        formData.supportType === "CONTRACT" ? "chip-active" : ""
                      }`}
                    >
                      Contract
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-2">
                    Service Type <span className="text-[var(--primary)]">*</span>
                  </label>
                  <select
                    name="serviceId"
                    value={formData.serviceId}
                    onChange={handleChange}
                    required
                    className="w-full"
                  >
                    <option value="">Select a service</option>
                    {services.map((service) => (
                      <option key={service.id} value={service.id}>
                        {service.name} · {service.category}
                      </option>
                    ))}
                  </select>
                  {effectivePrice && (
                    <p className="text-xs text-[var(--text-tertiary)] mt-2">
                      Estimated price: <span className="font-semibold">₦{effectivePrice}</span>
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-2">
                    Title <span className="text-[var(--primary)]">*</span>
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    required
                    placeholder="Enter task title"
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
                    rows={4}
                    placeholder="Enter task description"
                    className="w-full resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-2">
                      Category <span className="text-[var(--primary)]">*</span>
                    </label>
                    <input
                      type="text"
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      required
                      placeholder="e.g., Development"
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-2">
                      Priority
                    </label>
                    <select
                      name="priority"
                      value={formData.priority}
                      onChange={handleChange}
                      className="w-full"
                    >
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                      <option value="URGENT">Urgent</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-2">
                    Assign To
                  </label>
                  <select
                    name="assignedToId"
                    value={formData.assignedToId}
                    onChange={handleChange}
                    className="w-full"
                  >
                    <option value="">Unassigned</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-actions">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn btn-primary"
                  >
                    {submitting ? "Creating..." : "Create Task"}
                  </button>
                  <button
                    type="button"
                    onClick={() => router.back()}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
