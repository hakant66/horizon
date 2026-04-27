import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function CalculationDetailsCard({
  activity,
  factor,
  formula,
  result,
  source,
  version,
}: {
  activity: string;
  factor: string;
  formula: string;
  result: string;
  source: string;
  version: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Calculation Details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-1 text-sm">
        <p>Activity Data: {activity}</p>
        <p>Emission Factor: {factor}</p>
        <p>Formula: {formula}</p>
        <p className="font-semibold">Result: {result}</p>
        <p className="text-xs text-amber-700">Factor Source: {source} ({version})</p>
      </CardContent>
    </Card>
  );
}
