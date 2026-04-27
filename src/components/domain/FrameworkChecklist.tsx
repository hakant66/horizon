import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/domain/StatusBadge";

export function FrameworkChecklist({
  framework,
  checks,
}: {
  framework: string;
  checks: { label: string; complete: boolean }[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{framework} Checklist</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {checks.map((check) => (
          <div key={check.label} className="flex items-center justify-between">
            <span className="text-sm text-slate-700">{check.label}</span>
            <StatusBadge status={check.complete ? "Complete" : "Pending"} />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
