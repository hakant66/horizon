import { requireRole } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { apiError, apiOk } from "@/lib/api";

export async function GET(request: Request) {
  try {
    const user = await requireRole(["ADMIN", "SUSTAINABILITY_MANAGER", "FINANCE_REVIEWER", "AUDITOR"]);
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action") || undefined;
    const entityType = searchParams.get("entityType") || undefined;
    const userId = searchParams.get("userId") || undefined;

    const logs = await prisma.auditLog.findMany({
      where: {
        organizationId: user.organizationId,
        ...(action ? { action } : {}),
        ...(entityType ? { entityType } : {}),
        ...(userId ? { userId } : {}),
      },
      include: { user: { select: { name: true, email: true } } },
      orderBy: { createdAt: "desc" },
      take: 500,
    });

    return apiOk(logs);
  } catch (error) {
    return apiError(error, 401);
  }
}
