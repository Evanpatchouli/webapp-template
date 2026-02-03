import type { AccountLoginForm, AccountRegisterForm, ILoginResult, IRegisterResult } from "@/types/user";
import { createAppRequest } from "./request";
import type { Resp } from "@/types/resp";

const appRequest = createAppRequest("/user");
export const accountLogin = (data: AccountLoginForm) =>
  appRequest.post<null, Resp<ILoginResult>>("/login/account", data);

export const accountRegister = (data: AccountRegisterForm) =>
  appRequest.post<null, Resp<IRegisterResult>>("/register/account", data);
