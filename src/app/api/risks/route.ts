import { requireRole } from "@/lib/rbac";
import { climateRiskSchema } from "@/lib/validation";
import { apiError, apiOk } from "@/lib/api";
import { listRisks, createRisk, updateRisk, deleteRisk } from "@/services/climate-risk.service";

export async function GET(request: Request) {
  try {
    const user = await requireRole(["ADMIN", "SUSTAINABILITY_MANAGER", "FINANCE_REVIEWER", "AUDITOR"]);
    const reportingPeriodId = new URL(request.url).searchParams.get("reportingPeriodId") || undefined;
    return apiOk(await listRisks(user, reportingPeriodId));
  } catch (error) {
    return apiError(error, 401);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireRole(["ADMIN", "SUSTAINABILITY_MANAGER", "FINANCE_REVIEWER"]);
    const payload = climateRiskSchema.parse(await request.json());
    return apiOk(await createRisk(user, payload), 201);
  } catch (error) {
    return apiError(error, 400);
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await requireRole(["ADMIN", "SUSTAINABILITY_MANAGER", "FINANCE_REVIEWER"]);
    const payload = climateRiskSchema.parse(await request.json());
    return apiOk(await updateRisk(user, payload));
  } catch (error) {
    return apiError(error, 400);
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await requireRole(["ADMIN", "SUSTAINABILITY_MANAGER"]);
    const { id } = (await request.json()) as { id: string };
    await deleteRisk(user, id);
    return apiOk({ success: true });
  } catch (error) {
    return apiError(error, 400);
  }
}
