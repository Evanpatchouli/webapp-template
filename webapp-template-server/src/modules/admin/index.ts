import { Module } from '@nestjs/common';
import { UserModule } from '../user-module';
import { RoleController } from './role.controller';
import { RoleModule } from '../role-module';
import { CacheController } from './cache.controller';

@Module({
  imports: [UserModule, RoleModule],
  controllers: [RoleController, CacheController],
  providers: [],
})
export class AdminModule {}
