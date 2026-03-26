import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import mqtt, { MqttClient } from 'mqtt';
import { SensorsService } from '../sensors/sensors.service';
import { MQTT_TOPICS } from './mqtt.constants';
import { SensorPayloadParserHelper } from './helpers/sensor-payload-parser.helper';

type PublishLedCommandInput = {
  gardenId: number;
  userId: number;
  led1State: 'On' | 'Off';
  led2State: 'On' | 'Off';
  led3State: 'On' | 'Off';
};

@Injectable()
export class MqttService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MqttService.name);
  private client: MqttClient | null = null;

  constructor(
    private readonly configService: ConfigService,
    private readonly sensorsService: SensorsService,
    private readonly sensorPayloadParserHelper: SensorPayloadParserHelper,
  ) {}

  onModuleInit() {
    const brokerUrl = this.configService.getOrThrow<string>('mqtt.brokerUrl');
    const username = this.configService.get<string>('mqtt.username');
    const password = this.configService.get<string>('mqtt.password');
    const clientId = this.configService.get<string>('mqtt.clientId');

    this.client = mqtt.connect(brokerUrl, {
      username,
      password,
      clientId,
      reconnectPeriod: 3000,
    });

    this.client.on('connect', () => {
      this.logger.log(`Connected to MQTT broker: ${brokerUrl}`);
      this.subscribeToSensorTopic();
    });

    this.client.on('reconnect', () => {
      this.logger.warn('Reconnecting to MQTT broker...');
    });

    this.client.on('error', (error) => {
      this.logger.error(`MQTT error: ${error.message}`);
    });

    this.client.on('message', (topic, payload) => {
      void this.handleIncomingMessage(topic, payload);
    });
  }

  onModuleDestroy() {
    if (!this.client) {
      return;
    }

    this.client.end(true);
    this.client = null;
  }

  async publishLedCommand(command: PublishLedCommandInput) {
    if (!this.client || !this.client.connected) {
      throw new Error('MQTT client is not connected');
    }

    const topic = MQTT_TOPICS.ledControlTopic(command.gardenId);
    const payload = JSON.stringify(command);

    await new Promise<void>((resolve, reject) => {
      this.client?.publish(topic, payload, { qos: 1 }, (error) => {
        if (error) {
          reject(error);
          return;
        }

        resolve();
      });
    });
  }

  private subscribeToSensorTopic() {
    if (!this.client) {
      return;
    }

    this.client.subscribe(MQTT_TOPICS.SENSOR_SUBSCRIBE, { qos: 1 }, (error) => {
      if (error) {
        this.logger.error(`Failed to subscribe sensor topic: ${error.message}`);
        return;
      }

      this.logger.log(`Subscribed to topic: ${MQTT_TOPICS.SENSOR_SUBSCRIBE}`);
    });
  }

  private async handleIncomingMessage(topic: string, payload: Buffer) {
    const gardenId = this.extractGardenIdFromTopic(topic);

    if (gardenId === null) {
      this.logger.warn(`Ignore unsupported topic: ${topic}`);
      return;
    }

    const parseResult = this.sensorPayloadParserHelper.parse(payload);

    if (!parseResult.ok) {
      this.logger.warn(
        `Invalid MQTT payload from topic ${topic}. Error: ${parseResult.error}`,
      );
      return;
    }

    try {
      await this.sensorsService.ingestFromMqtt({
        gardenId,
        temperature: parseResult.data.temperature,
        humidity: parseResult.data.humidity,
        ...(parseResult.data.recordedAt
          ? { recordedAt: new Date(parseResult.data.recordedAt) }
          : {}),
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown sensor ingest error';
      this.logger.warn(`Failed to ingest MQTT sensor data: ${message}`);
    }
  }

  private extractGardenIdFromTopic(topic: string) {
    const match = /^garden\/(\d+)\/sensor$/.exec(topic);

    if (!match) {
      return null;
    }

    return Number(match[1]);
  }
}
