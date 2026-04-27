import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/rbac";

export async function getWorkspaceContext() {
  const user = await requireAuth();
  const organization = await prisma.organization.findUniqueOrThrow({ where: { id: user.organizationId } });
  const reportingPeriod = await prisma.reportingPeriod.findFirst({
    where: { organizationId: user.organizationId },
    orderBy: { startDate: "desc" },
  });
  return { user, organization, reportingPeriod };
}
