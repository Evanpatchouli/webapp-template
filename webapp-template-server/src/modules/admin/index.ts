import { Module } from '@nestjs/common';
import { UserModule } from '../user-module';
import { RoleController } from './role.controller';
import { RoleModule } from '../role-module';
import { CacheController } from './cache.controller';
import { UserManageController } from './user-manage.controller';

@Module({
  imports: [UserModule, RoleModule],
  controllers: [RoleController, CacheController, UserManageController],
  providers: [],
})
export class AdminModule {}
