"use client";

import Link from "next/link";
import Image from "next/image";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

export function Navbar() {
  const { data: session } = useSession();
  const router = useRouter();

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push("/login");
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 shadow-sm h-16">
      <div className="flex h-full">
        {/* Left section - Logo and VaultLog text (hidden on mobile, visible on md+) */}
        <div className="hidden md:flex w-64 border-r border-gray-200 items-center px-4 sm:px-6 lg:px-8 flex-shrink-0">
          <Link href="/dashboard" className="flex items-center gap-3 group">
            <Image
              src="/logo-sm.png"
              alt="VaultLog"
              width={40}
              height={40}
              className="rounded-lg shadow-md group-hover:shadow-lg transition-all"
            />
            <span className="text-lg font-bold text-gray-900 hidden sm:inline group-hover:text-red-600 transition-colors">VaultLog</span>
          </Link>
        </div>

        {/* Mobile Logo - Left side */}
        <div className="md:hidden flex items-center px-4 flex-shrink-0">
          <Link href="/dashboard" className="flex items-center gap-2 group">
            <Image
              src="/logo-sm.png"
              alt="VaultLog"
              width={32}
              height={32}
              className="rounded-lg shadow-md group-hover:shadow-lg transition-all"
            />
            <span className="text-sm font-bold text-gray-900 group-hover:text-red-600 transition-colors">VaultLog</span>
          </Link>
        </div>

        {/* Right section - User info and logout */}
        <div className="flex-1 flex justify-end items-center px-4 sm:px-6 lg:px-8 gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-gray-900">{session?.user?.name}</p>
            <p className="text-xs text-gray-500">{session?.user?.role}</p>
          </div>
          <div className="w-px h-6 bg-gray-300 hidden sm:block"></div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 whitespace-nowrap"
          >
            <LogOut size={16} />
            <span className="hidden sm:inline">Logout</span>
            <span className="sm:hidden">Log out</span>
          </button>
        </div>
      </div>
    </nav>
  );
}
