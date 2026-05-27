import { requireRole } from "@/lib/rbac";
import { facilitySchema } from "@/lib/validation";
import { apiError, apiOk } from "@/lib/api";
import { listFacilities, createFacility, updateFacility, deleteFacility } from "@/services/facility.service";

export async function GET() {
  try {
    const user = await requireRole(["ADMIN", "SUSTAINABILITY_MANAGER", "FINANCE_REVIEWER", "DATA_CONTRIBUTOR", "AUDITOR"]);
    return apiOk(await listFacilities(user));
  } catch (error) {
    return apiError(error, 401);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireRole(["ADMIN", "SUSTAINABILITY_MANAGER"]);
    const payload = facilitySchema.parse(await request.json());
    return apiOk(await createFacility(user, payload), 201);
  } catch (error) {
    return apiError(error, 400);
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await requireRole(["ADMIN", "SUSTAINABILITY_MANAGER"]);
    const payload = facilitySchema.parse(await request.json());
    return apiOk(await updateFacility(user, payload));
  } catch (error) {
    return apiError(error, 400);
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await requireRole(["ADMIN"]);
    const { id } = (await request.json()) as { id: string };
    await deleteFacility(user, id);
    return apiOk({ success: true });
  } catch (error) {
    return apiError(error, 400);
  }
}
