import { Maybe } from '../../types/index';
import { DeleteResult, Model, Types } from 'mongoose';
import { Injectable, Dependencies, Inject } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { LoginLog } from './LoginLog.schema';

@Injectable()
@Dependencies(getModelToken(LoginLog.name))
export class LoginLogService {
  constructor(private model: Model<LoginLog>) {
    this.model = model;
  }

  async create(user_id: string, login_at: number, ip: string) {
    const created = new this.model({
      user_id,
      login_at,
      login_ip: ip,
    });
    return await created.save();
  }

  async findAll() {
    return this.model.find().exec();
  }

  async findById(id: string) {
    const query = this.model.findById(id);
    return await query.exec();
  }

  async findByIds(ids: string[]) {
    const query = this.model.find({ _id: { $in: ids } });
    return await query.exec();
  }

  async delete(id: string): Promise<DeleteResult> {
    return this.model.deleteOne({ id }).exec();
  }

  async deleteByIds(ids: string[]): Promise<DeleteResult> {
    return this.model.deleteMany({ _id: { $in: ids } }).exec();
  }

  async findByUserId(user_id: string) {
    return this.model.find({ user_id }).exec();
  }

  async findPageByUserId(user_id: string, page: number, size: number) {
    return this.model
      .find({ user_id })
      .skip((page - 1) * size)
      .limit(size)
      .exec();
  }
}
