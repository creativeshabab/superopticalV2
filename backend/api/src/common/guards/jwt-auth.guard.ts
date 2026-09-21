import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Inject,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import jwt from 'jsonwebtoken';
import { ConfigService } from '../../config/config.service';
import { DatabaseService } from '../../database/database.service';
import { users } from '../../database/schema';
import { eq } from 'drizzle-orm';
import { IS_PUBLIC_KEY } from '../decorators';
import { AccessTokenPayload, SafeUser } from '@super-optical/types';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    @Inject(Reflector) private readonly reflector: Reflector,
    @Inject(ConfigService) private readonly configService: ConfigService,
    @Inject(DatabaseService) private readonly databaseService: DatabaseService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Authentication token missing');
    }

    const token = authHeader.split(' ')[1];

    try {
      const decoded = jwt.verify(
        token,
        this.configService.jwtSecret
      ) as AccessTokenPayload;

      // Verify user in database to ensure account is active and not disabled
      const db = this.databaseService.getDb();
      const [user] = await db
        .select({
          id: users.id,
          email: users.email,
          fullName: users.fullName,
          phone: users.phone,
          isPlatformAdmin: users.isPlatformAdmin,
          status: users.status,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        })
        .from(users)
        .where(eq(users.id, decoded.sub))
        .limit(1);

      if (!user) {
        throw new UnauthorizedException('User account no longer exists');
      }

      if (user.status !== 'ACTIVE') {
        throw new UnauthorizedException('User account is disabled or suspended');
      }

      request.user = user as SafeUser;
      request.tokenPayload = decoded;
      return true;
    } catch (err: any) {
      if (err instanceof UnauthorizedException) {
        throw err;
      }
      throw new UnauthorizedException('Invalid or expired authentication token');
    }
  }
}
