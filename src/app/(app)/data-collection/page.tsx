import { PageHeader } from "@/components/domain/PageHeader";
import { DataCollectionClient } from "@/components/domain/DataCollectionClient";
import { EmptyState } from "@/components/domain/EmptyState";
import { getWorkspaceContext } from "@/lib/context";
import { prisma } from "@/lib/prisma";

export default async function DataCollectionPage() {
  const { organization, reportingPeriod } = await getWorkspaceContext();
  if (!reportingPeriod) {
    return (
      <EmptyState
        title="No reporting period"
        titleTr="Raporlama dönemi yok"
        titleEn="No reporting period"
        description="Create one in Setup to start data collection."
        descriptionTr="Veri toplamayı başlatmak için Kurulum bölümünde bir dönem oluşturun."
        descriptionEn="Create one in Setup to start data collection."
      />
    );
  }

  const entries = await prisma.metricEntry.findMany({
    where: { organizationId: organization.id, reportingPeriodId: reportingPeriod.id },
    include: { facility: true, metricDefinition: true },
    orderBy: [{ facility: { name: "asc" } }, { metricDefinition: { name: "asc" } }],
  });
  const users = await prisma.user.findMany({
    where: { organizationId: organization.id },
    select: { id: true, name: true, email: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-4">
      <PageHeader
        title="Data Collection"
        titleTr="Veri Toplama"
        titleEn="Data Collection"
        description={`Reporting period: ${reportingPeriod.name}`}
        descriptionTr={`Raporlama dönemi: ${reportingPeriod.name}`}
        descriptionEn={`Reporting period: ${reportingPeriod.name}`}
      />
      <DataCollectionClient
        entries={entries.map((e) => ({ ...e, value: e.value?.toString() || null }))}
        users={users}
      />
    </div>
  );
}
