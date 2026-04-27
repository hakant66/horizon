import { format } from "date-fns";
import { PageHeader } from "@/components/domain/PageHeader";
import { AuditTimeline } from "@/components/domain/AuditTimeline";
import { DataTable } from "@/components/domain/DataTable";
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
      <PageHeader title="Audit Trail" description="Read-only event history for user and system changes." />

      <DataTable
        data={logs}
        columns={[
          { key: "time", header: "Time", render: (row) => format(row.createdAt, "yyyy-MM-dd HH:mm:ss") },
          { key: "user", header: "User", render: (row) => row.user?.name || "System" },
          { key: "action", header: "Action", render: (row) => row.action },
          { key: "entity", header: "Entity", render: (row) => `${row.entityType}:${row.entityId}` },
          { key: "before", header: "Before", render: (row) => (row.beforeValueJson ? JSON.stringify(row.beforeValueJson) : "-") },
          { key: "after", header: "After", render: (row) => (row.afterValueJson ? JSON.stringify(row.afterValueJson) : "-") },
        ]}
      />

      <AuditTimeline
        items={logs.slice(0, 20).map((log) => ({
          id: log.id,
          timestamp: format(log.createdAt, "HH:mm"),
          text: `${log.user?.name || "System"} ${log.action.toLowerCase().replaceAll("_", " ")}`,
        }))}
      />
    </div>
  );
}
