import { Controller, Get, Inject, Session } from '@nestjs/common';
import Resp from '../../common/models/Resp';
import { Tag } from '../../decorators/tag.decorator';
import type { SessionState } from '@/types';
import OptService from './opt.service';
import { CaptchaWay } from '@/constants/captcha.constant';
import { OPTWay } from '@/constants/opt.constant';

@Tag('短信验证码')
@Controller('opt')
export class OPTController {
  constructor(@Inject() private optService: OptService) {}

  @Get('/login')
  @Tag('获取登录短信验证码')
  get(@Session() session: SessionState): Resp<any> {
    const data = this.optService.generate(CaptchaWay.LOGIN, OPTWay.LOGIN);
    return Resp.success(data);
  }
}
