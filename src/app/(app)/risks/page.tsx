import { PageHeader } from "@/components/domain/PageHeader";
import { RisksClient } from "@/components/domain/RisksClient";
import { EmptyState } from "@/components/domain/EmptyState";
import { getWorkspaceContext } from "@/lib/context";
import { prisma } from "@/lib/prisma";

export default async function RisksPage() {
  const { organization, reportingPeriod } = await getWorkspaceContext();
  if (!reportingPeriod) {
    return <EmptyState title="No reporting period" description="Create one in Setup to manage climate risks." />;
  }

  const [facilities, users, risks] = await Promise.all([
    prisma.facility.findMany({ where: { organizationId: organization.id }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.user.findMany({ where: { organizationId: organization.id }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.climateRisk.findMany({
      where: { organizationId: organization.id, reportingPeriodId: reportingPeriod.id },
      include: { facility: true, ownerUser: { select: { name: true } }, scenarios: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <div className="space-y-4">
      <PageHeader title="Risks & Scenarios" description="Maintain climate risk register and scenario analysis." />
      <RisksClient
        reportingPeriodId={reportingPeriod.id}
        facilities={facilities}
        users={users}
        risks={risks.map((risk) => ({
          ...risk,
          scenarios: risk.scenarios.map((s) => ({
            ...s,
            estimatedRevenueImpactPercent: s.estimatedRevenueImpactPercent?.toString() || null,
          })),
        }))}
      />
    </div>
  );
}
