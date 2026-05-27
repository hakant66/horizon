import { requireRole } from "@/lib/rbac";
import { taskSchema } from "@/lib/validation";
import { apiError, apiOk } from "@/lib/api";
import { listTasks, createTask, updateTask, deleteTask } from "@/services/task.service";

export async function GET(request: Request) {
  try {
    const user = await requireRole([
      "ADMIN", "SUSTAINABILITY_MANAGER", "DATA_CONTRIBUTOR",
      "FINANCE_REVIEWER", "AUDITOR", "HORIZON_CONSULTANT",
    ]);
    const sp = new URL(request.url).searchParams;
    return apiOk(await listTasks(user, {
      assignedToMe:    sp.get("mine") === "true",
      status:          sp.get("status") ?? undefined,
      reportingPeriodId: sp.get("reportingPeriodId") ?? undefined,
    }));
  } catch (error) {
    return apiError(error, 401);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireRole(["ADMIN", "SUSTAINABILITY_MANAGER", "HORIZON_CONSULTANT"]);
    const body = taskSchema.parse(await request.json());
    return apiOk(await createTask(user, body), 201);
  } catch (error) {
    return apiError(error, 400);
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await requireRole([
      "ADMIN", "SUSTAINABILITY_MANAGER", "DATA_CONTRIBUTOR",
      "FINANCE_REVIEWER", "HORIZON_CONSULTANT",
    ]);
    const body = taskSchema.partial().extend({ id: taskSchema.shape.id.unwrap() }).parse(await request.json());
    if (!body.id) return apiError(new Error("id required"), 400);
    return apiOk(await updateTask(user, body as Parameters<typeof updateTask>[1]));
  } catch (error) {
    return apiError(error, 400);
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await requireRole(["ADMIN", "HORIZON_CONSULTANT"]);
    const { id } = await request.json() as { id: string };
    if (!id) return apiError(new Error("id required"), 400);
    await deleteTask(user, id);
    return apiOk({ deleted: true });
  } catch (error) {
    return apiError(error, 400);
  }
}
