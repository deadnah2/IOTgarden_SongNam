import { Injectable, Logger } from '@nestjs/common';
import { NotificationType, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { WsGateway } from '../websocket/ws.gateway';
import { QueryNotificationsDto } from './dto/query-notifications.dto';
import { serializeNotification } from './utils/notification.serializer';

type EvaluateSensorThresholdsInput = {
  gardenId: number;
  temperature: number;
  humidity: number;
  temperatureThreshold: Prisma.Decimal | null;
  humidityThreshold: Prisma.Decimal | null;
};

@Injectable()
export class NotificationsService {
  private static readonly COOLDOWN_MS = 10 * 60 * 1000;
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly wsGateway: WsGateway,
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

  private async createThresholdNotificationIfNeeded(input: {
    gardenId: number;
    type: NotificationType;
    currentValue: number;
    threshold: Prisma.Decimal | null;
    temperature: number;
    humidity: number;
    message: string;
  }) {
    if (!input.threshold) {
      return null;
    }

    const thresholdValue = input.threshold.toNumber();

    if (input.currentValue <= thresholdValue) {
      return null;
    }

    const latest = await this.prisma.notification.findFirst({
      where: {
        gardenId: input.gardenId,
        type: input.type,
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        createdAt: true,
      },
    });

    if (
      latest &&
      Date.now() - latest.createdAt.getTime() < NotificationsService.COOLDOWN_MS
    ) {
      this.logger.debug(
        `Skip notification for garden=${input.gardenId}, type=${input.type} because cooldown is active`,
      );
      return null;
    }

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
  }
}
