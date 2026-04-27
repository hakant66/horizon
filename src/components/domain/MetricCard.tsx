import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function MetricCard({ title, value, subtitle }: { title: string; value: string; subtitle?: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold">{value}</p>
        {subtitle ? <p className="text-sm text-slate-600">{subtitle}</p> : null}
      </CardContent>
    </Card>
  );
}
