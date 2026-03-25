import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CheckOwnership } from '../../common/decorators/ownership.decorator';
import { GardenOwnershipGuard } from '../../common/guards/garden-ownership.guard';
import { PriceReportQueryDto } from './dto/price-report-query.dto';
import { RevenueReportQueryDto } from './dto/revenue-report-query.dto';
import { ReportsService } from './reports.service';

@ApiTags('Reports')
@ApiBearerAuth()
@Controller()
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @UseGuards(GardenOwnershipGuard)
  @CheckOwnership({
    resource: 'garden',
    source: 'query',
    key: 'gardenId',
  })
  @Get('price')
  @ApiOperation({ summary: 'Get price history list by period' })
  getPriceReport(@Query() query: PriceReportQueryDto) {
    return this.reportsService.getPriceReport(query);
  }

  @UseGuards(GardenOwnershipGuard)
  @CheckOwnership({
    resource: 'garden',
    source: 'query',
    key: 'gardenId',
  })
  @Get('all/price')
  @ApiOperation({ summary: 'Get revenue report by period' })
  getRevenueReport(@Query() query: RevenueReportQueryDto) {
    return this.reportsService.getRevenueReport(query);
  }
}
