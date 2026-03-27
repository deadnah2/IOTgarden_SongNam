import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CheckOwnership } from '../../common/decorators/ownership.decorator';
import { GardenOwnershipGuard } from '../../common/guards/garden-ownership.guard';
import { QueryNotificationsDto } from './dto/query-notifications.dto';
import { NotificationsService } from './notifications.service';

@ApiTags('Notifications')
@ApiBearerAuth()
@Controller('notifications')
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
  ) {}

  @UseGuards(GardenOwnershipGuard)
  @CheckOwnership({
    resource: 'garden',
    source: 'query',
    key: 'gardenId',
  })
  @Get()
  @ApiOperation({ summary: 'Get notifications by garden' })
  findByGarden(@Query() query: QueryNotificationsDto) {
    return this.notificationsService.findByGarden(query);
  }
}
