import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

type Trend = "up" | "down" | "flat";

export function MetricCard({
  title,
  value,
  subtitle,
  trend,
  trendLabel,
  accent,
}: {
  title: string;
  value: string;
  subtitle?: string;
  trend?: Trend;
  trendLabel?: string;
  accent?: "green" | "red" | "amber";
}) {
  const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;
  const trendColor =
    trend === "up" ? "text-emerald-600" : trend === "down" ? "text-red-600" : "text-slate-400";
  const accentBar =
    accent === "green"
      ? "bg-emerald-500"
      : accent === "red"
        ? "bg-red-500"
        : accent === "amber"
          ? "bg-amber-400"
          : "bg-slate-200";

  return (
    <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-white p-5">
      <div className={cn("absolute left-0 top-0 h-full w-1", accentBar)} />
      <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">{title}</p>
      <p className="mt-2 text-2xl font-bold leading-none tracking-tight text-slate-900">{value}</p>
      {(subtitle ?? trendLabel) && (
        <div className="mt-2 flex items-center gap-1.5">
          {trend && <TrendIcon className={cn("h-3.5 w-3.5", trendColor)} />}
          <span className={cn("text-xs", trendLabel ? trendColor : "text-slate-500")}>
            {trendLabel ?? subtitle}
          </span>
        </div>
      )}
    </div>
  );
}
