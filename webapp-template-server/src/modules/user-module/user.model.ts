import { Model } from 'mongoose';
import { Injectable, Dependencies, Inject } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { User } from './user.schema';
import { UserIdentity } from '@/types/user';
import { orNull } from '@/utils/value';

@Injectable()
@Dependencies(getModelToken(User.name))
export class UserModel {
  constructor(private model: Model<User>) {
    this.model = model;
  }

  async create(
    identity: Partial<UserIdentity> & { password?: string },
    ip: string,
    visit_at: number,
  ) {
    const created = new this.model({
      openid: orNull(identity.openid),
      phone: orNull(identity.phone),
      username: orNull(identity.username),
      last_login_ip: ip,
      last_login_at: visit_at,
      register_at: visit_at,
    });
    return await created.save();
  }

  async findAll() {
    return this.model.find().exec();
  }

  async findById(id: string) {
    return this.model.findById(id).exec();
  }

  async findByOpenid(openid: string) {
    return this.model.findOne({ openid }).exec();
  }

  async findByPhone(phone: string) {
    return this.model.findOne({ phone }).exec();
  }

  async pushRole(openid: string, role_id: string) {
    return this.model
      .findOneAndUpdate({ openid }, { $push: { role_ids: role_id } })
      .exec();
  }

  async findByUsername(username: string) {
    return this.model.findOne({ username }).exec();
  }

  async findByUsernameAndPassword(username: string, password: string) {
    return this.model.findOne({ username, password }).exec();
  }
}
