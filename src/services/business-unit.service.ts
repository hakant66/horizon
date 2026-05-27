import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";
import type { z } from "zod";
import type { businessUnitSchema } from "@/lib/validation";
import type { AuthUser } from "@/services/types";

type BusinessUnitPayload = z.infer<typeof businessUnitSchema>;

export async function listBusinessUnits(user: AuthUser) {
  return prisma.businessUnit.findMany({
    where: { organizationId: user.organizationId }, // tenant-scope
    include: { children: { select: { id: true, name: true } } },
    orderBy: { name: "asc" },
  });
}

export async function createBusinessUnit(user: AuthUser, body: BusinessUnitPayload) {
  if (body.parentId) {
    // Verify parent belongs to same org.
    await prisma.businessUnit.findFirstOrThrow({
      where: { id: body.parentId, organizationId: user.organizationId }, // tenant-scope
    });
  }

  const unit = await prisma.businessUnit.create({
    data: {
      organizationId: user.organizationId,
      name: body.name,
      parentId: body.parentId ?? null,
    },
  });

  await createAuditLog({
    organizationId: user.organizationId,
    userId: user.id,
    action: "BUSINESS_UNIT_CREATED",
    entityType: "BusinessUnit",
    entityId: unit.id,
    afterValueJson: unit,
  });

  return unit;
}

export async function updateBusinessUnit(user: AuthUser, body: BusinessUnitPayload) {
  if (!body.id) throw new Error("id required");
  if (body.parentId === body.id) throw new Error("A business unit cannot be its own parent");

  const existing = await prisma.businessUnit.findFirstOrThrow({
    where: { id: body.id, organizationId: user.organizationId }, // tenant-scope
  });

  const updated = await prisma.businessUnit.update({
    where: { id: body.id },
    data: { name: body.name, parentId: body.parentId ?? null },
  });

  await createAuditLog({
    organizationId: user.organizationId,
    userId: user.id,
    action: "BUSINESS_UNIT_UPDATED",
    entityType: "BusinessUnit",
    entityId: updated.id,
    beforeValueJson: existing,
    afterValueJson: updated,
  });

  return updated;
}

export async function deleteBusinessUnit(user: AuthUser, id: string) {
  if (!id) throw new Error("id required");

  const existing = await prisma.businessUnit.findFirstOrThrow({
    where: { id, organizationId: user.organizationId }, // tenant-scope
  });

  const childCount = await prisma.businessUnit.count({ where: { parentId: id } });
  if (childCount > 0) throw new Error("Cannot delete a business unit that has children");

  await prisma.businessUnit.delete({ where: { id } });

  await createAuditLog({
    organizationId: user.organizationId,
    userId: user.id,
    action: "BUSINESS_UNIT_DELETED",
    entityType: "BusinessUnit",
    entityId: id,
    beforeValueJson: existing,
  });
}
