import { SetMetadata, createParamDecorator, ExecutionContext } from '@nestjs/common';
import { PermissionKey } from '@super-optical/types';

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

export const REQUIRE_TENANT_KEY = 'requireTenant';
export const RequireTenant = () => SetMetadata(REQUIRE_TENANT_KEY, true);

export const REQUIRE_STORE_KEY = 'requireStore';
export const RequireStore = () => SetMetadata(REQUIRE_STORE_KEY, true);

export const PERMISSIONS_KEY = 'permissions';
export const RequirePermissions = (...permissions: PermissionKey[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  }
);

export const CurrentTenant = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.tenantContext;
  }
);

export const CurrentStore = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.storeContext;
  }
);
