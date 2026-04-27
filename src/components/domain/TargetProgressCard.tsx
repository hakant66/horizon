import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProgressBar } from "@/components/domain/ProgressBar";
import { StatusBadge } from "@/components/domain/StatusBadge";

export function TargetProgressCard({
  name,
  baseline,
  current,
  progress,
  status,
}: {
  name: string;
  baseline: string;
  current: string;
  progress: number;
  status: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{name}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-slate-700">Baseline: {baseline}</p>
        <p className="text-sm text-slate-700">Current: {current}</p>
        <ProgressBar value={progress} />
        <StatusBadge status={status} />
      </CardContent>
    </Card>
  );
}
