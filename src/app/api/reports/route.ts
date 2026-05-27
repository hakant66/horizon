import { requireRole } from "@/lib/rbac";
import { reportSchema } from "@/lib/validation";
import { apiError, apiOk } from "@/lib/api";
import { listReports, createReport, updateReport } from "@/services/report.service";

export async function GET(request: Request) {
  try {
    const user = await requireRole(["ADMIN", "SUSTAINABILITY_MANAGER", "FINANCE_REVIEWER", "AUDITOR", "HORIZON_CONSULTANT"]);
    const reportingPeriodId = new URL(request.url).searchParams.get("reportingPeriodId") || undefined;
    return apiOk(await listReports(user, reportingPeriodId));
  } catch (error) {
    return apiError(error, 401);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireRole(["ADMIN", "SUSTAINABILITY_MANAGER"]);
    const payload = reportSchema.parse(await request.json());
    return apiOk(await createReport(user, payload), 201);
  } catch (error) {
    return apiError(error, 400);
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await requireRole(["ADMIN", "SUSTAINABILITY_MANAGER", "FINANCE_REVIEWER", "HORIZON_CONSULTANT"]);
    const payload = reportSchema.partial().extend({ id: reportSchema.shape.id }).parse(await request.json());
    if (!payload.id) throw new Error("id required");
    return apiOk(await updateReport(user, payload as Parameters<typeof updateReport>[1]));
  } catch (error) {
    return apiError(error, 400);
  }
}
