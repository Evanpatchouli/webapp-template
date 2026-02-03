export const APP_NAME = "模板项目";
export const SYSTEM_NAME = "后台管理系统";

export const CaptchaWay = {
  REGISTER: "captcha::register",
  LOGIN: "captcha::login",
  FORGET_PASSWORD: "captcha::forgetPassword",
  CHANGE_PASSWORD: "captcha::changePassword",
} as const;

export const StoreNames = {
  LOGIN: "app-login-store",
} as const;
