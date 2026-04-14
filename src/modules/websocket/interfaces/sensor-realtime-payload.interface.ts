export interface SensorRealtimePayload {
  id: number;
  gardenId: number;
  temperature: number;
  humidity: number;
  recordedAt: Date;
}
