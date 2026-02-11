import { Injectable, Dependencies, Inject } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { User } from './user.schema';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { UserModel } from './user.model';
import { UserRoleService } from './user.service.role';
import { QueryFilter } from 'mongoose';
import { PaginatedResult } from '@/types/query';

@Injectable()
@Dependencies(getModelToken(User.name))
export class UserManageService {
  constructor(
    @Inject() private userModel: UserModel,
    @Inject() private emitter: EventEmitter2,
    @Inject() private userRoleService: UserRoleService,
  ) {}

  /**
   * 分页查询
   */
  async findPage(
    page: number,
    pageSize: number,
    filter?: QueryFilter<User>,
  ): Promise<PaginatedResult<User>> {
    const result = await this.userModel.findPage(page, pageSize);
    return result;
  }
}
