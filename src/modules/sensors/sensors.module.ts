import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module';
import { WsModule } from '../websocket/ws.module';
import { SensorsController } from './sensors.controller';
import { SensorsService } from './sensors.service';

@Module({
  imports: [WsModule, NotificationsModule],
  controllers: [SensorsController],
  providers: [SensorsService],
  exports: [SensorsService],
})
export class SensorsModule {}
