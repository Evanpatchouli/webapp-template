import { UserSchema } from '@/modules/user-module/user.schema';
import mongoose from 'mongoose';

export async function v2() {
  const UserModel = mongoose.model('User', UserSchema);
  const adminUser = await UserModel.findOne({
    openid: 'ofSEA2KzGjX1IGcUFASZWgln9Lnw',
  });
  if (adminUser) {
    adminUser.email = 'evanpatchouli@foxmail.com';
    await adminUser.save();
  }
  console.log(`✅ 已更新管理员用户邮箱`);
}
