import { requireRole } from "@/lib/rbac";
import { apiError, apiOk } from "@/lib/api";
import { getReportWithSummary } from "@/services/report.service";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireRole([
      "ADMIN", "SUSTAINABILITY_MANAGER", "FINANCE_REVIEWER", "AUDITOR", "HORIZON_CONSULTANT",
    ]);
    const { id } = await params;
    return apiOk(await getReportWithSummary(user, id));
  } catch (error) {
    return apiError(error, 400);
  }
}
