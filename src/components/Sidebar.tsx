"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { LayoutDashboard, CheckSquare, Building2, BarChart3, Settings } from "lucide-react";
import { useState } from "react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["ADMIN", "MANAGER", "STAFF"] },
  { href: "/tasks", label: "Tasks", icon: CheckSquare, roles: ["ADMIN", "MANAGER", "STAFF"] },
  { href: "/clients", label: "Clients", icon: Building2, roles: ["ADMIN", "MANAGER"] },
  { href: "/reports", label: "Reports", icon: BarChart3, roles: ["ADMIN", "MANAGER"] },
  { href: "/admin", label: "Admin", icon: Settings, roles: ["ADMIN"] },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);

  const visibleItems = navItems.filter((item) =>
    item.roles.includes(session?.user?.role || "")
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 bg-white text-gray-900 h-screen fixed left-0 top-0 overflow-y-auto pt-16 shadow-lg border-r border-gray-200 flex-col">
        <nav className="p-4 space-y-2 flex-1">
          {visibleItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 group ${
                  isActive
                    ? "bg-red-600 text-white font-semibold shadow-md"
                    : "text-gray-900 hover:bg-gray-100 hover:text-gray-900"
                }`}
              >
                <Icon size={20} className="group-hover:scale-110 transition-transform flex-shrink-0" />
                <span className={isActive ? "text-white" : "text-gray-900"}>{item.label}</span>
                {isActive && <div className="ml-auto w-1.5 h-1.5 bg-white rounded-full flex-shrink-0"></div>}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Mobile Sidebar */}
      <div className="md:hidden fixed left-0 top-16 z-40">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-3 bg-white border-r border-gray-200 hover:bg-gray-50 transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-30 top-16"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Mobile Menu */}
      <aside
        className={`md:hidden fixed left-0 top-16 w-64 bg-white h-screen overflow-y-auto shadow-lg border-r border-gray-200 z-40 transform transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <nav className="p-4 space-y-2">
          {visibleItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 group ${
                  isActive
                    ? "bg-red-600 text-white font-semibold shadow-md"
                    : "text-gray-900 hover:bg-gray-100 hover:text-gray-900"
                }`}
              >
                <Icon size={20} className="group-hover:scale-110 transition-transform flex-shrink-0" />
                <span className={isActive ? "text-white" : "text-gray-900"}>{item.label}</span>
                {isActive && <div className="ml-auto w-1.5 h-1.5 bg-white rounded-full flex-shrink-0"></div>}
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
