import { Auth, Public, RoleIn, Roles } from '@decorators/auth.decorator';
import { Controller, Get, Inject, Query, Req, Param, Put, Delete, Body } from '@nestjs/common';
import Resp from '../../common/models/Resp';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
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

class UpdatePhoneDto {
  @IsNotEmpty()
  @IsString()
  phone: string;
}

class UpdateWchatDto {
  @IsNotEmpty()
  @IsString()
  openid: string;
}

class UpdateEmailDto {
  @IsNotEmpty()
  @IsString()
  email: string;
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
  ) { }

  @RoleIn('SUPER_ADMIN', 'DEV_ADMIN', 'OPS_ADMIN')
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
      list: list.map((i) => vofy(i)),
      ...result,
    });
  }

  @RoleIn('SUPER_ADMIN', 'DEV_ADMIN', 'OPS_ADMIN')
  @Get(':id')
  @Tag('获取用户详情')
  async getUserDetail(@Param('id') id: string): Promise<Resp<User>> {
    const user = await this.userManageService.getUserDetail(id);
    return Resp.success(vofy(user));
  }

  @RoleIn('SUPER_ADMIN', 'DEV_ADMIN', 'OPS_ADMIN')
  @Put(':id/status')
  @Tag('切换用户状态')
  async toggleUserStatus(@Param('id') id: string): Promise<Resp<void>> {
    await this.userManageService.toggleUserStatus(id);
    return Resp.success();
  }

  @RoleIn('SUPER_ADMIN', 'DEV_ADMIN', 'OPS_ADMIN')
  @Put(':id/phone')
  @Tag('更新用户手机号')
  async updatePhone(@Param('id') id: string, @Body() dto: UpdatePhoneDto): Promise<Resp<void>> {
    await this.userManageService.updatePhone(id, dto.phone);
    return Resp.success();
  }

  @RoleIn('SUPER_ADMIN', 'DEV_ADMIN', 'OPS_ADMIN')
  @Put(':id/wechat')
  @Tag('更新用户微信')
  async updateWchat(@Param('id') id: string, @Body() dto: UpdateWchatDto): Promise<Resp<void>> {
    await this.userManageService.updateWchat(id, dto.openid);
    return Resp.success();
  }

  @RoleIn('SUPER_ADMIN', 'DEV_ADMIN', 'OPS_ADMIN')
  @Put(':id/email')
  @Tag('更新用户邮箱')
  async updateEmail(@Param('id') id: string, @Body() dto: UpdateEmailDto): Promise<Resp<void>> {
    await this.userManageService.updateEmail(id, dto.email);
    return Resp.success();
  }

  @RoleIn('SUPER_ADMIN', 'DEV_ADMIN')
  @Put(':id/reset-password')
  @Tag('重置用户密码')
  async resetPassword(@Param('id') id: string): Promise<Resp<void>> {
    await this.userManageService.resetPassword(id);
    return Resp.success();
  }

  @RoleIn('SUPER_ADMIN', 'DEV_ADMIN')
  @Delete(':id')
  @Tag('删除用户')
  async deleteUser(@Param('id') id: string): Promise<Resp<void>> {
    await this.userManageService.deleteUser(id);
    return Resp.success();
  }

  @RoleIn('SUPER_ADMIN', 'DEV_ADMIN')
  @Put(':id/restore')
  @Tag('恢复用户')
  async restoreUser(@Param('id') id: string): Promise<Resp<void>> {
    await this.userManageService.restoreUser(id);
    return Resp.success();
  }
}
