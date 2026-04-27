import { PageHeader } from "@/components/domain/PageHeader";
import { MaterialityClient } from "@/components/domain/MaterialityClient";
import { EmptyState } from "@/components/domain/EmptyState";
import { getWorkspaceContext } from "@/lib/context";
import { prisma } from "@/lib/prisma";

export default async function MaterialityPage() {
  const { organization, reportingPeriod } = await getWorkspaceContext();

  if (!reportingPeriod) {
    return <EmptyState title="No reporting period" description="Create a reporting period in Setup first." />;
  }

  const topics = await prisma.materialityTopic.findMany({
    where: { organizationId: organization.id, reportingPeriodId: reportingPeriod.id },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-4">
      <PageHeader title="Materiality" description="Score ESG topics and generate materiality matrix." />
      <MaterialityClient reportingPeriodId={reportingPeriod.id} topics={topics} />
    </div>
  );
}
