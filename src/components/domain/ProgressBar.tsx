import { cn } from "@/lib/utils";

export function ProgressBar({
  value,
  label,
  showPercent = true,
}: {
  value: number;
  label?: string;
  showPercent?: boolean;
}) {
  const pct = Math.min(100, Math.max(0, Math.round(value)));
  const color =
    pct >= 80 ? "bg-emerald-500" : pct >= 50 ? "bg-amber-400" : "bg-red-500";

  return (
    <div className="space-y-1.5">
      {(label ?? showPercent) && (
        <div className="flex items-center justify-between">
          {label && <span className="text-xs font-medium text-slate-600">{label}</span>}
          {showPercent && (
            <span className={cn("text-xs font-semibold tabular-nums", pct >= 80 ? "text-emerald-700" : pct >= 50 ? "text-amber-700" : "text-red-700")}>
              {pct}%
            </span>
          )}
        </div>
      )}
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className={cn("h-full rounded-full transition-all duration-500", color)}
          style={{ width: `${pct}%` }}
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
    </div>
  );
}
