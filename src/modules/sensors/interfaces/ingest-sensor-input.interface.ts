export interface IngestSensorInput {
  gardenId: number;
  temperature: number;
  humidity: number;
  recordedAt?: Date;
}
