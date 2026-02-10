import type {
  AccountLoginForm,
  AccountRegisterForm,
  ILoginResult,
  IRegisterResult,
} from "@/types/user";
import { createAppRequest } from "./request";
import type Resp from "@/models/Resp";

const appRequest = createAppRequest("/user");
export const accountLogin = (
  data: AccountLoginForm,
): Promise<Resp<ILoginResult>> => appRequest.post("/login/account", data);

export const accountRegister = (
  data: AccountRegisterForm,
): Promise<Resp<IRegisterResult>> => appRequest.post("/register/account", data);
