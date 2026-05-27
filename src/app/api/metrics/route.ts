import { requireRole } from "@/lib/rbac";
import { metricEntrySchema, approvalStageTransitionSchema } from "@/lib/validation";
import { apiError, apiOk } from "@/lib/api";
import {
  listMetricEntries,
  upsertMetricEntry,
  updateMetricEntry,
  transitionMetricStage,
} from "@/services/metric-entry.service";

export async function GET(request: Request) {
  try {
    const user = await requireRole([
      "ADMIN", "SUSTAINABILITY_MANAGER", "DATA_CONTRIBUTOR",
      "FINANCE_REVIEWER", "AUDITOR", "HORIZON_CONSULTANT",
    ]);
    const sp = new URL(request.url).searchParams;
    return apiOk(await listMetricEntries(user, {
      reportingPeriodId: sp.get("reportingPeriodId") || undefined,
      facilityId:        sp.get("facilityId")        || undefined,
    }));
  } catch (error) {
    return apiError(error, 401);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireRole(["ADMIN", "SUSTAINABILITY_MANAGER", "DATA_CONTRIBUTOR"]);
    const payload = metricEntrySchema.parse(await request.json());
    const result  = await upsertMetricEntry(user, payload);
    return apiOk(result, result.isNew ? 201 : 200);
  } catch (error) {
    const status = (error as { httpStatus?: number }).httpStatus ?? 400;
    return apiError(error, status);
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await requireRole([
      "ADMIN", "SUSTAINABILITY_MANAGER", "DATA_CONTRIBUTOR",
      "FINANCE_REVIEWER", "HORIZON_CONSULTANT",
    ]);
    const body = await request.json() as Record<string, unknown>;

    // Route to stage transition when the intent is only a stage change.
    const isStageTransition =
      body.stageTransition === true ||
      (body.approvalStage !== undefined &&
        !("value" in body) &&
        !("unit" in body) &&
        !("facilityId" in body));

    if (isStageTransition) {
      const payload = approvalStageTransitionSchema.parse(body);
      const result  = await transitionMetricStage(user, payload);
      return apiOk(result);
    }

    const payload = metricEntrySchema.parse(body);
    return apiOk(await updateMetricEntry(user, payload));
  } catch (error) {
    const status = (error as { httpStatus?: number }).httpStatus ?? 400;
    return apiError(error, status);
  }
}
