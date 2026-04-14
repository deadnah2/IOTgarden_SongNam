import type { NotificationType, Prisma } from '@prisma/client';

export interface NotificationLike {
  id: number;
  gardenId: number;
  type: NotificationType;
  message: string;
  temperature: Prisma.Decimal | null;
  humidity: Prisma.Decimal | null;
  thresholdValue: Prisma.Decimal | null;
  createdAt: Date;
}
