import {
  Controller,
  Post,
  Get,
  Body,
  Ip,
  Headers,
  HttpCode,
  HttpStatus,
  Inject,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { Public, CurrentUser } from '../common/decorators';
import {
  loginSchema,
  refreshTokenSchema,
  bootstrapAdminSchema,
} from '@super-optical/validation';
import { SafeUser } from '@super-optical/types';

@Controller('auth')
export class AuthController {
  constructor(@Inject(AuthService) private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() body: unknown,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string
  ) {
    const validated = loginSchema.parse(body);
    const result = await this.authService.login(
      validated.email,
      validated.password,
      validated.requestedTenantId,
      validated.requestedStoreId,
      ip,
      userAgent
    );
    return { success: true, data: result };
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body() body: unknown, @Ip() ip: string) {
    const validated = refreshTokenSchema.parse(body);
    const result = await this.authService.refresh(validated.refreshToken, ip);
    return { success: true, data: result };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Body() body: any, @CurrentUser() user: SafeUser) {
    await this.authService.logout(body?.refreshToken, user?.id);
    return { success: true, message: 'Logged out successfully' };
  }

  @Get('me')
  async getMe(@CurrentUser() user: SafeUser) {
    const session = await this.authService.getMe(user.id);
    return { success: true, data: session };
  }

  @Public()
  @Post('bootstrap-admin')
  @HttpCode(HttpStatus.CREATED)
  async bootstrapAdmin(@Body() body: unknown, @Ip() ip: string) {
    const validated = bootstrapAdminSchema.parse(body);
    const result = await this.authService.bootstrapAdmin(
      validated.bootstrapSecret,
      validated.email,
      validated.password,
      validated.fullName,
      ip
    );
    return result;
  }
}
