import cache from '@/cache';
import { OPTWay } from '@/constants/opt.constant';
import { TimeUnitString, ValuesOf } from '@/types';
import { Injectable, Session } from '@nestjs/common';
import { createOPT } from './opt.util';

@Injectable()
export default class OPTService {
  constructor() {}

  generate(
    phone: string,
    way: ValuesOf<typeof OPTWay>,
    expireIn?: number | TimeUnitString,
  ) {
    const opt = createOPT('5m');
    // TODO: send opt to phone
    cache.set(`${way}::${phone}`, opt.code, opt.expiry);
    return opt;
  }

  verify(phone: string, code: string, way: ValuesOf<typeof OPTWay>) {
    return code === cache.get(`${way}::${phone}`);
  }
}
