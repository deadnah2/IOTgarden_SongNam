import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CheckOwnership } from '../../common/decorators/ownership.decorator';
import { GardenOwnershipGuard } from '../../common/guards/garden-ownership.guard';
import { QuerySensorsDto } from './dto/query-sensors.dto';
import { SensorsService } from './sensors.service';

@ApiTags('Sensors')
@ApiBearerAuth()
@Controller('sensors')
export class SensorsController {
  constructor(private readonly sensorsService: SensorsService) {}

  @UseGuards(GardenOwnershipGuard)
  @CheckOwnership({
    resource: 'garden',
    source: 'query',
    key: 'gardenId',
  })
  @Get()
  @ApiOperation({ summary: 'Get sensor data by garden and period' })
  findByGardenAndPeriod(@Query() query: QuerySensorsDto) {
    return this.sensorsService.findByGardenAndPeriod(query);
  }
}
