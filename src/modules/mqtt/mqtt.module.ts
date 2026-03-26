import { Module } from '@nestjs/common';
import { SensorsModule } from '../sensors/sensors.module';
import { SensorPayloadParserHelper } from './helpers/sensor-payload-parser.helper';
import { MqttService } from './mqtt.service';

@Module({
  imports: [SensorsModule],
  providers: [MqttService, SensorPayloadParserHelper],
  exports: [MqttService],
})
export class MqttModule {}
