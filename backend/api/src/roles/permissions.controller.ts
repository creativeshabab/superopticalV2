import { Controller, Get, Inject } from '@nestjs/common';
import { RolesService } from './roles.service';

@Controller('permissions')
export class PermissionsController {
  constructor(@Inject(RolesService) private readonly rolesService: RolesService) {}

  @Get()
  async getPermissions() {
    const list = await this.rolesService.findAllPermissions();
    return { success: true, data: list };
  }
}
