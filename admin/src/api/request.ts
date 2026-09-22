import Resp from "@/models/Resp";
import { message } from "antd";
import axios, { type InternalAxiosRequestConfig } from "axios";
import { joinURL, withLeadingSlash, withoutTrailingSlash } from "ufo";
import { expireSession, getCsrfToken, sessionGeneration, SessionError } from "@/auth/session";

export interface ApiError {
  code: number | string;
  message: string;
  status?: number;
}

const requestGenerations = new WeakMap<InternalAxiosRequestConfig, number>();

export const createAppRequest = (subpath = "") => {
  const instance = axios.create({
    baseURL: withoutTrailingSlash(withLeadingSlash(joinURL(import.meta.env.VITE_APP_API_BASE_URL || "/api", subpath))),
    timeout: 10000,
    withCredentials: true,
  });
  instance.interceptors.request.use(async (config) => {
    const current = sessionGeneration();
    requestGenerations.set(config, current);
    config.headers.delete("Authorization");
    if (!["get", "head", "options"].includes((config.method || "get").toLowerCase())) {
      try {
        config.headers.set("X-CSRF-Token", await getCsrfToken());
      } catch (error) {
        if (error instanceof SessionError && error.status === 401) expireSession(current);
        throw error;
      }
      if (current !== sessionGeneration()) throw new SessionError("会话已变更，请重试");
    }
    return config;
  });
  instance.interceptors.response.use(
    // Axios 的返回类型由现有 API 函数以 Promise<Resp<T>> 声明。
    // @ts-expect-error 响应包装替代 AxiosResponse
    (response) => {
      const current = requestGenerations.get(response.config);
      if (current !== sessionGeneration()) throw new SessionError("会话已变更，请重试");
      const { code, message: text, data } = response.data;
      return new Resp(code, text, data);
    },
    (error: unknown) => {
      if (!axios.isAxiosError(error)) return Promise.reject(error);
      const status = error.response?.status ?? 0;
      const apiError: ApiError = {
        code: status,
        status,
        message: status === 401 ? "会话已失效，请重新登录" :
          status === 403 ? "没有权限或安全校验失败，请刷新后重试" :
          status >= 500 ? "服务暂时不可用，请稍后重试" :
          status === 0 ? "网络错误，请重试" : "请求失败，请重试",
      };
      if (status === 401) {
        expireSession(error.config ? requestGenerations.get(error.config) : -1);
      } else {
        message.error(apiError.message);
      }
      // 不传播 Axios config/response，避免日志泄漏 Cookie、CSRF 或敏感响应。
      return Promise.reject(apiError);
    },
  );
  return instance;
};

export const appRequest = createAppRequest();
