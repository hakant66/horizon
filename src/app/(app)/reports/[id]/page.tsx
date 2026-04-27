import { notFound } from "next/navigation";
import { PageHeader } from "@/components/domain/PageHeader";
import { ReportDetailClient } from "@/components/domain/ReportDetailClient";
import { getWorkspaceContext } from "@/lib/context";
import { prisma } from "@/lib/prisma";

export default async function ReportDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { organization } = await getWorkspaceContext();
  const { id } = await params;

  const report = await prisma.report.findFirst({
    where: { id, organizationId: organization.id },
  });

  if (!report) notFound();

  return (
    <div className="space-y-4">
      <PageHeader
        title={`Report ${report.framework}`}
        titleTr={`Rapor ${report.framework}`}
        titleEn={`Report ${report.framework}`}
        description={`Status: ${report.status}`}
        descriptionTr={`Durum: ${report.status}`}
        descriptionEn={`Status: ${report.status}`}
      />
      <ReportDetailClient report={report} reportingPeriodId={report.reportingPeriodId} />
    </div>
  );
}
