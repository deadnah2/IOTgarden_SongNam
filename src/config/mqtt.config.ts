import { registerAs } from '@nestjs/config';

export default registerAs('mqtt', () => ({
  brokerUrl: process.env.MQTT_BROKER_URL ?? 'mqtt://localhost:1883',
  username: process.env.MQTT_USERNAME ?? '',
  password: process.env.MQTT_PASSWORD ?? '',
}));
