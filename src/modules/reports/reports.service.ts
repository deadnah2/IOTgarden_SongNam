import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { PriceReportQueryDto } from './dto/price-report-query.dto';
import { RevenueReportQueryDto } from './dto/revenue-report-query.dto';
import {
  serializePriceHistoryRow,
  serializeRevenueReportRow,
} from './utils/report.serializer';

type RevenueReportRow = {
  periodStart: Date;
  salesCount: bigint;
  totalQuantity: string | null;
  totalRevenue: string | null;
};

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async getPriceReport(query: PriceReportQueryDto) {
    if (query.vegetableId !== undefined) {
      const vegetable = await this.prisma.vegetable.findFirst({
        where: {
          id: query.vegetableId,
          gardenId: query.gardenId,
          deletedAt: null,
        },
        select: {
          id: true,
        },
      });

      if (!vegetable) {
        throw new BadRequestException(
          'Vegetable does not belong to the provided garden',
        );
      }
    }

    const range = this.getPeriodRange(query.period);

    const rows = await this.prisma.priceHistory.findMany({
      where: {
        createdAt: {
          gte: range.start,
          lte: range.end,
        },
        vegetable: {
          gardenId: query.gardenId,
          deletedAt: null,
        },
        ...(query.vegetableId !== undefined
          ? { vegetableId: query.vegetableId }
          : {}),
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        vegetableId: true,
        action: true,
        price: true,
        createdAt: true,
        vegetable: {
          select: {
            name: true,
          },
        },
      },
    });

    return rows.map(serializePriceHistoryRow);
  }

  async getRevenueReport(query: RevenueReportQueryDto) {
    const rows = await this.prisma.$queryRaw<RevenueReportRow[]>(Prisma.sql`
      SELECT
        date_trunc(${query.period}, s."soldAt") AS "periodStart",
        COUNT(*)::bigint AS "salesCount",
        SUM(s."quantity")::text AS "totalQuantity",
        SUM(s."totalPrice")::text AS "totalRevenue"
      FROM "Sale" s
      WHERE s."gardenId" = ${query.gardenId}
      GROUP BY 1
      ORDER BY 1 ASC
    `);

    const data = rows.map(serializeRevenueReportRow);

    return {
      total: data.reduce((sum, row) => sum + row.totalRevenue, 0),
      data,
    };
  }

  private getPeriodRange(period: PriceReportQueryDto['period']) {
    const now = new Date();
    const start = new Date(now);
    const end = new Date(now);

    if (period === 'day') {
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      return { start, end };
    }

    if (period === 'week') {
      const day = start.getDay();
      const diff = day === 0 ? -6 : 1 - day;
      start.setDate(start.getDate() + diff);
      start.setHours(0, 0, 0, 0);

      end.setTime(start.getTime());
      end.setDate(end.getDate() + 6);
      end.setHours(23, 59, 59, 999);
      return { start, end };
    }

    start.setDate(1);
    start.setHours(0, 0, 0, 0);

    end.setMonth(end.getMonth() + 1, 0);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }
}
