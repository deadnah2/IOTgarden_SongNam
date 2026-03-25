import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CheckOwnership } from '../../common/decorators/ownership.decorator';
import { GardenOwnershipGuard } from '../../common/guards/garden-ownership.guard';
import { CreateSaleDto } from './dto/create-sale.dto';
import { SalesService } from './sales.service';

@ApiTags('Sales')
@ApiBearerAuth()
@Controller('sales')
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @UseGuards(GardenOwnershipGuard)
  @CheckOwnership({
    resource: 'garden',
    source: 'body',
    key: 'gardenId',
  })
  @Post()
  @ApiOperation({ summary: 'Create a sale' })
  create(@Body() dto: CreateSaleDto) {
    return this.salesService.create(dto);
  }
}
