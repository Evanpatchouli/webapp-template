import { Auth, Public, RoleIn, Roles } from '@decorators/auth.decorator';
import { Controller, Get, Inject, Query, Req } from '@nestjs/common';
import Resp from '../../common/models/Resp';
import { IsNotEmpty, IsOptional } from 'class-validator';
import { RoleService } from '../role-module/role.service';
import { ToBoolean, ToNumber } from '../../decorators/transform.decorator';
import { Tag } from '../../decorators/tag.decorator';
import { Todo } from '../../decorators/todo.decorator';
import { UserManageService } from '../user-module/user.service.manage';
import { PaginatedResult } from '@/types/query';
import { User } from '../user-module/user.schema';
import { vofy } from '@/utils/vofy';

class QueryUserPageParams {
  @IsNotEmpty()
  @ToNumber()
  page: number;
  @IsNotEmpty()
  @ToNumber()
  size: number;
}

@Auth()
@Tag('用户管理')
@Controller('admin/user-manage')
export class UserManageController {
  constructor(
    @Inject()
    private userManageService: UserManageService,
    @Inject()
    private roleService: RoleService,
  ) {}

  //   @RoleIn('SUPER_ADMIN', 'DEV_ADMIN', 'OPS_ADMIN')
  @Get()
  @Tag('分页查询用户')
  async queryAll(
    @Query() params: QueryUserPageParams,
  ): Promise<Resp<PaginatedResult<User>>> {
    const { list, ...result } = await this.userManageService.findPage(
      params.page,
      params.size,
    );
    return Resp.success({
      // list: list.map((i) => vofy(i)),
      list,
      ...result,
    });
  }
}
