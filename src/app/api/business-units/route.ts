import { requireRole } from "@/lib/rbac";
import { businessUnitSchema } from "@/lib/validation";
import { apiError, apiOk } from "@/lib/api";
import { listBusinessUnits, createBusinessUnit, updateBusinessUnit, deleteBusinessUnit } from "@/services/business-unit.service";

export async function GET() {
  try {
    const user = await requireRole([
      "ADMIN", "SUSTAINABILITY_MANAGER", "FINANCE_REVIEWER",
      "DATA_CONTRIBUTOR", "AUDITOR", "HORIZON_CONSULTANT",
    ]);
    return apiOk(await listBusinessUnits(user));
  } catch (error) {
    return apiError(error, 401);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireRole(["ADMIN", "SUSTAINABILITY_MANAGER"]);
    const body = businessUnitSchema.parse(await request.json());
    return apiOk(await createBusinessUnit(user, body), 201);
  } catch (error) {
    return apiError(error, 400);
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await requireRole(["ADMIN", "SUSTAINABILITY_MANAGER"]);
    const body = businessUnitSchema.parse(await request.json());
    if (!body.id) return apiError(new Error("id required"), 400);
    return apiOk(await updateBusinessUnit(user, body));
  } catch (error) {
    return apiError(error, 400);
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await requireRole(["ADMIN"]);
    const { id } = await request.json() as { id: string };
    if (!id) return apiError(new Error("id required"), 400);
    await deleteBusinessUnit(user, id);
    return apiOk({ deleted: true });
  } catch (error) {
    return apiError(error, 400);
  }
}
