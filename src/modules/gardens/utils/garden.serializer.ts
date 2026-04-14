import type { GardenLike } from '../interfaces/garden-like.interface';

export function serializeGarden(garden: GardenLike) {
  return {
    ...garden,
    temperatureThreshold: garden.temperatureThreshold?.toNumber() ?? null,
    humidityThreshold: garden.humidityThreshold?.toNumber() ?? null,
  };
}

export function serializeGardenThresholds(garden: Pick<
  GardenLike,
  'id' | 'temperatureThreshold' | 'humidityThreshold'
>) {
  return {
    gardenId: garden.id,
    temperatureThreshold: garden.temperatureThreshold?.toNumber() ?? null,
    humidityThreshold: garden.humidityThreshold?.toNumber() ?? null,
  };
}
