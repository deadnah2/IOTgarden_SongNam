import type { Prisma } from '@prisma/client';

export interface SaleLike {
  id: number;
  vegetableId: number;
  gardenId: number;
  quantity: Prisma.Decimal;
  unitPrice: Prisma.Decimal;
  totalPrice: Prisma.Decimal;
  soldAt: Date;
}
