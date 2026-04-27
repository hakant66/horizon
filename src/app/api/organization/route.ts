import { requireRole } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { orgSchema } from "@/lib/validation";
import { apiError, apiOk } from "@/lib/api";
import { createAuditLog } from "@/lib/audit";

export async function GET() {
  try {
    const user = await requireRole(["ADMIN", "SUSTAINABILITY_MANAGER", "FINANCE_REVIEWER", "DATA_CONTRIBUTOR", "AUDITOR"]);
    const org = await prisma.organization.findUniqueOrThrow({ where: { id: user.organizationId } });
    return apiOk(org);
  } catch (error) {
    return apiError(error, 401);
  }
}

export async function PUT(request: Request) {
  try {
    const user = await requireRole(["ADMIN"]);
    const body = orgSchema.parse(await request.json());
    const before = await prisma.organization.findUnique({ where: { id: user.organizationId } });
    const org = await prisma.organization.update({ where: { id: user.organizationId }, data: body });
    await createAuditLog({
      organizationId: user.organizationId,
      userId: user.id,
      action: "ORGANIZATION_UPDATED",
      entityType: "Organization",
      entityId: org.id,
      beforeValueJson: before,
      afterValueJson: org,
    });
    return apiOk(org);
  } catch (error) {
    return apiError(error, 400);
  }
}
