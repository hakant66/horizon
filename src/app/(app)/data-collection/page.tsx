import { PageHeader } from "@/components/domain/PageHeader";
import { DataCollectionClient } from "@/components/domain/DataCollectionClient";
import { EmptyState } from "@/components/domain/EmptyState";
import { getWorkspaceContext } from "@/lib/context";
import { prisma } from "@/lib/prisma";

export default async function DataCollectionPage() {
  const { organization, reportingPeriod } = await getWorkspaceContext();
  if (!reportingPeriod) {
    return <EmptyState title="No reporting period" description="Create one in Setup to start data collection." />;
  }

  const entries = await prisma.metricEntry.findMany({
    where: { organizationId: organization.id, reportingPeriodId: reportingPeriod.id },
    include: { facility: true, metricDefinition: true },
    orderBy: [{ facility: { name: "asc" } }, { metricDefinition: { name: "asc" } }],
  });

  return (
    <div className="space-y-4">
      <PageHeader title="Data Collection" description={`Reporting period: ${reportingPeriod.name}`} />
      <DataCollectionClient entries={entries.map((e) => ({ ...e, value: e.value?.toString() || null }))} />
    </div>
  );
}
