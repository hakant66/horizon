import { PageHeader } from "@/components/domain/PageHeader";
import { CertificationClient } from "@/components/domain/CertificationClient";
import { EmptyState } from "@/components/domain/EmptyState";
import { getWorkspaceContext } from "@/lib/context";
import { prisma } from "@/lib/prisma";

export default async function CertificationPage() {
  const { organization, reportingPeriod } = await getWorkspaceContext();
  if (!reportingPeriod) {
    return <EmptyState title="No reporting period" description="Create one in Setup to run certification workflow." />;
  }

  const [reports, submissions] = await Promise.all([
    prisma.report.findMany({
      where: { organizationId: organization.id, reportingPeriodId: reportingPeriod.id },
      select: { id: true, framework: true },
    }),
    prisma.certificationSubmission.findMany({
      where: { organizationId: organization.id, reportingPeriodId: reportingPeriod.id },
      include: { report: { select: { framework: true } } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <div className="space-y-4">
      <PageHeader title="Certification" description="Manage submissions, auditor review, and certification decisions." />
      <CertificationClient reportingPeriodId={reportingPeriod.id} reports={reports} submissions={submissions} />
    </div>
  );
}
