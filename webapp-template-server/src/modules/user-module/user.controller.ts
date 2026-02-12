import {
  BadRequestException,
  Body,
  Controller,
  Inject,
  Post,
  Query,
  Session,
} from '@nestjs/common';
import { UserService } from './user.service';
import {
  AccountLoginForm,
  PhoneLoginForm,
  OpenidLoginForm,
  GeneralLoginForm,
  EmailLoginForm,
} from './models/LoginForm';
import Resp from '@/common/models/Resp';
import { ILoginResult, LoginResult } from './models/LoginResult';
import { CurrentUser } from 'src/decorators/request-meta.decorator';
import type { AuthTokenPayload } from '@/auth/jwt';
import { LoginTypes, type LoginType } from '@/constants/login.constant';
import { IsNotEmpty } from 'class-validator';
import CaptchaService from '../captcha-module/captcha.service';
import OPTService from '../opt-module/opt.service';
import { CaptchaWay } from '@/constants/captcha.constant';
import type { SessionState } from '@/types';
import { OPTWay } from '@/constants/opt.constant';
import { Tag } from '../../decorators/tag.decorator';
import { Ip } from '@/decorators/ip.decorator';

class LoginQuery {
  @IsNotEmpty()
  type: LoginType;
}

@Controller('user')
export class UserController {
  constructor(
    @Inject() private readonly userService: UserService,
    @Inject() private readonly captchaService: CaptchaService,
    @Inject() private readonly optService: OPTService,
  ) {}

  @Post('/login')
  async login(
    @Body() form: GeneralLoginForm,
    @Session() session: SessionState,
    @Query() query: LoginQuery,
    @Ip() ip: string,
  ): Promise<Resp<ILoginResult>> {
    const { type } = query;
    if (type === LoginTypes.OPENID) {
      return this.loginByOpenid(form as OpenidLoginForm, ip);
    }
    if (type === LoginTypes.ACCOUNT) {
      return this.loginByAccount(form as AccountLoginForm, session, ip);
    }
    if (type === LoginTypes.PHONE) {
      return this.loginByPhone(form as PhoneLoginForm, ip);
    }
    return Resp.fail('不支持的登录方式');
  }

  @Tag('微信扫码登录')
  @Post('/login/openid')
  async loginByOpenid(
    @Body() form: OpenidLoginForm,
    @Ip() ip: string,
  ): Promise<Resp<ILoginResult>> {
    const openid = form.openid;
    const last_login_at = Date.now();
    const result = await this.userService.loginByOpenid(
      openid,
      ip,
      last_login_at,
    );
    return Resp.success(result);
  }

  @Tag('账号密码 + 图形验证码登录')
  @Post('/login/account')
  async loginByAccount(
    @Body() form: AccountLoginForm,
    @Session() session: SessionState,
    @Ip() ip: string,
  ): Promise<Resp<ILoginResult>> {
    const { username, password, captcha } = form;

    if (!this.captchaService.verify(captcha, CaptchaWay.LOGIN, session)) {
      throw new BadRequestException('验证码错误'); // TODO: 增加验证码错误次数限制
    }

    const last_login_at = Date.now();
    const result = await this.userService.loginByAccount(
      { username, password },
      ip,
      last_login_at,
    );

    return Resp.success(result);
  }

  @Tag('账号密码 + 图形验证码注册，注册成功后默认登录')
  @Post('/register/account')
  async registerAccount(
    @Body() form: AccountLoginForm,
    @Session() session: SessionState,
    @Ip() ip: string,
  ) {
    const { username, password, captcha } = form;

    if (!this.captchaService.verify(captcha, CaptchaWay.REGISTER, session)) {
      throw new BadRequestException('验证码错误'); // TODO: 增加验证码错误次数限制
    }

    const last_login_at = Date.now();
    const result = await this.userService.registerAccount(
      { username, password },
      ip,
      last_login_at,
    );

    return Resp.success(result);
  }

  @Tag('手机号 + 短信验证码登录')
  @Post('/login/phone')
  async loginByPhone(
    @Body() form: PhoneLoginForm,
    @Ip() ip: string,
  ): Promise<Resp<ILoginResult>> {
    const { phone, code } = form;

    if (!this.optService.verify(phone, code, OPTWay.PHONE_LOGIN)) {
      throw new BadRequestException('验证码错误'); // TODO: 增加验证码错误次数限制
    }

    const last_login_at = Date.now();
    const result = await this.userService.loginByPhone(
      phone,
      ip,
      last_login_at,
    );
    return Resp.success(result);
  }

  @Tag('电子邮件 + 邮件验证码登录')
  @Post('/login/email')
  async loginByEmail(
    @Body() form: EmailLoginForm,
    @Ip() ip: string,
  ): Promise<Resp<ILoginResult>> {
    const { email, code } = form;

    if (!this.optService.verify(email, code, OPTWay.PHONE_LOGIN)) {
      throw new BadRequestException('验证码错误'); // TODO: 增加验证码错误次数限制
    }

    const last_login_at = Date.now();
    const result = await this.userService.loginByEmail(
      email,
      ip,
      last_login_at,
    );
    return Resp.success(result);
  }

  @Post('/logout')
  logout(@CurrentUser() user: AuthTokenPayload) {
    return Resp.success(null);
  }
}
