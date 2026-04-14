import type { SaleLike } from '../interfaces/sale-like.interface';

export function serializeSale(sale: SaleLike) {
  return {
    ...sale,
    quantity: sale.quantity.toNumber(),
    unitPrice: sale.unitPrice.toNumber(),
    totalPrice: sale.totalPrice.toNumber(),
  };
}
