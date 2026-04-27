import { PageHeader } from "@/components/domain/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SettingsPage() {
  return (
    <div className="space-y-4">
      <PageHeader title="Settings" description="Manage workspace-level preferences and system notices." />
      <Card>
        <CardHeader>
          <CardTitle>Compliance Notice</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-slate-700">
          <p>
            This platform provides structured sustainability reporting support. Final regulatory compliance and certification
            decisions require review by qualified professionals.
          </p>
          <p>
            Placeholder emission factors are used for demonstration and must be replaced with verified official sources before
            real certification use.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
