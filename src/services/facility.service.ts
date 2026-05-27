import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";
import type { z } from "zod";
import type { facilitySchema } from "@/lib/validation";
import type { AuthUser } from "@/services/types";

type FacilityPayload = z.infer<typeof facilitySchema>;

export async function listFacilities(user: AuthUser) {
  return prisma.facility.findMany({
    where: { organizationId: user.organizationId }, // tenant-scope
    orderBy: { createdAt: "desc" },
  });
}

export async function createFacility(user: AuthUser, payload: FacilityPayload) {
  const facility = await prisma.facility.create({
    data: {
      organizationId: user.organizationId,
      name: payload.name,
      country: payload.country,
      city: payload.city ?? null,
      facilityType: payload.facilityType,
    },
  });

  await createAuditLog({
    organizationId: user.organizationId,
    userId: user.id,
    action: "FACILITY_CREATED",
    entityType: "Facility",
    entityId: facility.id,
    afterValueJson: facility,
  });

  return facility;
}

export async function updateFacility(user: AuthUser, payload: FacilityPayload) {
  if (!payload.id) throw new Error("id is required");

  const before = await prisma.facility.findFirstOrThrow({
    where: { id: payload.id, organizationId: user.organizationId }, // tenant-scope
  });

  const facility = await prisma.facility.update({
    where: { id: payload.id },
    data: {
      name: payload.name,
      country: payload.country,
      city: payload.city ?? null,
      facilityType: payload.facilityType,
    },
  });

  await createAuditLog({
    organizationId: user.organizationId,
    userId: user.id,
    action: "FACILITY_UPDATED",
    entityType: "Facility",
    entityId: facility.id,
    beforeValueJson: before,
    afterValueJson: facility,
  });

  return facility;
}

export async function deleteFacility(user: AuthUser, id: string) {
  const before = await prisma.facility.findFirstOrThrow({
    where: { id, organizationId: user.organizationId }, // tenant-scope
  });

  await prisma.facility.delete({ where: { id } });

  await createAuditLog({
    organizationId: user.organizationId,
    userId: user.id,
    action: "FACILITY_DELETED",
    entityType: "Facility",
    entityId: id,
    beforeValueJson: before,
  });
}
