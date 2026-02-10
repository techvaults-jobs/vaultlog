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
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col md:ml-64 pt-16">
        <Navbar />
        <main className="flex-1 overflow-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
                {subtitle ? (
                  <p className="text-gray-600 mt-2">{subtitle}</p>
                ) : null}
              </div>
              <div className="flex items-center gap-3">
                <div className="h-11 w-36 bg-gray-200 rounded-lg animate-pulse"></div>
                <LogoSpinner label="Loading data" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {Array.from({ length: 4 }).map((_, idx) => (
                <div
                  key={idx}
                  className="bg-white rounded-lg p-6 border border-gray-200"
                >
                  <div className="h-3 w-24 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-7 w-16 bg-gray-200 rounded mt-4 animate-pulse"></div>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <div className="h-4 w-40 bg-gray-200 rounded animate-pulse"></div>
              </div>
              <div className="divide-y divide-gray-200">
                {Array.from({ length: 6 }).map((_, idx) => (
                  <div key={idx} className="px-6 py-4 flex gap-4">
                    <div className="h-4 w-48 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
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
