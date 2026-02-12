"use client";

import Image from "next/image";

export function LogoSpinner({
  size = 48,
  label = "Loading",
}: {
  size?: number;
  label?: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div
        className="relative rounded-full bg-[var(--primary-light)] shadow-sm"
        style={{ width: size, height: size }}
      >
        <div className="absolute inset-0 rounded-full ring-2 ring-[var(--primary-light)]"></div>
        <Image
          src="/logo-sm.png"
          alt="VaultLog"
          width={size}
          height={size}
          className="relative z-10 rounded-full animate-[spin_1.6s_linear_infinite]"
          priority
        />
      </div>
      <span className="text-sm font-semibold text-[var(--text-tertiary)]">{label}</span>
    </div>
  );
}
