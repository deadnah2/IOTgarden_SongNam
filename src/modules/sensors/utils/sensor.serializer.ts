import { Prisma } from '@prisma/client';

type SensorLike = {
  id: number;
  gardenId: number;
  temperature: Prisma.Decimal;
  humidity: Prisma.Decimal;
  recordedAt: Date;
};

export function serializeSensorData(sensor: SensorLike) {
  return {
    id: sensor.id,
    gardenId: sensor.gardenId,
    temperature: sensor.temperature.toNumber(),
    humidity: sensor.humidity.toNumber(),
    recordedAt: sensor.recordedAt,
  };
}
