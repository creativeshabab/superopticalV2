import { Injectable } from '@nestjs/common';
import dotenv from 'dotenv';

dotenv.config();

@Injectable()
export class ConfigService {
  readonly port: number = parseInt(process.env.PORT || '3000', 10);
  readonly nodeEnv: string = process.env.NODE_ENV || 'development';
  readonly databaseUrl: string =
    process.env.DATABASE_URL ||
    'postgresql://postgres:@localhost:5433/super_optical_dev?sslmode=disable';
  readonly jwtSecret: string =
    process.env.JWT_SECRET || 'super-optical-v2-dev-jwt-secret-key-32-chars-min';
  readonly jwtRefreshSecret: string =
    process.env.JWT_REFRESH_SECRET || 'super-optical-v2-dev-refresh-secret-key-32-chars';
  readonly bootstrapSecret: string =
    process.env.BOOTSTRAP_SECRET || 'super-optical-bootstrap-secret-key';
  readonly accessTokenExpiresInSeconds: number = parseInt(
    process.env.ACCESS_TOKEN_EXPIRES_IN || '900',
    10
  ); // 15 minutes default
  readonly jwtExpiresIn: string = '15m';
  readonly refreshTokenExpiresInSeconds: number = parseInt(
    process.env.REFRESH_TOKEN_EXPIRES_IN || '604800',
    10
  ); // 7 days default
  readonly corsOrigin: string = process.env.CORS_ORIGIN || 'http://localhost:5173,tauri://localhost';
}
