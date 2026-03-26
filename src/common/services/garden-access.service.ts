import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type { AuthenticatedUser } from '../interfaces/authenticated-user.interface';

@Injectable()
export class GardenAccessService {
  constructor(private readonly prisma: PrismaService) {}

  async assertGardenAccess(
    gardenId: number,
    user: Pick<AuthenticatedUser, 'id' | 'role'>,
  ) {
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

    return garden;
  }
}
