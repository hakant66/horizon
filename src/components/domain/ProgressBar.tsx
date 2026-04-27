import { Progress } from "@/components/ui/progress";

export function ProgressBar({ value, label }: { value: number; label?: string }) {
  return (
    <div className="space-y-2">
      {label ? <div className="text-sm text-slate-700">{label}</div> : null}
      <Progress value={value} />
      <div className="text-xs text-slate-500">{Math.round(value)}% complete</div>
    </div>
  );
}
