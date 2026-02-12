import type { Maybe } from "./utils";

export interface AccountLoginForm {
  username: string;
  password: string;
  captcha: string;
}

export interface ILoginResult {
  id: string;
  openid?: Maybe<string>;
  phone?: Maybe<string>;
  username?: Maybe<string>;
  nickname?: Maybe<string>;
  email?: Maybe<string>;
  token: string;
  roles: string[];
  permissions: string[];
}

export type AccountRegisterForm = AccountLoginForm;

export type IRegisterResult = ILoginResult;
