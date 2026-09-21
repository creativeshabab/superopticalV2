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
import { StoresService } from './stores.service';
import {
  CurrentUser,
  CurrentTenant,
  RequireTenant,
  RequirePermissions,
} from '../common/decorators';
import { SafeUser, TenantContext } from '@super-optical/types';
import {
  createStoreSchema,
  updateStoreSchema,
} from '@super-optical/validation';

@Controller('stores')
@RequireTenant()
export class StoresController {
  constructor(@Inject(StoresService) private readonly storesService: StoresService) {}

  @Get()
  async getStores(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: SafeUser
  ) {
    const storesList = await this.storesService.findAll(tenant, user);
    return { success: true, data: storesList };
  }

  @Get(':id')
  async getStoreById(
    @Param('id') id: string,
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: SafeUser
  ) {
    const store = await this.storesService.findById(id, tenant, user);
    return { success: true, data: store };
  }

  @Post()
  @RequirePermissions('stores:create')
  @HttpCode(HttpStatus.CREATED)
  async createStore(
    @Body() body: unknown,
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: SafeUser,
    @Ip() ip: string
  ) {
    const validated = createStoreSchema.parse(body);
    const store = await this.storesService.create(validated, tenant, user, ip);
    return { success: true, data: store };
  }

  @Patch(':id')
  @RequirePermissions('stores:update')
  async updateStore(
    @Param('id') id: string,
    @Body() body: unknown,
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: SafeUser,
    @Ip() ip: string
  ) {
    const validated = updateStoreSchema.parse(body);
    const store = await this.storesService.update(id, validated, tenant, user, ip);
    return { success: true, data: store };
  }

  @Post(':id/switch')
  @HttpCode(HttpStatus.OK)
  async switchStore(
    @Param('id') id: string,
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: SafeUser
  ) {
    const result = await this.storesService.switchStore(id, tenant, user);
    return { success: true, data: result };
  }
}
