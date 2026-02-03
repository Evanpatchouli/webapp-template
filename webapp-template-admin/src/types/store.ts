import type { Nullable } from ".";
import type UserInfo from "./userinfo";

export interface LoginStore {
  isLogin: boolean;
  setIsLogin: (isLogin: boolean) => void;
  token: string;
  setToken: (token: string) => void;
  userInfo: Nullable<UserInfo>;
  setUserInfo: (userInfo: Nullable<UserInfo>) => void;
  logout: () => void;
}
