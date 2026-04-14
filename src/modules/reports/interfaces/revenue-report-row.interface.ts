export interface RevenueReportRow {
  periodStart: Date;
  salesCount: bigint;
  totalQuantity: string | null;
  totalRevenue: string | null;
}
