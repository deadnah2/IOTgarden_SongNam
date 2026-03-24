import { Prisma } from '@prisma/client';

type VegetableLike = {
  id: number;
  name: string;
  quantityIn: Prisma.Decimal;
  quantityOut: Prisma.Decimal;
  price: Prisma.Decimal | null;
  gardenId: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
};

export function serializeVegetable(vegetable: VegetableLike) {
  return {
    ...vegetable,
    quantityIn: vegetable.quantityIn.toNumber(),
    quantityOut: vegetable.quantityOut.toNumber(),
    price: vegetable.price?.toNumber() ?? null,
  };
}

export function serializePrice(price: Prisma.Decimal | null) {
  return price?.toNumber() ?? null;
}

