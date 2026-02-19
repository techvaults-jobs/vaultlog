import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "destructive";
type Size = "sm" | "md";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
}

const baseClasses = "btn inline-flex items-center justify-center";

const variantClasses: Record<Variant, string> = {
  primary: "btn-primary",
  secondary: "btn-secondary",
  ghost:
    "bg-transparent text-[var(--text-primary)] hover:bg-[var(--surface-secondary)] border border-transparent",
  destructive:
    "bg-[var(--error)] text-white hover:bg-[var(--error-light)] hover:text-[var(--error)]",
};

const sizeClasses: Record<Size, string> = {
  sm: "btn-sm",
  md: "",
};

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  children,
  ...props
}: ButtonProps) {
  const classes = [
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button className={classes} {...props}>
      {children}
    </button>
  );
}

