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
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[var(--surface)] border-b border-[var(--border-light)] shadow-sm h-16">
      <div className="flex h-full">
        {/* Left section - Logo and VaultLog text (hidden on mobile, visible on md+) */}
        <div className="hidden md:flex w-64 border-r border-[var(--border-light)] items-center px-4 sm:px-6 lg:px-8 flex-shrink-0">
          <Link href="/dashboard" className="flex items-center gap-3 group">
            <Image
              src="/logo-sm.png"
              alt="VaultLog"
              width={40}
              height={40}
              className="rounded-lg shadow-md group-hover:shadow-lg transition-all"
            />
            <span className="text-lg font-bold text-[var(--text-primary)] hidden sm:inline group-hover:text-[var(--primary)] transition-colors">
              VaultLog
            </span>
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
            <span className="text-sm font-bold text-[var(--text-primary)] group-hover:text-[var(--primary)] transition-colors">
              VaultLog
            </span>
          </Link>
        </div>

        {/* Right section - User info and logout */}
        <div className="flex-1 flex justify-end items-center px-4 sm:px-6 lg:px-8 gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-[var(--text-primary)]">{session?.user?.name}</p>
            <p className="text-xs text-[var(--text-tertiary)]">{session?.user?.role}</p>
          </div>
          <div className="w-px h-6 bg-[var(--border)] hidden sm:block"></div>
          <button
            onClick={handleLogout}
            className="btn btn-primary btn-sm whitespace-nowrap"
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
