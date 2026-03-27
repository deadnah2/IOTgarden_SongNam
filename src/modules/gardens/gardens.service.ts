import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { Prisma, Role } from '@prisma/client';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { pickDefinedFields } from '../../common/utils/pick-defined-fields.util';
import { MqttService } from '../mqtt/mqtt.service';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateGardenDto } from './dto/create-garden.dto';
import { UpdateGardenDto } from './dto/update-garden.dto';
import { UpdateLedDto } from './dto/update-led.dto';
import { UpdateThresholdsDto } from './dto/update-thresholds.dto';
import {
  serializeGarden,
  serializeGardenThresholds,
} from './utils/garden.serializer';

@Injectable()
export class GardensService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mqttService: MqttService,
  ) {}

  async create(dto: CreateGardenDto, user: AuthenticatedUser) {
    const garden = await this.prisma.garden.create({
      data: {
        name: dto.name,
        userId: user.id,
      },
    });

    return serializeGarden(garden);
  }

  async findAll(user: AuthenticatedUser) {
    const gardens = await this.prisma.garden.findMany({
      where: {
        deletedAt: null,
        ...(user.role === Role.ADMIN ? {} : { userId: user.id }),
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return gardens.map(serializeGarden);
  }

  async findOne(id: number) {
    const garden = await this.prisma.garden.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    });

    if (!garden) {
      throw new NotFoundException('Garden does not exist or has been deleted');
    }

    return serializeGarden(garden);
  }

  async update(id: number, dto: UpdateGardenDto) {
    await this.findOne(id);

    // if (dto.name === undefined) {
    //   throw new BadRequestException('Cần ít nhất một trường để cập nhật garden');
    // }

    const data = pickDefinedFields(dto);

    if (Object.keys(data).length === 0) {
      throw new BadRequestException('Need at least one field to update garden');
    }

    const garden = await this.prisma.garden.update({ where: { id }, data });

    return serializeGarden(garden);
  }

  async softDelete(id: number) {
    await this.findOne(id);

    const deletedAt = new Date();

    return this.prisma.$transaction(async (tx) => {
      await tx.vegetable.updateMany({
        where: {
          gardenId: id,
          deletedAt: null,
        },
        data: {
          deletedAt,
        },
      });

      const garden = await tx.garden.update({
        where: { id },
        data: {
          deletedAt,
        },
      });

      return serializeGarden(garden);
    });
  }

  async findThresholds(id: number) {
    const garden = await this.prisma.garden.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      select: {
        id: true,
        temperatureThreshold: true,
        humidityThreshold: true,
      },
    });

    if (!garden) {
      throw new NotFoundException('Garden does not exist or has been deleted');
    }

    return serializeGardenThresholds(garden);
  }

  async updateThresholds(id: number, dto: UpdateThresholdsDto) {
    await this.findThresholds(id);

    const hasTemperatureThreshold = dto.temperatureThreshold !== undefined;
    const hasHumidityThreshold = dto.humidityThreshold !== undefined;

    if (!hasTemperatureThreshold && !hasHumidityThreshold) {
      throw new BadRequestException(
        'At least one threshold field must be provided',
      );
    }

    const data: Prisma.GardenUpdateInput = {
      ...(hasTemperatureThreshold
        ? {
            temperatureThreshold: new Prisma.Decimal(dto.temperatureThreshold!),
          }
        : {}),
      ...(hasHumidityThreshold
        ? {
            humidityThreshold: new Prisma.Decimal(dto.humidityThreshold!),
          }
        : {}),
    };

    const garden = await this.prisma.garden.update({
      where: { id },
      data,
      select: {
        id: true,
        temperatureThreshold: true,
        humidityThreshold: true,
      },
    });

    return serializeGardenThresholds(garden);
  }

  async updateLedStates(
    id: number,
    dto: UpdateLedDto,
    user: AuthenticatedUser,
  ) {
    await this.findOne(id);

    const data = pickDefinedFields(dto);

    if (Object.keys(data).length === 0) {
      throw new BadRequestException(
        'At least one LED state must be provided',
      );
    }

    const updatedGarden = await this.prisma.garden.update({
      where: { id },
      data,
    });

    try {
      await this.mqttService.publishLedCommand({
        gardenId: updatedGarden.id,
        userId: user.id,
        led1State: updatedGarden.led1State,
        led2State: updatedGarden.led2State,
        led3State: updatedGarden.led3State,
      });
    } catch {
      throw new ServiceUnavailableException(
        'Failed to publish LED command to MQTT broker',
      );
    }

    const garden = await this.prisma.garden.update({
      where: { id },
      data: {
        ledSyncedAt: new Date(),
      },
    });

    return serializeGarden(garden);
  }
}
