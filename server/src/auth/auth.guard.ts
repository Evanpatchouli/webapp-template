import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  PUBLIC_KEY,
  ROLE_KEY,
  ROLE_IN_KEY,
  ROLES_KEY,
  PERMISSION_KEY,
  PERMISSION_IN_KEY,
  PERMISSIONS_KEY,
} from './auth.constants';
import { BusinessSessionService } from './session.service';
import { logger } from '@/common/logger';
import { Request } from 'express';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private reflector: Reflector, private sessions: BusinessSessionService) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const handler = ctx.getHandler();
    const clazz = ctx.getClass();
    const req = ctx.switchToHttp().getRequest();

    // 1. 若标记 Public => 无条件公开
    const isPublic = this.reflector.getAllAndOverride<boolean>(PUBLIC_KEY, [
      handler,
      clazz,
    ]);
    if (isPublic) return true;

    // 2. 读取认证与授权元数据。所有未标记 Public 的接口都必须有业务 Session。
    // 3. 判断是否有角色注解（角色注解隐含需要认证）
    const needRoleSingle = this.reflector.getAllAndOverride<string>(ROLE_KEY, [
      handler,
      clazz,
    ]);
    const needRoleIn = this.reflector.getAllAndOverride<string[]>(ROLE_IN_KEY, [
      handler,
      clazz,
    ]);
    const needRolesAll = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      handler,
      clazz,
    ]);
    const needPermissionSingle = this.reflector.getAllAndOverride<string>(
      PERMISSION_KEY,
      [handler, clazz],
    );
    const needPermissionIn = this.reflector.getAllAndOverride<string[]>(
      PERMISSION_IN_KEY,
      [handler, clazz],
    );
    const needPermissionsAll = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [handler, clazz],
    );

    // Every non-public endpoint requires a business session. Never fall back to Bearer.
    const user = await this.sessions.authenticate(req).catch((error: unknown) => {
      if (error instanceof UnauthorizedException || error instanceof ForbiddenException) throw error;
      throw new ServiceUnavailableException('会话服务暂不可用');
    });

    // 写入 req.meta.user
    req.meta = req.meta || {};
    req.meta.user = user;

    // 6. 角色鉴权
    const userRoles: string[] = user?.roles || [];
    const userPermissions: string[] = user?.permissions || [];

    // Role(role) => user.roles 必须包含 role
    if (needRoleSingle && !userRoles.includes(needRoleSingle)) {
      logger.info('请求地址', (req as Request).url);
      logger.error(`需要角色: ${needRoleSingle}`);
      throw new ForbiddenException();
    }

    // RoleIn(...roles) => user.roles 至少包含其中一个
    if (needRoleIn && !needRoleIn.some((r) => userRoles.includes(r))) {
      logger.info('请求地址', (req as Request).url);
      logger.error(`需要满足任意角色: ${needRoleIn.join(', ')}`);
      throw new ForbiddenException();
    }

    // Roles(...roles) => user.roles 必须包含所有角色
    if (needRolesAll && !needRolesAll.every((r) => userRoles.includes(r))) {
      logger.info('请求地址', (req as Request).url);
      logger.error(
        `需要${needRolesAll.length > 1 ? '同时具备' : ''}角色: ${needRolesAll.join(', ')}`,
      );
      throw new ForbiddenException();
    }

    // Permi(permission) => user.permissions 必须包含 permission
    if (
      needPermissionSingle &&
      !userPermissions.includes(needPermissionSingle)
    ) {
      logger.info('请求地址', (req as Request).url);
      logger.error(`需要权限: ${needPermissionSingle}`);
      throw new ForbiddenException();
    }

    // PermiIn(...permissions) => user.permissions 至少包含其中一个
    if (
      needPermissionIn &&
      !needPermissionIn.some((p) => userPermissions.includes(p))
    ) {
      logger.info('请求地址', (req as Request).url);
      logger.error(`需要满足任意权限: ${needPermissionIn.join(', ')}`);
      throw new ForbiddenException();
    }

    // Permis(...permissions) => user.permissions 必须包含所有权限
    if (
      needPermissionsAll &&
      !needPermissionsAll.every((p) => userPermissions.includes(p))
    ) {
      logger.info('请求地址', (req as Request).url);
      logger.error(
        `需要${needPermissionsAll.length > 1 ? '同时具备' : ''}权限: ${needPermissionsAll.join(', ')}`,
      );
      throw new ForbiddenException();
    }

    return true;
  }
}
