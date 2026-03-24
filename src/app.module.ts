import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RolesGuard } from './common/guards/roles.guard';
import { GardenOwnershipGuard } from './common/guards/garden-ownership.guard';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import appConfig from './config/app.config';
import jwtConfig from './config/jwt.config';
import mqttConfig from './config/mqtt.config';
import { AuthModule } from './modules/auth/auth.module';
import { GardensModule } from './modules/gardens/gardens.module';
import { UsersModule } from './modules/users/users.module';
import { VegetablesModule } from './modules/vegetables/vegetables.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      envFilePath: '.env',
      load: [appConfig, jwtConfig, mqttConfig],
    }),
    PrismaModule,
    UsersModule,
    AuthModule,
    GardensModule,
    VegetablesModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    GardenOwnershipGuard,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
