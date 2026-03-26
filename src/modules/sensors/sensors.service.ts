import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { getPeriodRange } from '../../common/utils/period-range.util';
import { PrismaService } from '../../prisma/prisma.service';
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
  constructor(
    private readonly prisma: PrismaService,
    private readonly wsGateway: WsGateway,
  ) {}

  async ingestFromMqtt(data: IngestSensorInput) {
    const garden = await this.prisma.garden.findFirst({
      where: {
        id: data.gardenId,
        deletedAt: null,
      },
      select: {
        id: true,
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

    return serialized;
  }

  async findByGardenAndPeriod(query: QuerySensorsDto) {
    const range = getPeriodRange(query.period);

    const rows = await this.prisma.sensorData.findMany({
      where: {
        gardenId: query.gardenId,
        recordedAt: {
          gte: range.start,
          lte: range.end,
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
