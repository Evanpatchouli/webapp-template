import type { LoginStore } from "@/types/store";
import { create } from "zustand";

// 身份仅保存在内存，由 /auth/me 确认。
export const useLoginStore = create<LoginStore>(() => ({
  status: "loading",
  userInfo: null,
  error: null,
}));
