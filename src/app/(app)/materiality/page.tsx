import { PageHeader } from "@/components/domain/PageHeader";
import { MaterialityClient } from "@/components/domain/MaterialityClient";
import { EmptyState } from "@/components/domain/EmptyState";
import { getWorkspaceContext } from "@/lib/context";
import { prisma } from "@/lib/prisma";
import { getDefaultMaterialityTopics } from "@/lib/sector-mappings";

export default async function MaterialityPage() {
  const { organization, reportingPeriod } = await getWorkspaceContext();

  if (!reportingPeriod) {
    return <EmptyState title="No reporting period" description="Create a reporting period in Setup first." />;
  }

  const topics = await prisma.materialityTopic.findMany({
    where: { organizationId: organization.id, reportingPeriodId: reportingPeriod.id },
    orderBy: { name: "asc" },
  });

  // Derive sector-specific suggested topics — used client-side to pre-populate new rows
  const suggestedTopics = getDefaultMaterialityTopics(organization.sasbSector);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Materiality"
        titleTr="Önemlilik"
        titleEn="Materiality"
        description="Score ESG topics and generate materiality matrix."
        descriptionTr="ESG konularını puanlayın ve önemlilik matrisini oluşturun."
        descriptionEn="Score ESG topics and generate materiality matrix."
      />
      <MaterialityClient
        reportingPeriodId={reportingPeriod.id}
        topics={topics}
        suggestedTopics={suggestedTopics}
        sasbSector={organization.sasbSector ?? null}
      />
    </div>
  );
}
