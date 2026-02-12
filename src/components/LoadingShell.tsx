"use client";

import { Navbar } from "@/components/Navbar";
import { Sidebar } from "@/components/Sidebar";
import { LogoSpinner } from "@/components/LogoSpinner";

export function LoadingShell({
  title,
  subtitle,
  }: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="flex min-h-screen app-shell">
      <Sidebar />
      <div className="flex-1 flex flex-col md:ml-64 pt-16">
        <Navbar />
        <main className="flex-1 overflow-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="page-header">
              <div>
                <h1 className="page-title">{title}</h1>
                {subtitle ? (
                  <p className="page-subtitle">{subtitle}</p>
                ) : null}
              </div>
              <div className="flex items-center gap-3">
                <div className="h-11 w-36 bg-[var(--surface-tertiary)] rounded-lg animate-pulse"></div>
                <LogoSpinner label="Loading data" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {Array.from({ length: 4 }).map((_, idx) => (
                <div
                  key={idx}
                  className="panel panel-body"
                >
                  <div className="h-3 w-24 bg-[var(--surface-tertiary)] rounded animate-pulse"></div>
                  <div className="h-7 w-16 bg-[var(--surface-tertiary)] rounded mt-4 animate-pulse"></div>
                </div>
              ))}
            </div>

            <div className="panel overflow-hidden">
              <div className="panel-header">
                <div className="h-4 w-40 bg-[var(--surface-tertiary)] rounded animate-pulse"></div>
              </div>
              <div className="divide-y divide-[var(--border-light)]">
                {Array.from({ length: 6 }).map((_, idx) => (
                  <div key={idx} className="px-6 py-4 flex gap-4">
                    <div className="h-4 w-48 bg-[var(--surface-tertiary)] rounded animate-pulse"></div>
                    <div className="h-4 w-32 bg-[var(--surface-tertiary)] rounded animate-pulse"></div>
                    <div className="h-4 w-24 bg-[var(--surface-tertiary)] rounded animate-pulse"></div>
                    <div className="h-4 w-24 bg-[var(--surface-tertiary)] rounded animate-pulse"></div>
                    <div className="h-4 w-24 bg-[var(--surface-tertiary)] rounded animate-pulse"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
