import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { getPeriodRange } from '../../common/utils/period-range.util';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { WsGateway } from '../websocket/ws.gateway';
import { QuerySensorsDto } from './dto/query-sensors.dto';
import { serializeSensorData } from './utils/sensor.serializer';

type IngestSensorInput = {
  gardenId: number;
  temperature: number;
  humidity: number;
  recordedAt?: Date;
};

@Injectable()
export class SensorsService {
  private readonly logger = new Logger(SensorsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly wsGateway: WsGateway,
    private readonly notificationsService: NotificationsService,
  ) {}

  async ingestFromMqtt(data: IngestSensorInput) {
    const garden = await this.prisma.garden.findFirst({
      where: {
        id: data.gardenId,
        deletedAt: null,
      },
      select: {
        id: true,
        temperatureThreshold: true,
        humidityThreshold: true,
      },
    });

    if (!garden) {
      throw new NotFoundException('Garden not found or deleted');
    }

    const created = await this.prisma.sensorData.create({
      data: {
        gardenId: data.gardenId,
        temperature: new Prisma.Decimal(data.temperature),
        humidity: new Prisma.Decimal(data.humidity),
        ...(data.recordedAt ? { recordedAt: data.recordedAt } : {}),
      },
    });

    const serialized = serializeSensorData(created);
    this.wsGateway.emitSensorData(serialized);

    try {
      await this.notificationsService.evaluateSensorThresholds({
        gardenId: data.gardenId,
        temperature: data.temperature,
        humidity: data.humidity,
        temperatureThreshold: garden.temperatureThreshold,
        humidityThreshold: garden.humidityThreshold,
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Unknown notification evaluation error';
      this.logger.warn(
        `Failed to evaluate notification thresholds for garden=${data.gardenId}: ${message}`,
      );
    }

    return serialized;
  }

  async findByGardenAndPeriod(query: QuerySensorsDto) {
    const range = getPeriodRange(query.period, query.date);

    const rows = await this.prisma.sensorData.findMany({
      where: {
        gardenId: query.gardenId,
        recordedAt: {
          gte: range.start,
          lt: range.end,
        },
        garden: {
          deletedAt: null,
        },
      },
      orderBy: {
        recordedAt: 'asc',
      },
    });

    return rows.map(serializeSensorData);
  }
}
