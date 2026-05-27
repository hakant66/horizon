import { NotificationType } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export interface CreateNotificationParams {
  organizationId: string;
  userId: string;
  type: NotificationType;
  title: string;
  body?: string;
  entityType?: string;
  entityId?: string;
}

export async function createNotification(params: CreateNotificationParams) {
  return prisma.notification.create({
    data: {
      organizationId: params.organizationId,
      userId: params.userId,
      type: params.type,
      title: params.title,
      body: params.body ?? null,
      entityType: params.entityType ?? null,
      entityId: params.entityId ?? null,
    },
  });
}

export async function createNotifications(params: CreateNotificationParams[]) {
  if (params.length === 0) return;
  return prisma.notification.createMany({ data: params });
}

export async function getUnreadCount(userId: string): Promise<number> {
  return prisma.notification.count({ where: { userId, isRead: false } });
}
