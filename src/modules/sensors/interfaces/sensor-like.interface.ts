import type { Prisma } from '@prisma/client';

export interface SensorLike {
  id: number;
  gardenId: number;
  temperature: Prisma.Decimal;
  humidity: Prisma.Decimal;
  recordedAt: Date;
}
