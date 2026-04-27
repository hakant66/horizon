import Link from "next/link";
import { MetricCard } from "@/components/domain/MetricCard";
import { PageHeader } from "@/components/domain/PageHeader";
import { ProgressBar } from "@/components/domain/ProgressBar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getWorkspaceContext } from "@/lib/context";
import { getDashboardData } from "@/lib/dashboard";

export default async function DashboardPage() {
  const { organization, reportingPeriod } = await getWorkspaceContext();
  const data = await getDashboardData(organization.id, reportingPeriod?.id);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Home Dashboard"
        description="Track reporting readiness, missing data, and certification workflow status."
      />

      <Card>
        <CardHeader>
          <CardTitle>Reporting Readiness</CardTitle>
        </CardHeader>
        <CardContent>
          <ProgressBar value={data.readiness} label={`${data.readiness}% Complete`} />
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard title="Total Emissions" value={`${data.totalEmissionsTCO2e.toFixed(2)} tCO2e`} />
        <MetricCard title="Energy Consumption" value={`${data.energyTotal.toFixed(2)} (activity units)`} />
        <MetricCard title="Evidence Coverage" value={`${data.evidenceCoverage.toFixed(1)}%`} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Missing Data Alerts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            {data.missingDataAlerts.length ? (
              data.missingDataAlerts.map((alert) => <p key={alert}>- {alert}</p>)
            ) : (
              <p>All required data currently captured.</p>
            )}
            <Link className="text-sm font-medium text-blue-700" href="/data-collection">
              Open Data Collection
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Workflow Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p>Reporting period: {reportingPeriod?.name || "Not configured"}</p>
            <p>Certification submissions in progress: {data.certCount}</p>
            <p>Internal review due: 15 Dec</p>
            <p>Certification submission due: 31 Dec</p>
            <Link className="text-sm font-medium text-blue-700" href="/certification">
              Open Certification Module
            </Link>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-4 text-xs text-amber-700">
          This platform provides structured sustainability reporting support. Final regulatory compliance and certification
          decisions require review by qualified professionals.
        </CardContent>
      </Card>
    </div>
  );
}
