import { Auth, Public, RoleIn, Roles } from '@decorators/auth.decorator';
import { Controller, Get, Inject, Query, Req } from '@nestjs/common';
import Resp from '../../common/models/Resp';
import type { Request } from 'express';
import { UserService } from '../user-module/user.service';
import { RoleDocument } from '../role-module/role.schema';
import { IsNotEmpty, IsOptional } from 'class-validator';
import { RoleService } from '../role-module/role.service';
import {
  buildPermissionTree,
  PermissionDocument,
} from '../permission-module/permission.schema';
import { ToBoolean } from '../../decorators/transform.decorator';
import { Tag } from '../../decorators/tag.decorator';
import { Todo } from '../../decorators/todo.decorator';

class QueryUserRoleParams {
  @IsNotEmpty()
  openid: string;

  @IsOptional()
  @ToBoolean()
  withPermission?: boolean; // 是否联查权限

  @IsOptional()
  @ToBoolean()
  withPermissionTree?: boolean; // 是否返回权限树
}

class QueryAllRolesParams {
  @IsOptional()
  @ToBoolean()
  simplify?: boolean; // 是否简化返回结果
}

@Auth()
@Tag('角色管理')
@Controller('admin/role')
export class RoleController {
  constructor(
    @Inject()
    private userService: UserService,
    @Inject()
    private roleService: RoleService,
  ) {}

  @RoleIn('SUPER_ADMIN', 'DEV_ADMIN', 'OPS_ADMIN')
  @Get()
  @Todo('FEAT', 'ignore')
  @Tag('查询所有角色')
  async queryAll(
    @Query() params: QueryAllRolesParams,
  ): Promise<Resp<Record<string, any>[]>> {
    const result = await this.roleService.findAllWithPermissionCodes();
    if (!params.simplify) {
      return Resp.success(result);
    }
    return Resp.success(result.map(simplifyRole));
  }

  @Public()
  @Tag('查询用户角色')
  @Get('/queryUserRole')
  async queryUserRole(
    @Query() params: QueryUserRoleParams,
    @Req() req: Request,
  ): Promise<Resp<{ roles: RoleDocument[]; permission_tree?: any[] }>> {
    const { openid, withPermission, withPermissionTree } = params;

    const result: RoleDocument[] | string = await this.userService.getRoles(
      openid,
      { withPermission },
    );
    if (typeof result === 'string') {
      return Resp.badRequest(result);
    }
    const permission_tree =
      withPermission && withPermissionTree
        ? buildPermissionTree(result.map((item) => item.permissions).flat())
        : void 0;

    return Resp.success({
      roles: result,
      permission_tree,
    });
  }
}

function simplifyRole(
  role: RoleDocument & { permissions: PermissionDocument[] },
) {
  return {
    id: role._id,
    role_code: role.role_code,
    role_name: role.role_name,
    description: role.description,
    permissions: role.permissions.map((permission) => ({
      id: permission._id,
      permission_code: permission.perm_code,
      permission_name: permission.perm_name,
      description: permission.description,
    })),
  };
}
