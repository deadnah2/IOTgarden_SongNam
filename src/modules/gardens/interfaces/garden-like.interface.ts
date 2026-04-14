import type { Prisma } from '@prisma/client';

export interface GardenLike {
  id: number;
  name: string;
  userId: number;
  temperatureThreshold: Prisma.Decimal | null;
  humidityThreshold: Prisma.Decimal | null;
  led1State: 'On' | 'Off';
  led2State: 'On' | 'Off';
  led3State: 'On' | 'Off';
  ledSyncedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}
