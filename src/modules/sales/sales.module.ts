import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { SalesController } from './sales.controller';
import { SalesService } from './sales.service';

@Module({
  controllers: [SalesController],
  providers: [SalesService],
  exports: [SalesService],
})
export class SalesModule {}
