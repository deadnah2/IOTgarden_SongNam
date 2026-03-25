import { Prisma } from '@prisma/client';

type SaleLike = {
  id: number;
  vegetableId: number;
  gardenId: number;
  quantity: Prisma.Decimal;
  unitPrice: Prisma.Decimal;
  totalPrice: Prisma.Decimal;
  soldAt: Date;
};

export function serializeSale(sale: SaleLike) {
  return {
    ...sale,
    quantity: sale.quantity.toNumber(),
    unitPrice: sale.unitPrice.toNumber(),
    totalPrice: sale.totalPrice.toNumber(),
  };
}
