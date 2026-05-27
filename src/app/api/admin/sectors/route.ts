import { requireRole } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { sectorDefinitionSchema } from "@/lib/validation";
import { apiError, apiOk } from "@/lib/api";
import { createAuditLog } from "@/lib/audit";

export async function GET() {
  try {
    await requireRole([
      "ADMIN", "SUSTAINABILITY_MANAGER", "FINANCE_REVIEWER",
      "DATA_CONTRIBUTOR", "AUDITOR", "HORIZON_CONSULTANT",
    ]);
    const sectors = await prisma.sectorDefinition.findMany({
      include: { children: { select: { id: true, code: true, name_tr: true, name_en: true } } },
      orderBy: { code: "asc" },
    });
    return apiOk(sectors);
  } catch (error) {
    return apiError(error, 401);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireRole(["ADMIN", "HORIZON_CONSULTANT"]);
    const body = sectorDefinitionSchema.parse(await request.json());

    const existing = await prisma.sectorDefinition.findUnique({ where: { code: body.code } });
    if (existing) return apiError(new Error(`Sector code '${body.code}' already exists`), 409);

    if (body.parentId) {
      await prisma.sectorDefinition.findUniqueOrThrow({ where: { id: body.parentId } });
    }

    const sector = await prisma.sectorDefinition.create({
      data: {
        code: body.code,
        name_tr: body.name_tr,
        name_en: body.name_en,
        parentId: body.parentId ?? null,
        isActive: body.isActive,
        metricCodes: body.metricCodes,
      },
    });

    await createAuditLog({
      organizationId: user.organizationId,
      userId: user.id,
      action: "SECTOR_CREATED",
      entityType: "SectorDefinition",
      entityId: sector.id,
      afterValueJson: sector,
    });

    return apiOk(sector, 201);
  } catch (error) {
    return apiError(error, 400);
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await requireRole(["ADMIN", "HORIZON_CONSULTANT"]);
    const body = sectorDefinitionSchema.parse(await request.json());
    if (!body.id) return apiError(new Error("id required"), 400);

    const existing = await prisma.sectorDefinition.findUniqueOrThrow({ where: { id: body.id } });

    if (body.parentId === body.id) {
      return apiError(new Error("A sector cannot be its own parent"), 400);
    }

    const updated = await prisma.sectorDefinition.update({
      where: { id: body.id },
      data: {
        name_tr: body.name_tr,
        name_en: body.name_en,
        parentId: body.parentId ?? null,
        isActive: body.isActive,
        metricCodes: body.metricCodes,
      },
    });

    await createAuditLog({
      organizationId: user.organizationId,
      userId: user.id,
      action: "SECTOR_UPDATED",
      entityType: "SectorDefinition",
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

    const existing = await prisma.sectorDefinition.findUniqueOrThrow({ where: { id } });

    const childCount = await prisma.sectorDefinition.count({ where: { parentId: id } });
    if (childCount > 0) {
      return apiError(new Error("Cannot delete a sector that has sub-sectors"), 400);
    }

    await prisma.sectorDefinition.delete({ where: { id } });

    await createAuditLog({
      organizationId: user.organizationId,
      userId: user.id,
      action: "SECTOR_DELETED",
      entityType: "SectorDefinition",
      entityId: id,
      beforeValueJson: existing,
    });

    return apiOk({ deleted: true });
  } catch (error) {
    return apiError(error, 400);
  }
}
