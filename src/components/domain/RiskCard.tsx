import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/domain/StatusBadge";

export function RiskCard({
  name,
  type,
  probability,
  impact,
  owner,
}: {
  name: string;
  type: string;
  probability: string;
  impact: string;
  owner?: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{name}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-1 text-sm">
        <p>Type: {type}</p>
        <p>
          Probability: <StatusBadge status={probability} />
        </p>
        <p>
          Impact: <StatusBadge status={impact} />
        </p>
        <p>Owner: {owner || "Unassigned"}</p>
      </CardContent>
    </Card>
  );
}
