export interface NotificationRealtimePayload {
  id: number;
  gardenId: number;
  type: 'HIGH_TEMPERATURE' | 'HIGH_HUMIDITY';
  message: string;
  temperature: number | null;
  humidity: number | null;
  thresholdValue: number | null;
  createdAt: Date;
}
