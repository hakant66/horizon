import { requireRole } from "@/lib/rbac";
import { materialitySchema } from "@/lib/validation";
import { apiError, apiOk } from "@/lib/api";
import { listMaterialityTopics, upsertMaterialityTopic } from "@/services/materiality.service";

export async function GET(request: Request) {
  try {
    const user = await requireRole(["ADMIN", "SUSTAINABILITY_MANAGER", "FINANCE_REVIEWER", "AUDITOR"]);
    const reportingPeriodId = new URL(request.url).searchParams.get("reportingPeriodId") || undefined;
    return apiOk(await listMaterialityTopics(user, reportingPeriodId));
  } catch (error) {
    return apiError(error, 401);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireRole(["ADMIN", "SUSTAINABILITY_MANAGER"]);
    const payload = materialitySchema.parse(await request.json());
    return apiOk(await upsertMaterialityTopic(user, payload), 201);
  } catch (error) {
    return apiError(error, 400);
  }
}
