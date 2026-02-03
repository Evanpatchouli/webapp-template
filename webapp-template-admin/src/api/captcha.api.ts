import type Resp from "@/types";
import { createAppRequest } from "./request";
import { CaptchaWay } from "../constants/index";
import type { ValuesOf } from "@/types";

const appRequest = createAppRequest("/captcha");
export const getLoginCaptcha = () => appRequest.get<null, Resp<Base64URLString>>("/login");

export const getCaptcha = (way: ValuesOf<typeof CaptchaWay>) => {
  switch (way) {
    case CaptchaWay.LOGIN:
      return getLoginCaptcha();
    default:
      return Promise.reject("暂不支持");
  }
};
