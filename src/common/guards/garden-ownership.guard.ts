import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  OWNERSHIP_KEY,
  type OwnershipConfig,
} from '../decorators/ownership.decorator';
import type { AuthenticatedUser } from '../interfaces/authenticated-user.interface';

@Injectable()
export class GardenOwnershipGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const config = this.reflector.getAllAndOverride<OwnershipConfig>(
      OWNERSHIP_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!config) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user as AuthenticatedUser | undefined;

    if (!user) {
      throw new UnauthorizedException('Chưa xác thực người dùng');
    }

    const requestSource =
      config.source === 'param' ? request.params : request[config.source];
    const rawValue = requestSource?.[config.key];
    const id = Number(rawValue);

    if (rawValue === undefined || rawValue === null || rawValue === '') {
      throw new BadRequestException(
        `Thiếu ${config.key} để kiểm tra quyền truy cập`,
      );
    }

    if (Number.isNaN(id) || id <= 0) {
      throw new BadRequestException(`${config.key} phải là số nguyên dương`);
    }

    if (config.resource === 'garden') {
      await this.assertGardenAccess(id, user);
      return true;
    }

    await this.assertVegetableAccess(id, user);
    return true;
  }

  private async assertGardenAccess(
    gardenId: number,
    user: AuthenticatedUser,
  ): Promise<void> {
    const garden = await this.prisma.garden.findFirst({
      where: {
        id: gardenId,
        deletedAt: null,
      },
      select: {
        id: true,
        userId: true,
      },
    });

    if (!garden) {
      throw new NotFoundException('Garden không tồn tại hoặc đã bị xóa');
    }

    if (user.role !== Role.ADMIN && garden.userId !== user.id) {
      throw new ForbiddenException('Bạn không có quyền truy cập garden này');
    }
  }

  private async assertVegetableAccess(
    vegetableId: number,
    user: AuthenticatedUser,
  ): Promise<void> {
    const vegetable = await this.prisma.vegetable.findFirst({
      where: {
        id: vegetableId,
        deletedAt: null,
      },
      select: {
        id: true,
        garden: {
          select: {
            id: true,
            userId: true,
            deletedAt: true,
          },
        },
      },
    });

    if (!vegetable || vegetable.garden.deletedAt) {
      throw new NotFoundException('Vegetable không tồn tại hoặc đã bị xóa');
    }

    if (user.role !== Role.ADMIN && vegetable.garden.userId !== user.id) {
      throw new ForbiddenException('Bạn không có quyền truy cập vegetable này');
    }
  }
}
