import { requireRole } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { esgSummarySchema } from "@/lib/validation";
import { apiError, apiOk } from "@/lib/api";
import { createAuditLog } from "@/lib/audit";

export async function GET() {
  try {
    const user = await requireRole([
      "ADMIN",
      "SUSTAINABILITY_MANAGER",
      "FINANCE_REVIEWER",
      "DATA_CONTRIBUTOR",
      "AUDITOR",
    ]);
    const summary = await prisma.esgSummary.findUnique({
      where: { organizationId: user.organizationId },
    });
    return apiOk(summary ?? null);
  } catch (error) {
    return apiError(error, 401);
  }
}

export async function PUT(request: Request) {
  try {
    const user = await requireRole(["ADMIN", "SUSTAINABILITY_MANAGER"]);
    const body = esgSummarySchema.parse(await request.json());

    const data = {
      ...body,
      fiscalYearStart: body.fiscalYearStart ? new Date(body.fiscalYearStart) : null,
      fiscalYearEnd: body.fiscalYearEnd ? new Date(body.fiscalYearEnd) : null,
    };

    const before = await prisma.esgSummary.findUnique({
      where: { organizationId: user.organizationId },
    });

    const summary = await prisma.esgSummary.upsert({
      where: { organizationId: user.organizationId },
      create: { organizationId: user.organizationId, ...data },
      update: data,
    });

    await createAuditLog({
      organizationId: user.organizationId,
      userId: user.id,
      action: "ESG_SUMMARY_UPDATED",
      entityType: "EsgSummary",
      entityId: summary.id,
      beforeValueJson: before,
      afterValueJson: summary,
    });

    return apiOk(summary);
  } catch (error) {
    return apiError(error, 400);
  }
}
