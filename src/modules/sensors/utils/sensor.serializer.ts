import type { SensorLike } from '../interfaces/sensor-like.interface';

export function serializeSensorData(sensor: SensorLike) {
  return {
    id: sensor.id,
    gardenId: sensor.gardenId,
    temperature: sensor.temperature.toNumber(),
    humidity: sensor.humidity.toNumber(),
    recordedAt: sensor.recordedAt,
  };
}
