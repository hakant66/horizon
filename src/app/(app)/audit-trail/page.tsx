import { PageHeader } from "@/components/domain/PageHeader";
import { AuditTrailClient } from "@/components/domain/AuditTrailClient";
import { getWorkspaceContext } from "@/lib/context";
import { prisma } from "@/lib/prisma";

export default async function AuditTrailPage() {
  const { organization } = await getWorkspaceContext();
  const logs = await prisma.auditLog.findMany({
    where: { organizationId: organization.id },
    include: { user: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <div className="space-y-4">
      <PageHeader
        title="Audit Trail"
        titleTr="Denetim İzleri"
        titleEn="Audit Trail"
        description="Read-only event history for user and system changes."
        descriptionTr="Kullanıcı ve sistem değişiklikleri için salt okunur olay geçmişi."
        descriptionEn="Read-only event history for user and system changes."
      />

      <AuditTrailClient
        logs={logs.map((log) => ({
          ...log,
          createdAt: log.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
