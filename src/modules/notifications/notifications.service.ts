import { Injectable, Logger } from '@nestjs/common';
import { NotificationType, Prisma } from '@prisma/client';
import { RedisService } from '../../common/cache/redis.service';
import { PrismaService } from '../../prisma/prisma.service';
import { WsGateway } from '../websocket/ws.gateway';
import { QueryNotificationsDto } from './dto/query-notifications.dto';
import type { EvaluateSensorThresholdsInput } from './interfaces/evaluate-sensor-thresholds-input.interface';
import type { ThresholdNotificationInput } from './interfaces/threshold-notification-input.interface';
import { serializeNotification } from './utils/notification.serializer';

@Injectable()
export class NotificationsService {
  private static readonly COOLDOWN_SECONDS = 10 * 60;
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly wsGateway: WsGateway,
    private readonly redisService: RedisService,
  ) {}

  async evaluateSensorThresholds(input: EvaluateSensorThresholdsInput) {
    const createdNotifications = await Promise.all([
      this.createThresholdNotificationIfNeeded({
        gardenId: input.gardenId,
        type: NotificationType.HIGH_TEMPERATURE,
        currentValue: input.temperature,
        threshold: input.temperatureThreshold,
        temperature: input.temperature,
        humidity: input.humidity,
        message: 'Temperature exceeds the configured threshold',
      }),
      this.createThresholdNotificationIfNeeded({
        gardenId: input.gardenId,
        type: NotificationType.HIGH_HUMIDITY,
        currentValue: input.humidity,
        threshold: input.humidityThreshold,
        temperature: input.temperature,
        humidity: input.humidity,
        message: 'Humidity exceeds the configured threshold',
      }),
    ]);

    return createdNotifications.filter((item) => item !== null);
  }

  async findByGarden(query: QueryNotificationsDto) {
    const rows = await this.prisma.notification.findMany({
      where: {
        gardenId: query.gardenId,
        garden: {
          deletedAt: null,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return rows.map(serializeNotification);
  }

  private async createThresholdNotificationIfNeeded(
    input: ThresholdNotificationInput,
  ) {
    if (!input.threshold) {
      return null;
    }

    const thresholdValue = input.threshold.toNumber();

    if (input.currentValue <= thresholdValue) {
      return null;
    }

    const cooldownKey = this.getCooldownKey(input.gardenId, input.type);
    const canCreateNotification = await this.redisService.setIfNotExistsWithTtl(
      cooldownKey,
      '1',
      NotificationsService.COOLDOWN_SECONDS,
    );

    if (!canCreateNotification) {
      this.logger.debug(
        `Skip notification for garden=${input.gardenId}, type=${input.type} because cooldown is active`,
      );
      return null;
    }

    try {
      const created = await this.prisma.notification.create({
        data: {
          gardenId: input.gardenId,
          type: input.type,
          message: input.message,
          temperature: new Prisma.Decimal(input.temperature),
          humidity: new Prisma.Decimal(input.humidity),
          thresholdValue: new Prisma.Decimal(thresholdValue),
        },
      });

      const serialized = serializeNotification(created);
      this.wsGateway.emitNotificationCreated(serialized);

      return serialized;
    } catch (error) {
      await this.redisService.delete(cooldownKey);
      throw error;
    }
  }

  private getCooldownKey(gardenId: number, type: NotificationType) {
    return `garden-sn:notification-cooldown:${gardenId}:${type}`;
  }
}
