import type { Nullable } from "@webapp-template/common";
import type UserInfo from "./userinfo";

export interface LoginStore {
  status: "loading" | "authenticated" | "anonymous" | "error";
  userInfo: Nullable<UserInfo>;
  error: string | null;
}
