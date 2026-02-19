interface ProgressBarProps {
  value: number; // 0-100
}

export function ProgressBar({ value }: ProgressBarProps) {
  const safe = Math.min(100, Math.max(0, value));

  return (
    <div className="w-full h-2 rounded-full bg-[var(--surface-tertiary)] overflow-hidden">
      <div
        className="h-full bg-[var(--primary)] transition-all"
        style={{ width: `${safe}%` }}
      />
    </div>
  );
}

