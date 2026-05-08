import { Card, CardContent } from "@/components/ui/card";

export function MetricCard({ title, value, subtitle }: { title: string; value: string; subtitle?: string }) {
  return (
    <Card className="min-w-0">
      <CardContent className="px-4 py-3">
        <p className="truncate text-xs font-medium text-slate-500">{title}</p>
        <p className="mt-1 text-xl font-bold text-slate-900 leading-tight break-all">{value}</p>
        {subtitle && <p className="mt-0.5 truncate text-xs text-slate-500">{subtitle}</p>}
      </CardContent>
    </Card>
  );
}
