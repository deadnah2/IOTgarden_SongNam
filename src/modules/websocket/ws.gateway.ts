import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import {
  ForbiddenException,
  Logger,
  NotFoundException,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Role } from '@prisma/client';
import { Server, Socket } from 'socket.io';
import type { JwtPayload } from '../../common/interfaces/jwt-payload.interface';
import { GardenAccessService } from '../../common/services/garden-access.service';
import { UsersService } from '../users/users.service';
import { JoinGardenDto } from './dto/join-garden.dto';

type SocketUser = {
  id: number;
  email: string;
  name: string;
  role: Role;
};

type SensorRealtimePayload = {
  id: number;
  gardenId: number;
  temperature: number;
  humidity: number;
  recordedAt: Date;
};

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class WsGateway
  implements
    OnGatewayInit<Server>,
    OnGatewayConnection<Socket>,
    OnGatewayDisconnect<Socket>
{
  private readonly logger = new Logger(WsGateway.name);

  @WebSocketServer()
  server: Server;

  constructor(
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
    private readonly gardenAccessService: GardenAccessService,
  ) {}

  afterInit(server: Server) {
    server.use(async (client, next) => {
      try {
        const token = this.extractToken(client);
        const payload = await this.jwtService.verifyAsync<JwtPayload>(token);
        const user = await this.usersService.findById(payload.sub);

        if (!user) {
          throw new Error('User not found');
        }

        client.data.user = user;
        next();
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Unauthorized websocket client';
        const connectError = new Error(message) as Error & {
          data?: { message: string };
        };

        connectError.data = { message };
        next(connectError);
      }
    });
  }

  handleConnection(client: Socket) {
    const user = client.data.user as SocketUser | undefined;
    this.logger.log(
      `WebSocket connected: user=${user?.id ?? 'unknown'}, socket=${client.id}`,
    );
  }

  handleDisconnect(client: Socket) {
    const user = client.data.user as SocketUser | undefined;
    this.logger.log(
      `WebSocket disconnected: user=${user?.id ?? 'unknown'}, socket=${client.id}`,
    );
  }

  @SubscribeMessage('garden.join')
  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  )
  async handleJoinGarden(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: JoinGardenDto,
  ) {
    const user = client.data.user as SocketUser | undefined;

    if (!user) {
      client.emit('auth.error', { message: 'Unauthorized websocket client' });
      client.disconnect(true);
      return;
    }

    try {
      await this.gardenAccessService.assertGardenAccess(dto.gardenId, user);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        client.emit('garden.join.error', {
          message: Array.isArray(error.message)
            ? error.message.join(', ')
            : error.message,
        });
        return;
      }

      throw error;
    }

    const room = this.getGardenRoom(dto.gardenId);
    await client.join(room);

    client.emit('garden.joined', {
      gardenId: dto.gardenId,
      room,
    });
  }

  emitSensorData(data: SensorRealtimePayload) {
    this.server.to(this.getGardenRoom(data.gardenId)).emit('sensor.updated', data);
    this.logger.log(
      `Emit sensor.updated for garden=${data.gardenId}: ${JSON.stringify(data)}`,
    );
  }

  private extractToken(client: Socket) {
    const authToken = client.handshake.auth?.token;

    if (typeof authToken === 'string' && authToken.trim() !== '') {
      return authToken.trim();
    }

    const authorizationHeader = client.handshake.headers.authorization;

    if (
      typeof authorizationHeader === 'string' &&
      authorizationHeader.startsWith('Bearer ')
    ) {
      return authorizationHeader.slice(7).trim();
    }

    const queryToken = client.handshake.query.token;

    if (typeof queryToken === 'string' && queryToken.trim() !== '') {
      return queryToken.trim();
    }

    throw new Error('Missing websocket token');
  }

  private getGardenRoom(gardenId: number) {
    return `garden:${gardenId}`;
  }
}
