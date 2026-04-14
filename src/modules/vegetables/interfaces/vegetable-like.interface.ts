import type { Prisma } from '@prisma/client';

export interface VegetableLike {
  id: number;
  name: string;
  quantityIn: Prisma.Decimal;
  quantityOut: Prisma.Decimal;
  price: Prisma.Decimal | null;
  gardenId: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}
