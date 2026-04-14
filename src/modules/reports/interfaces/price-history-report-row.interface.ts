export interface PriceHistoryReportRow {
  id: number;
  vegetableId: number;
  action: string;
  price: { toNumber(): number } | null;
  createdAt: Date;
  vegetable: {
    name: string;
  };
}
