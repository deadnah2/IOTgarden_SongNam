import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateSaleDto } from './dto/create-sale.dto';
import { serializeSale } from './utils/sale.serializer';

@Injectable()
export class SalesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateSaleDto) {
    const quantity = new Prisma.Decimal(dto.quantity);

    const sale = await this.prisma.$transaction(async (tx) => {
      const garden = await tx.garden.findFirst({
        where: {
          id: dto.gardenId,
          deletedAt: null,
        },
        select: {
          id: true,
        },
      });

      if (!garden) {
        throw new NotFoundException('Garden not found or deleted');
      }

      const vegetable = await tx.vegetable.findFirst({
        where: {
          id: dto.vegetableId,
          deletedAt: null,
          garden: {
            deletedAt: null,
          },
        },
        select: {
          id: true,
          gardenId: true,
          quantityIn: true,
          quantityOut: true,
          price: true,
        },
      });

      if (!vegetable) {
        throw new NotFoundException('Vegetable not found or deleted');
      }

      if (vegetable.gardenId !== dto.gardenId) {
        throw new BadRequestException(
          'Vegetable does not belong to the provided garden',
        );
      }

      if (vegetable.price === null) {
        throw new BadRequestException('Vegetable has no current price');
      }

      const availableQuantity = vegetable.quantityIn.minus(vegetable.quantityOut);

      if (quantity.gt(availableQuantity)) {
        throw new BadRequestException('Not enough stock to create sale');
      }

      const saleToCreate = {
        gardenId: dto.gardenId,
        vegetableId: dto.vegetableId,
        quantity,
        unitPrice: vegetable.price,
        totalPrice: quantity.mul(vegetable.price),
      };

      const createdSale = await tx.sale.create({
        data: saleToCreate,
      });

      await tx.vegetable.update({
        where: {
          id: dto.vegetableId,
        },
        data: {
          quantityOut: {
            increment: quantity,
          },
        },
      });

      return createdSale;
    });

    return serializeSale(sale);
  }
}
