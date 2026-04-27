import { PageHeader } from "@/components/domain/PageHeader";
import { TargetsClient } from "@/components/domain/TargetsClient";
import { EmptyState } from "@/components/domain/EmptyState";
import { getWorkspaceContext } from "@/lib/context";
import { prisma } from "@/lib/prisma";
import { calculateTargetProgress } from "@/lib/calculations";

export default async function TargetsPage() {
  const { organization, reportingPeriod } = await getWorkspaceContext();
  if (!reportingPeriod) {
    return (
      <EmptyState
        title="No reporting period"
        titleTr="Raporlama dönemi yok"
        titleEn="No reporting period"
        description="Create one in Setup to define targets."
        descriptionTr="Hedefleri tanımlamak için Kurulum bölümünde bir dönem oluşturun."
        descriptionEn="Create one in Setup to define targets."
      />
    );
  }

  const [metricDefinitions, targets] = await Promise.all([
    prisma.metricDefinition.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.target.findMany({
      where: { organizationId: organization.id, reportingPeriodId: reportingPeriod.id },
      include: { metricDefinition: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Targets"
        titleTr="Hedefler"
        titleEn="Targets"
        description="Track target progress and KPI status across reporting periods."
        descriptionTr="Raporlama dönemleri boyunca hedef ilerlemesini ve KPI durumunu takip edin."
        descriptionEn="Track target progress and KPI status across reporting periods."
      />
      <TargetsClient
        reportingPeriodId={reportingPeriod.id}
        metricDefinitions={metricDefinitions}
        targets={targets.map((target) => ({
          ...target,
          baselineValue: target.baselineValue.toString(),
          targetValue: target.targetValue.toString(),
          currentValue: target.currentValue.toString(),
          progress: calculateTargetProgress({
            baselineValue: Number(target.baselineValue),
            currentValue: Number(target.currentValue),
            targetValue: Number(target.targetValue),
          }),
        }))}
      />
    </div>
  );
}
