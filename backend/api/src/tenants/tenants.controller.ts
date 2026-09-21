import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Ip,
  HttpCode,
  HttpStatus,
  Inject,
} from '@nestjs/common';
import { TenantsService } from './tenants.service';
import { CurrentUser, RequirePermissions } from '../common/decorators';
import { SafeUser } from '@super-optical/types';
import {
  createTenantSchema,
  updateTenantSchema,
} from '@super-optical/validation';

@Controller('tenants')
export class TenantsController {
  constructor(@Inject(TenantsService) private readonly tenantsService: TenantsService) {}

  @Get()
  async getTenants(@CurrentUser() user: SafeUser) {
    const tenantsList = await this.tenantsService.findAll(user);
    return { success: true, data: tenantsList };
  }

  @Get(':id')
  async getTenantById(@Param('id') id: string, @CurrentUser() user: SafeUser) {
    const tenant = await this.tenantsService.findById(id, user);
    return { success: true, data: tenant };
  }

  @Post()
  @RequirePermissions('tenants:create')
  @HttpCode(HttpStatus.CREATED)
  async createTenant(
    @Body() body: unknown,
    @CurrentUser() user: SafeUser,
    @Ip() ip: string
  ) {
    const validated = createTenantSchema.parse(body);
    const tenant = await this.tenantsService.create(validated, user, ip);
    return { success: true, data: tenant };
  }

  @Patch(':id')
  @RequirePermissions('tenants:update')
  async updateTenant(
    @Param('id') id: string,
    @Body() body: unknown,
    @CurrentUser() user: SafeUser,
    @Ip() ip: string
  ) {
    const validated = updateTenantSchema.parse(body);
    const tenant = await this.tenantsService.update(id, validated, user, ip);
    return { success: true, data: tenant };
  }

  @Post(':id/switch')
  @HttpCode(HttpStatus.OK)
  async switchTenant(
    @Param('id') id: string,
    @CurrentUser() user: SafeUser
  ) {
    const result = await this.tenantsService.switchTenant(id, user);
    return { success: true, data: result };
  }
}
