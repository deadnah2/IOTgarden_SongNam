import { Global, Module } from '@nestjs/common';
import { GardenOwnershipGuard } from './guards/garden-ownership.guard';
import { GardenAccessService } from './services/garden-access.service';

@Global()
@Module({
  providers: [GardenAccessService, GardenOwnershipGuard],
  exports: [GardenAccessService, GardenOwnershipGuard],
})
export class CommonModule {}
