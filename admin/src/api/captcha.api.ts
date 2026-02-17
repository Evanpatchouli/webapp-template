import type Resp from "@/models/Resp";
import { createAppRequest } from "./request";
import { CaptchaWay } from "../constants/index";
import type { ValuesOf } from "@/types";

const appRequest = createAppRequest("/captcha");
export const getLoginCaptcha = (): Promise<Resp<Base64URLString>> =>
  appRequest.get("/login");

export const getCaptcha = (way: ValuesOf<typeof CaptchaWay>) => {
  switch (way) {
    case CaptchaWay.LOGIN:
      return getLoginCaptcha();
    default:
      return Promise.reject("暂不支持");
  }
};
