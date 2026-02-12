import cache from '@/cache';
import { OPTWay } from '@/constants/opt.constant';
import { TimeUnitString, ValuesOf } from '@/types';
import { Injectable, Session } from '@nestjs/common';
import { createOPT } from './opt.util';

@Injectable()
export default class OPTService {
  constructor() {}

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

  generatePhoneLoginOPT(phone: string) {
    return this.generate(phone, OPTWay.PHONE_LOGIN, '5m');
  }

  generateEmailLoginOPT(email: string) {
    return this.generate(email, OPTWay.PHONE_LOGIN, '30m');
  }
}
