import { requireRole } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { apiError, apiOk } from "@/lib/api";

export async function GET(request: Request) {
  try {
    const user = await requireRole([
      "ADMIN", "SUSTAINABILITY_MANAGER", "DATA_CONTRIBUTOR",
      "FINANCE_REVIEWER", "AUDITOR", "HORIZON_CONSULTANT",
    ]);

    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get("unread") === "true";
    const limitParam = searchParams.get("limit");
    const limit = limitParam ? Math.min(parseInt(limitParam, 10), 100) : 50;

    const [notifications, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: {
          userId: user.id,
          ...(unreadOnly ? { isRead: false } : {}),
        },
        orderBy: { createdAt: "desc" },
        take: limit,
      }),
      prisma.notification.count({ where: { userId: user.id, isRead: false } }),
    ]);

    return apiOk({ notifications, unreadCount });
  } catch (error) {
    return apiError(error, 401);
  }
}

// Mark all notifications as read for the current user.
export async function PUT() {
  try {
    const user = await requireRole([
      "ADMIN", "SUSTAINABILITY_MANAGER", "DATA_CONTRIBUTOR",
      "FINANCE_REVIEWER", "AUDITOR", "HORIZON_CONSULTANT",
    ]);

    await prisma.notification.updateMany({
      where: { userId: user.id, isRead: false },
      data: { isRead: true },
    });

    return apiOk({ success: true });
  } catch (error) {
    return apiError(error, 400);
  }
}
