import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, Role } from '@prisma/client';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
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

  async findAll(gardenId: number, user: AuthenticatedUser) {
    const vegetables = await this.prisma.vegetable.findMany({
      where: {
        deletedAt: null,
        gardenId,
        garden: {
          deletedAt: null,
          ...(user.role === Role.ADMIN ? {} : { userId: user.id }),
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
      throw new NotFoundException('Vegetable không tồn tại hoặc đã bị xóa');
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
    const data = Object.fromEntries(
      Object.entries(dto).filter(([_, v]) => v !== undefined)
    );

    if (Object.keys(data).length === 0) {
      throw new BadRequestException('Cần ít nhất một trường để cập nhật');
    }
    
    if (
      dto.quantityIn !== undefined &&
      dto.quantityIn < existingVegetable.quantityOut.toNumber()
    ) {
      throw new BadRequestException(
        'quantityIn không được nhỏ hơn quantityOut hiện tại',
      );
    }

    try {
      const vegetable = await this.prisma.vegetable.update({
        where: { id },
        data: {
          ...(dto.name !== undefined ? { name: dto.name } : {}),
          ...(dto.quantityIn !== undefined ? { quantityIn: dto.quantityIn } : {}),
        },
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
      throw new ConflictException('Tên vegetable đã tồn tại trong garden này');
    }

    throw error;
  }
}
