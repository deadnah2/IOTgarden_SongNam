export const MQTT_TOPICS = {
  SENSOR_SUBSCRIBE: 'garden/+/sensor',
  ledControlTopic(gardenId: number) {
    return `garden/${gardenId}/led/control`;
  },
} as const;
