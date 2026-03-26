import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { PriceAction } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { SetPriceDto } from './dto/set-price.dto';
import { serializePrice, serializeVegetable } from './utils/vegetable.serializer';
import { VegetablesService } from './vegetables.service';

@Injectable()
export class PriceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly vegetablesService: VegetablesService,
  ) {}

  async createPrice(vegetableId: number, dto: SetPriceDto) {
    const vegetable = await this.vegetablesService.findOne(vegetableId);

    if (vegetable.price !== null) {
      throw new ConflictException(
        'Vegetable already has a price, use the update endpoint instead',
      );
    }

    const updatedVegetable = await this.prisma.$transaction(async (tx) => {
      await tx.priceHistory.create({
        data: {
          vegetableId,
          action: PriceAction.SET,
          price: dto.price,
        },
      });

      return tx.vegetable.update({
        where: { id: vegetableId },
        data: {
          price: dto.price,
        },
      });
    });

    return serializeVegetable(updatedVegetable);
  }

  async updatePrice(vegetableId: number, dto: SetPriceDto) {
    const vegetable = await this.vegetablesService.findOne(vegetableId);

    if (vegetable.price === null) {
      throw new BadRequestException('Vegetable does not have a price to update');
    }

    const updatedVegetable = await this.prisma.$transaction(async (tx) => {
      await tx.priceHistory.create({
        data: {
          vegetableId,
          action: PriceAction.UPDATE,
          price: dto.price,
        },
      });

      return tx.vegetable.update({
        where: { id: vegetableId },
        data: {
          price: dto.price,
        },
      });
    });

    return serializeVegetable(updatedVegetable);
  }

  async deletePrice(vegetableId: number) {
    const vegetable = await this.vegetablesService.findOne(vegetableId);

    if (vegetable.price === null) {
      throw new BadRequestException('Vegetable does not have a price to delete');
    }

    const updatedVegetable = await this.prisma.$transaction(async (tx) => {
      await tx.priceHistory.create({
        data: {
          vegetableId,
          action: PriceAction.DELETE,
          price: null,
        },
      });

      return tx.vegetable.update({
        where: { id: vegetableId },
        data: {
          price: null,
        },
      });
    });

    return serializeVegetable(updatedVegetable);
  }

  async getPrice(vegetableId: number) {
    const vegetable = await this.vegetablesService.findOne(vegetableId);

    return {
      vegetableId: vegetable.id,
      name: vegetable.name,
      price: serializePrice(vegetable.price),
      updatedAt: vegetable.updatedAt,
    };
  }
}
