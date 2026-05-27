import { requireRole } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { notificationReadSchema } from "@/lib/validation";
import { apiError, apiOk } from "@/lib/api";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireRole([
      "ADMIN", "SUSTAINABILITY_MANAGER", "DATA_CONTRIBUTOR",
      "FINANCE_REVIEWER", "AUDITOR", "HORIZON_CONSULTANT",
    ]);

    const { id } = await params;
    const body = notificationReadSchema.parse(await request.json());

    // Ensure the notification belongs to the requesting user.
    await prisma.notification.findFirstOrThrow({ where: { id, userId: user.id } });

    const updated = await prisma.notification.update({
      where: { id },
      data: { isRead: body.isRead },
    });

    return apiOk(updated);
  } catch (error) {
    return apiError(error, 400);
  }
}
