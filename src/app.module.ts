import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CommonModule } from './common/common.module';
import { RolesGuard } from './common/guards/roles.guard';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import appConfig from './config/app.config';
import jwtConfig from './config/jwt.config';
import mqttConfig from './config/mqtt.config';
import { AuthModule } from './modules/auth/auth.module';
import { GardensModule } from './modules/gardens/gardens.module';
import { MqttModule } from './modules/mqtt/mqtt.module';
import { ReportsModule } from './modules/reports/reports.module';
import { SalesModule } from './modules/sales/sales.module';
import { SensorsModule } from './modules/sensors/sensors.module';
import { UsersModule } from './modules/users/users.module';
import { VegetablesModule } from './modules/vegetables/vegetables.module';
import { WsModule } from './modules/websocket/ws.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      envFilePath: '.env',
      load: [appConfig, jwtConfig, mqttConfig],
    }),
    CommonModule,
    PrismaModule,
    UsersModule,
    AuthModule,
    GardensModule,
    VegetablesModule,
    SalesModule,
    ReportsModule,
    WsModule,
    SensorsModule,
    MqttModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
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
