import { requireRole } from "@/lib/rbac";
import { targetSchema } from "@/lib/validation";
import { apiError, apiOk } from "@/lib/api";
import { listTargets, createTarget, updateTarget, deleteTarget } from "@/services/target.service";

export async function GET(request: Request) {
  try {
    const user = await requireRole(["ADMIN", "SUSTAINABILITY_MANAGER", "FINANCE_REVIEWER", "AUDITOR"]);
    const reportingPeriodId = new URL(request.url).searchParams.get("reportingPeriodId") || undefined;
    return apiOk(await listTargets(user, reportingPeriodId));
  } catch (error) {
    return apiError(error, 401);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireRole(["ADMIN", "SUSTAINABILITY_MANAGER"]);
    const payload = targetSchema.parse(await request.json());
    return apiOk(await createTarget(user, payload), 201);
  } catch (error) {
    return apiError(error, 400);
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await requireRole(["ADMIN", "SUSTAINABILITY_MANAGER"]);
    const payload = targetSchema.parse(await request.json());
    return apiOk(await updateTarget(user, payload));
  } catch (error) {
    return apiError(error, 400);
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await requireRole(["ADMIN", "SUSTAINABILITY_MANAGER"]);
    const { id } = (await request.json()) as { id: string };
    await deleteTarget(user, id);
    return apiOk({ success: true });
  } catch (error) {
    return apiError(error, 400);
  }
}
