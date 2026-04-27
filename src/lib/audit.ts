import { prisma } from "@/lib/prisma";

export async function createAuditLog(params: {
  organizationId: string;
  userId?: string | null;
  action: string;
  entityType: string;
  entityId: string;
  beforeValueJson?: unknown;
  afterValueJson?: unknown;
}) {
  await prisma.auditLog.create({
    data: {
      organizationId: params.organizationId,
      userId: params.userId,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      beforeValueJson: params.beforeValueJson as object | undefined,
      afterValueJson: params.afterValueJson as object | undefined,
    },
  });
}
