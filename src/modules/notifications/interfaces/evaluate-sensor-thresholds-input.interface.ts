import type { Prisma } from '@prisma/client';

export interface EvaluateSensorThresholdsInput {
  gardenId: number;
  temperature: number;
  humidity: number;
  temperatureThreshold: Prisma.Decimal | null;
  humidityThreshold: Prisma.Decimal | null;
}
