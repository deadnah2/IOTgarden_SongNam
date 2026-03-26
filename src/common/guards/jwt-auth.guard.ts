import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    return super.canActivate(context);
  }

  handleRequest<TUser = unknown>(
    err: Error | null,
    user: TUser,
    info?: { message?: string; name?: string },
  ): TUser {
    if (err || !user) {
      if (info?.name === 'TokenExpiredError') {
        throw new UnauthorizedException('JWT token has expired');
      }

      if (info?.name === 'JsonWebTokenError') {
        throw new UnauthorizedException('JWT token is invalid');
      }

      if (info?.message === 'No auth token') {
        throw new UnauthorizedException('Missing bearer token');
      }

      throw new UnauthorizedException(
        info?.message ?? err?.message ?? 'Token is invalid or has expired',
      );
    }

    return user;
  }
}
