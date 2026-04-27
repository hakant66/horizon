import { requireRole } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { facilitySchema } from "@/lib/validation";
import { apiError, apiOk } from "@/lib/api";
import { createAuditLog } from "@/lib/audit";

export async function GET() {
  try {
    const user = await requireRole(["ADMIN", "SUSTAINABILITY_MANAGER", "FINANCE_REVIEWER", "DATA_CONTRIBUTOR", "AUDITOR"]);
    const rows = await prisma.facility.findMany({ where: { organizationId: user.organizationId }, orderBy: { createdAt: "desc" } });
    return apiOk(rows);
  } catch (error) {
    return apiError(error, 401);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireRole(["ADMIN", "SUSTAINABILITY_MANAGER"]);
    const data = facilitySchema.parse(await request.json());
    const facility = await prisma.facility.create({ data: { ...data, organizationId: user.organizationId } });
    await createAuditLog({
      organizationId: user.organizationId,
      userId: user.id,
      action: "FACILITY_CREATED",
      entityType: "Facility",
      entityId: facility.id,
      afterValueJson: facility,
    });
    return apiOk(facility, 201);
  } catch (error) {
    return apiError(error, 400);
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await requireRole(["ADMIN", "SUSTAINABILITY_MANAGER"]);
    const data = facilitySchema.parse(await request.json());
    if (!data.id) throw new Error("id is required");

    const before = await prisma.facility.findFirstOrThrow({ where: { id: data.id, organizationId: user.organizationId } });
    const facility = await prisma.facility.update({
      where: { id: data.id },
      data: {
        name: data.name,
        country: data.country,
        city: data.city,
        facilityType: data.facilityType,
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
    return apiOk(facility);
  } catch (error) {
    return apiError(error, 400);
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await requireRole(["ADMIN"]);
    const { id } = (await request.json()) as { id: string };
    const before = await prisma.facility.findFirstOrThrow({ where: { id, organizationId: user.organizationId } });
    await prisma.facility.delete({ where: { id } });
    await createAuditLog({
      organizationId: user.organizationId,
      userId: user.id,
      action: "FACILITY_DELETED",
      entityType: "Facility",
      entityId: id,
      beforeValueJson: before,
    });
    return apiOk({ success: true });
  } catch (error) {
    return apiError(error, 400);
  }
}
