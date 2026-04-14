import type { NotificationType, Prisma } from '@prisma/client';

export interface ThresholdNotificationInput {
  gardenId: number;
  type: NotificationType;
  currentValue: number;
  threshold: Prisma.Decimal | null;
  temperature: number;
  humidity: number;
  message: string;
}
