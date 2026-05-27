import { requireRole } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { subsidiarySchema } from "@/lib/validation";
import { apiError, apiOk } from "@/lib/api";
import { createAuditLog } from "@/lib/audit";

export async function GET() {
  try {
    const user = await requireRole([
      "ADMIN", "SUSTAINABILITY_MANAGER", "FINANCE_REVIEWER",
      "DATA_CONTRIBUTOR", "AUDITOR", "HORIZON_CONSULTANT",
    ]);
    const subsidiaries = await prisma.subsidiary.findMany({
      where: { organizationId: user.organizationId },
      orderBy: { name: "asc" },
    });
    return apiOk(subsidiaries);
  } catch (error) {
    return apiError(error, 401);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireRole(["ADMIN", "SUSTAINABILITY_MANAGER"]);
    const body = subsidiarySchema.parse(await request.json());

    const subsidiary = await prisma.subsidiary.create({
      data: {
        organizationId: user.organizationId,
        name: body.name,
        country: body.country,
        ownershipPercent: body.ownershipPercent,
        isInScope: body.isInScope,
        consolidationNote: body.consolidationNote ?? null,
      },
    });

    await createAuditLog({
      organizationId: user.organizationId,
      userId: user.id,
      action: "SUBSIDIARY_CREATED",
      entityType: "Subsidiary",
      entityId: subsidiary.id,
      afterValueJson: subsidiary,
    });

    return apiOk(subsidiary, 201);
  } catch (error) {
    return apiError(error, 400);
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await requireRole(["ADMIN", "SUSTAINABILITY_MANAGER"]);
    const body = subsidiarySchema.parse(await request.json());
    if (!body.id) return apiError(new Error("id required"), 400);

    const existing = await prisma.subsidiary.findFirstOrThrow({
      where: { id: body.id, organizationId: user.organizationId },
    });

    const updated = await prisma.subsidiary.update({
      where: { id: body.id },
      data: {
        name: body.name,
        country: body.country,
        ownershipPercent: body.ownershipPercent,
        isInScope: body.isInScope,
        consolidationNote: body.consolidationNote ?? null,
      },
    });

    await createAuditLog({
      organizationId: user.organizationId,
      userId: user.id,
      action: "SUBSIDIARY_UPDATED",
      entityType: "Subsidiary",
      entityId: updated.id,
      beforeValueJson: existing,
      afterValueJson: updated,
    });

    return apiOk(updated);
  } catch (error) {
    return apiError(error, 400);
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await requireRole(["ADMIN"]);
    const { id } = await request.json() as { id: string };
    if (!id) return apiError(new Error("id required"), 400);

    const existing = await prisma.subsidiary.findFirstOrThrow({
      where: { id, organizationId: user.organizationId },
    });

    await prisma.subsidiary.delete({ where: { id } });

    await createAuditLog({
      organizationId: user.organizationId,
      userId: user.id,
      action: "SUBSIDIARY_DELETED",
      entityType: "Subsidiary",
      entityId: id,
      beforeValueJson: existing,
    });

    return apiOk({ deleted: true });
  } catch (error) {
    return apiError(error, 400);
  }
}
