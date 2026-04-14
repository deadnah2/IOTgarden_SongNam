import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { getPeriodRange } from '../../common/utils/period-range.util';
import { PrismaService } from '../../prisma/prisma.service';
import { PriceReportQueryDto } from './dto/price-report-query.dto';
import { RevenueReportQueryDto } from './dto/revenue-report-query.dto';
import type { RevenueReportRow } from './interfaces/revenue-report-row.interface';
import {
  serializePriceHistoryRow,
  serializeRevenueReportRow,
} from './utils/report.serializer';

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

    const range = getPeriodRange(query.period, query.date);

    const rows = await this.prisma.priceHistory.findMany({
      where: {
        createdAt: {
          gte: range.start,
          lt: range.end,
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
    const range = getPeriodRange(query.period, query.date);

    const rows = await this.prisma.$queryRaw<RevenueReportRow[]>(Prisma.sql`
      SELECT
        date_trunc(${query.period}, s."soldAt") AS "periodStart",
        COUNT(*)::bigint AS "salesCount",
        SUM(s."quantity")::text AS "totalQuantity",
        SUM(s."totalPrice")::text AS "totalRevenue"
      FROM "Sale" s
      WHERE s."gardenId" = ${query.gardenId}
        AND s."soldAt" >= ${range.start}
        AND s."soldAt" < ${range.end}
      GROUP BY 1
      ORDER BY 1 ASC
    `);

    const data = rows.map(serializeRevenueReportRow);

    return {
      total: data.reduce((sum, row) => sum + row.totalRevenue, 0),
      data,
    };
  }
}
