import { requireRole } from "@/lib/rbac";
import { scenarioSchema } from "@/lib/validation";
import { apiError, apiOk } from "@/lib/api";
import { listScenarios, createScenario, updateScenario, deleteScenario } from "@/services/scenario.service";

export async function GET(request: Request) {
  try {
    const user = await requireRole(["ADMIN", "SUSTAINABILITY_MANAGER", "FINANCE_REVIEWER", "AUDITOR"]);
    const climateRiskId = new URL(request.url).searchParams.get("climateRiskId");
    return apiOk(await listScenarios(user, climateRiskId));
  } catch (error) {
    return apiError(error, 401);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireRole(["ADMIN", "SUSTAINABILITY_MANAGER", "FINANCE_REVIEWER"]);
    const payload = scenarioSchema.parse(await request.json());
    return apiOk(await createScenario(user, payload), 201);
  } catch (error) {
    return apiError(error, 400);
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await requireRole(["ADMIN", "SUSTAINABILITY_MANAGER", "FINANCE_REVIEWER"]);
    const payload = scenarioSchema.parse(await request.json());
    return apiOk(await updateScenario(user, payload));
  } catch (error) {
    return apiError(error, 400);
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await requireRole(["ADMIN", "SUSTAINABILITY_MANAGER"]);
    const { id } = (await request.json()) as { id: string };
    await deleteScenario(user, id);
    return apiOk({ success: true });
  } catch (error) {
    return apiError(error, 400);
  }
}
