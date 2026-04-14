import { Prisma } from '@prisma/client';
import type { VegetableLike } from '../interfaces/vegetable-like.interface';

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

