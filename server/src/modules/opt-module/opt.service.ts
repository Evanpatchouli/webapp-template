import cache from '@/cache';
import { OPTWay } from '@/constants/opt.constant';
import { TimeUnitString, ValuesOf } from '@webapp-template/common';
import { Inject, Injectable, Session } from '@nestjs/common';
import { createOPT } from './opt.util';
import EmailService from '../email-module/email.service';
import { MessageService } from '../message-module/message.service';

@Injectable()
export default class OPTService {
  constructor(
    @Inject() private emailService: EmailService,
    @Inject() private messageService: MessageService,
  ) {}

  /**
   * 生成 6 位 OPT（一次性验证码）
   */
  generate(
    key: string,
    way: ValuesOf<typeof OPTWay>,
    expireIn?: number | TimeUnitString,
  ) {
    const opt = createOPT(expireIn || '5m');
    cache.set(`${way}::${key}`, opt.code, opt.expiry);
    return opt;
  }

  verify(key: string, code: string, way: ValuesOf<typeof OPTWay>) {
    return code === cache.get(`${way}::${key}`);
  }

  async generatePhoneLoginOPT(phone: string) {
    const opt = this.generate(phone, OPTWay.PHONE_LOGIN, '5m');
    await this.messageService.sendPhoneLoginOPT(phone, opt.code);
    return opt;
  }

  async generateEmailLoginOPT(email: string) {
    const opt = this.generate(email, OPTWay.EMAIL_LOGIN, '30m');
    await this.emailService.sendOptEmail(email, opt.code, OPTWay.EMAIL_LOGIN);
    return opt;
  }
}
