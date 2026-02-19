"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface CommandItem {
  id: string;
  label: string;
  href: string;
}

const defaultItems: CommandItem[] = [
  { id: "dashboard", label: "Go to Dashboard", href: "/dashboard" },
  { id: "new-task", label: "Create Service Request", href: "/tasks/new" },
  { id: "tasks", label: "View Tasks", href: "/tasks" },
];

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const router = useRouter();

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const isMac = navigator.platform.toLowerCase().includes("mac");
      const metaPressed = isMac ? event.metaKey : event.ctrlKey;
      if (metaPressed && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Placeholder: in the future this can load tickets/clients/services dynamically
  const items = defaultItems;

  const filtered = items.filter((item) =>
    item.label.toLowerCase().includes(query.toLowerCase())
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 bg-black/40">
      <div className="w-full max-w-lg rounded-2xl bg-[var(--surface)] shadow-xl border border-[var(--border-light)]">
        <div className="px-4 pt-3 pb-2 border-b border-[var(--border-light)]">
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type to jump to a ticket, client, or screen…"
            className="w-full bg-transparent border-none focus:ring-0 outline-none text-sm"
          />
        </div>
        <div className="max-h-72 overflow-y-auto py-2">
          {filtered.length === 0 ? (
            <p className="px-4 py-3 text-sm text-[var(--text-secondary)]">
              No matches found
            </p>
          ) : (
            filtered.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setOpen(false);
                  router.push(item.href);
                }}
                className="w-full text-left px-4 py-2.5 text-sm hover:bg-[var(--surface-secondary)]"
              >
                {item.label}
              </button>
            ))
          )}
        </div>
        <div className="flex justify-between items-center px-4 py-2 border-t border-[var(--border-light)] text-[var(--text-tertiary)] text-xs">
          <span>Press Esc to close</span>
          <span>
            Ctrl/⌘ + K
          </span>
        </div>
      </div>
    </div>
  );
}

