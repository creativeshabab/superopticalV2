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
import { UsersService } from './users.service';
import {
  CurrentUser,
  CurrentTenant,
  RequireTenant,
  RequirePermissions,
} from '../common/decorators';
import { SafeUser, TenantContext } from '@super-optical/types';
import {
  createUserSchema,
  updateUserStatusSchema,
  assignUserRolesSchema,
  assignUserStoresSchema,
} from '@super-optical/validation';

@Controller('users')
export class UsersController {
  constructor(@Inject(UsersService) private readonly usersService: UsersService) {}

  @Get()
  @RequirePermissions('users:read')
  async getUsers(
    @CurrentTenant() tenant: TenantContext | undefined,
    @CurrentUser() user: SafeUser
  ) {
    const userList = await this.usersService.findAll(tenant, user);
    return { success: true, data: userList };
  }

  @Get(':id')
  @RequirePermissions('users:read')
  async getUserById(
    @Param('id') id: string,
    @CurrentTenant() tenant: TenantContext | undefined,
    @CurrentUser() user: SafeUser
  ) {
    const targetUser = await this.usersService.findById(id, tenant, user);
    return { success: true, data: targetUser };
  }

  @Post()
  @RequireTenant()
  @RequirePermissions('users:create')
  @HttpCode(HttpStatus.CREATED)
  async createUser(
    @Body() body: unknown,
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: SafeUser,
    @Ip() ip: string
  ) {
    const validated = createUserSchema.parse(body);
    const createdUser = await this.usersService.create(validated, tenant, user, ip);
    return { success: true, data: createdUser };
  }

  @Patch(':id/status')
  @RequirePermissions('users:update')
  async updateStatus(
    @Param('id') id: string,
    @Body() body: unknown,
    @CurrentTenant() tenant: TenantContext | undefined,
    @CurrentUser() user: SafeUser,
    @Ip() ip: string
  ) {
    const validated = updateUserStatusSchema.parse(body);
    const result = await this.usersService.updateStatus(
      id,
      validated.status,
      tenant,
      user,
      ip
    );
    return { success: true, data: result };
  }

  @Post(':id/roles')
  @RequireTenant()
  @RequirePermissions('users:update')
  async assignRoles(
    @Param('id') id: string,
    @Body() body: unknown,
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: SafeUser,
    @Ip() ip: string
  ) {
    const validated = assignUserRolesSchema.parse(body);
    const result = await this.usersService.assignRoles(id, validated, tenant, user, ip);
    return { success: true, data: result };
  }

  @Post(':id/stores')
  @RequireTenant()
  @RequirePermissions('users:update')
  async assignStores(
    @Param('id') id: string,
    @Body() body: unknown,
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: SafeUser,
    @Ip() ip: string
  ) {
    const validated = assignUserStoresSchema.parse(body);
    const result = await this.usersService.assignStores(id, validated, tenant, user, ip);
    return { success: true, data: result };
  }
}
