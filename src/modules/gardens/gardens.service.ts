import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { MqttService } from '../mqtt/mqtt.service';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateGardenDto } from './dto/create-garden.dto';
import { UpdateGardenDto } from './dto/update-garden.dto';
import { UpdateLedDto } from './dto/update-led.dto';

@Injectable()
export class GardensService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mqttService: MqttService,
  ) {}

  async create(dto: CreateGardenDto, user: AuthenticatedUser) {
    return this.prisma.garden.create({
      data: {
        name: dto.name,
        userId: user.id,
      },
    });
  }

  async findAll(user: AuthenticatedUser) {
    return this.prisma.garden.findMany({
      where: {
        deletedAt: null,
        ...(user.role === Role.ADMIN ? {} : { userId: user.id }),
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
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

    return garden;
  }

  async update(id: number, dto: UpdateGardenDto) {
    await this.findOne(id);

    // if (dto.name === undefined) {
    //   throw new BadRequestException('Cần ít nhất một trường để cập nhật garden');
    // }

    const data = Object.fromEntries(
      Object.entries(dto).filter(([_, v]) => v !== undefined)
    );

    if (Object.keys(data).length === 0) {
      throw new BadRequestException('Need at least one field to update garden');
    }

    return this.prisma.garden.update({ where: { id }, data });
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

      return tx.garden.update({
        where: { id },
        data: {
          deletedAt,
        },
      });
    });
  }

  async updateLedStates(
    id: number,
    dto: UpdateLedDto,
    user: AuthenticatedUser,
  ) {
    await this.findOne(id);

    const data = Object.fromEntries(
      Object.entries(dto).filter(([_, value]) => value !== undefined),
    );

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

    return this.prisma.garden.update({
      where: { id },
      data: {
        ledSyncedAt: new Date(),
      },
    });
  }
}
