import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
  Ip,
  HttpCode,
  HttpStatus,
  Inject,
} from '@nestjs/common';
import { RolesService } from './roles.service';
import {
  CurrentUser,
  CurrentTenant,
  RequireTenant,
  RequirePermissions,
} from '../common/decorators';
import { SafeUser, TenantContext } from '@super-optical/types';
import {
  createRoleSchema,
  updateRolePermissionsSchema,
} from '@super-optical/validation';

@Controller('roles')
export class RolesController {
  constructor(@Inject(RolesService) private readonly rolesService: RolesService) {}

  @Get()
  @RequirePermissions('roles:manage')
  async getRoles(@CurrentTenant() tenant?: TenantContext) {
    const roleList = await this.rolesService.findAllRoles(tenant);
    return { success: true, data: roleList };
  }

  @Get(':id')
  @RequirePermissions('roles:manage')
  async getRoleById(
    @Param('id') id: string,
    @CurrentTenant() tenant?: TenantContext
  ) {
    const role = await this.rolesService.findRoleById(id, tenant);
    return { success: true, data: role };
  }

  @Post()
  @RequireTenant()
  @RequirePermissions('roles:manage')
  @HttpCode(HttpStatus.CREATED)
  async createRole(
    @Body() body: unknown,
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: SafeUser,
    @Ip() ip: string
  ) {
    const validated = createRoleSchema.parse(body);
    const role = await this.rolesService.createRole(
      {
        ...validated,
        permissionKeys: validated.permissionKeys as any,
      },
      tenant,
      user,
      ip
    );
    return { success: true, data: role };
  }

  @Put(':id/permissions')
  @RequireTenant()
  @RequirePermissions('roles:manage')
  async updateRolePermissions(
    @Param('id') id: string,
    @Body() body: unknown,
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: SafeUser,
    @Ip() ip: string
  ) {
    const validated = updateRolePermissionsSchema.parse(body);
    const role = await this.rolesService.updateRolePermissions(
      id,
      validated.permissionKeys,
      tenant,
      user,
      ip
    );
    return { success: true, data: role };
  }
}
