import { IsNotEmpty } from 'class-validator';

export class OpenidLoginForm {
  @IsNotEmpty()
  openid: string;
}

export class AccountLoginForm {
  @IsNotEmpty()
  username: string;
  @IsNotEmpty()
  password: string;
  @IsNotEmpty()
  captcha: string;
}

export class PhoneLoginForm {
  @IsNotEmpty()
  phone: string;
  @IsNotEmpty()
  code: string;
}

export class GeneralLoginForm {
  username?: string;
  password?: string;
  captcha?: string;

  openid?: string;

  phone?: string;
  code?: string;
}
