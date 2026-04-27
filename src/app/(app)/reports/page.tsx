import { PageHeader } from "@/components/domain/PageHeader";
import { ReportsClient } from "@/components/domain/ReportsClient";
import { EmptyState } from "@/components/domain/EmptyState";
import { getWorkspaceContext } from "@/lib/context";
import { prisma } from "@/lib/prisma";

export default async function ReportsPage() {
  const { organization, reportingPeriod } = await getWorkspaceContext();
  if (!reportingPeriod) {
    return <EmptyState title="No reporting period" description="Create one in Setup to start reporting." />;
  }

  const reports = await prisma.report.findMany({
    where: { organizationId: organization.id, reportingPeriodId: reportingPeriod.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-4">
      <PageHeader title="Reports" description="Generate and manage IFRS/TSRS-aligned disclosure reports." />
      <ReportsClient
        reportingPeriodId={reportingPeriod.id}
        reports={reports.map((r) => ({
          ...r,
          generatedAt: r.generatedAt ? r.generatedAt.toISOString() : null,
        }))}
      />
    </div>
  );
}
