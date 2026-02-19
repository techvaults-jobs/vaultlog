import type { ReactNode } from "react";

type Tone = "neutral" | "success" | "info" | "warning" | "error";

const toneClass: Record<Tone, string> = {
  neutral: "badge badge-neutral",
  success: "badge badge-success",
  info: "badge badge-info",
  warning: "badge badge-warning",
  error: "badge badge-error",
};

interface StatusPillProps {
  tone?: Tone;
  children: ReactNode;
  className?: string;
}

export function StatusPill({
  tone = "neutral",
  children,
  className = "",
}: StatusPillProps) {
  return (
    <span className={`${toneClass[tone]} ${className}`.trim()}>
      {children}
    </span>
  );
}

