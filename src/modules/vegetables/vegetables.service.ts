import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { pickDefinedFields } from '../../common/utils/pick-defined-fields.util';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateVegetableDto } from './dto/create-vegetable.dto';
import { UpdateVegetableDto } from './dto/update-vegetable.dto';
import { serializeVegetable } from './utils/vegetable.serializer';

@Injectable()
export class VegetablesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateVegetableDto) {
    try {
      const vegetable = await this.prisma.vegetable.create({
        data: {
          name: dto.name,
          gardenId: dto.gardenId,
          quantityIn: dto.quantityIn,
        },
      });

      return serializeVegetable(vegetable);
    } catch (error) {
      this.handleUniqueConstraint(error);
    }
  }

  async findAll(gardenId: number) {
    const vegetables = await this.prisma.vegetable.findMany({
      where: {
        deletedAt: null,
        gardenId,
        garden: {
          deletedAt: null,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return vegetables.map(serializeVegetable);
  }

  async findOne(id: number) {
    const vegetable = await this.prisma.vegetable.findFirst({
      where: {
        id,
        deletedAt: null,
        garden: {
          deletedAt: null,
        },
      },
    });

    if (!vegetable) {
      throw new NotFoundException('Vegetable not found or deleted');
    }

    return vegetable;
  }

  async update(id: number, dto: UpdateVegetableDto) {
    const existingVegetable = await this.findOne(id);

    // if (dto.name === undefined && dto.quantityIn === undefined) {
    //   throw new BadRequestException(
    //     'Cần ít nhất một trường để cập nhật vegetable',
    //   );
    // }
    const data = pickDefinedFields(dto);

    if (Object.keys(data).length === 0) {
      throw new BadRequestException('Need at least one field to update vegetable');
    }

    if (
      dto.quantityIn !== undefined &&
      dto.quantityIn < existingVegetable.quantityOut.toNumber()
    ) {
      throw new BadRequestException(
        'quantityIn cannot be less than the current quantityOut',
      );
    }

    try {
      const vegetable = await this.prisma.vegetable.update({
        where: { id },
        data,
      });

      return serializeVegetable(vegetable);
    } catch (error) {
      this.handleUniqueConstraint(error);
    }
  }

  async softDelete(id: number) {
    await this.findOne(id);

    const vegetable = await this.prisma.vegetable.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });

    return serializeVegetable(vegetable);
  }

  private handleUniqueConstraint(error: unknown): never {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new ConflictException(
        'A vegetable with this name already exists in the garden',
      );
    }

    throw error;
  }
}
