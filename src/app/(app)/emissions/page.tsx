import { PageHeader } from "@/components/domain/PageHeader";
import { EmissionsClient } from "@/components/domain/EmissionsClient";
import { EmptyState } from "@/components/domain/EmptyState";
import { getWorkspaceContext } from "@/lib/context";
import { prisma } from "@/lib/prisma";

export default async function EmissionsPage() {
  const { organization, reportingPeriod } = await getWorkspaceContext();
  if (!reportingPeriod) {
    return (
      <EmptyState
        title="No reporting period"
        titleTr="Raporlama dönemi yok"
        titleEn="No reporting period"
        description="Create one in Setup to run emissions calculations."
        descriptionTr="Emisyon hesaplamalarını çalıştırmak için Kurulum bölümünde bir dönem oluşturun."
        descriptionEn="Create one in Setup to run emissions calculations."
      />
    );
  }

  const [calculations, metricsForRecalc] = await Promise.all([
    prisma.emissionCalculation.findMany({
      where: { organizationId: organization.id, reportingPeriodId: reportingPeriod.id },
      include: {
        metricEntry: { include: { metricDefinition: true, facility: true } },
        emissionFactor: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.metricEntry.findMany({
      where: { organizationId: organization.id, reportingPeriodId: reportingPeriod.id },
      include: { metricDefinition: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Emissions"
        titleTr="Emisyonlar"
        titleEn="Emissions"
        description="Calculate and review Scope 1 and Scope 2 emissions with transparent formulas."
        descriptionTr="Scope 1 ve Scope 2 emisyonlarını şeffaf formüllerle hesaplayın ve gözden geçirin."
        descriptionEn="Calculate and review Scope 1 and Scope 2 emissions with transparent formulas."
      />
      <EmissionsClient
        calculations={calculations.map((row) => ({
          ...row,
          activityValue: row.activityValue.toString(),
          factorValue: row.factorValue.toString(),
          resultTCO2e: row.resultTCO2e.toString(),
        }))}
        metricsForRecalc={metricsForRecalc.map((m) => ({ ...m, value: m.value?.toString() || null }))}
      />
    </div>
  );
}
