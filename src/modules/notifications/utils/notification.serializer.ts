import { NotificationType, Prisma } from '@prisma/client';

type NotificationLike = {
  id: number;
  gardenId: number;
  type: NotificationType;
  message: string;
  temperature: Prisma.Decimal | null;
  humidity: Prisma.Decimal | null;
  thresholdValue: Prisma.Decimal | null;
  createdAt: Date;
};

export function serializeNotification(notification: NotificationLike) {
  return {
    ...notification,
    temperature: notification.temperature?.toNumber() ?? null,
    humidity: notification.humidity?.toNumber() ?? null,
    thresholdValue: notification.thresholdValue?.toNumber() ?? null,
  };
}
