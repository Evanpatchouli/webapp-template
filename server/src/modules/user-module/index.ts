import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './user.schema';
import { UserModel } from './user.model';
import { UserRoleService } from './user.service.role';
import { RoleModule } from '../role-module';
import { UserManageService } from './user.service.manage';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    RoleModule,
  ],
  controllers: [],
  providers: [
    UserModel,
    UserRoleService,
    UserManageService,
  ],
  exports: [UserManageService, UserRoleService],
})
export class UserModule {}
