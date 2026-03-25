type NullableNumeric = string | number | bigint | null;

function toNumber(value: NullableNumeric) {
  if (value === null) {
    return null;
  }

  return Number(value);
}

export function serializePriceHistoryRow(row: {
  id: number;
  vegetableId: number;
  action: string;
  price: { toNumber(): number } | null;
  createdAt: Date;
  vegetable: {
    name: string;
  };
}) {
  return {
    id: row.id,
    vegetableId: row.vegetableId,
    vegetableName: row.vegetable.name,
    action: row.action,
    price: row.price?.toNumber() ?? null,
    createdAt: row.createdAt,
  };
}

export function serializeRevenueReportRow(row: {
  periodStart: Date;
  salesCount: bigint;
  totalQuantity: string | null;
  totalRevenue: string | null;
}) {
  return {
    periodStart: row.periodStart,
    salesCount: Number(row.salesCount),
    totalQuantity: toNumber(row.totalQuantity) ?? 0,
    totalRevenue: toNumber(row.totalRevenue) ?? 0,
  };
}
