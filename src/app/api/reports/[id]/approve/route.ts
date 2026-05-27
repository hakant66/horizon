import { requireRole } from "@/lib/rbac";
import { reportApprovalSchema } from "@/lib/validation";
import { apiError, apiOk } from "@/lib/api";
import { approveReport } from "@/services/report.service";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireRole(["ADMIN", "HORIZON_CONSULTANT"]);
    const { id } = await params;
    const body = reportApprovalSchema.parse(await request.json());
    return apiOk(await approveReport(user, id, body));
  } catch (error) {
    const status = (error as { httpStatus?: number }).httpStatus ?? 400;
    return apiError(error, status);
  }
}
