import { Module } from '@nestjs/common';
import { PriceService } from './price.service';
import { VegetablesController } from './vegetables.controller';
import { VegetablesService } from './vegetables.service';

@Module({
  controllers: [VegetablesController],
  providers: [VegetablesService, PriceService],
  exports: [VegetablesService, PriceService],
})
export class VegetablesModule {}

