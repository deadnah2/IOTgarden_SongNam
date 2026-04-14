import type { NullableNumeric } from '../interfaces/nullable-numeric.type';
import type { PriceHistoryReportRow } from '../interfaces/price-history-report-row.interface';
import type { RevenueReportRow } from '../interfaces/revenue-report-row.interface';

function toNumber(value: NullableNumeric) {
  if (value === null) {
    return null;
  }

  return Number(value);
}

export function serializePriceHistoryRow(row: PriceHistoryReportRow) {
  return {
    id: row.id,
    vegetableId: row.vegetableId,
    vegetableName: row.vegetable.name,
    action: row.action,
    price: row.price?.toNumber() ?? null,
    createdAt: row.createdAt,
  };
}

export function serializeRevenueReportRow(row: RevenueReportRow) {
  return {
    periodStart: row.periodStart,
    salesCount: Number(row.salesCount),
    totalQuantity: toNumber(row.totalQuantity) ?? 0,
    totalRevenue: toNumber(row.totalRevenue) ?? 0,
  };
}
