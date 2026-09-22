import { SUCCESS_CODE, StoreNames } from "@/constants";
import type UserInfo from "@/types/userinfo";
import { useLoginStore } from "./store";

const SYNC_KEY = "app-session-change";
let generation = 0;
let csrfToken: string | null = null;
let csrfRequest: Promise<string> | null = null;
let identityRequest: Promise<void> | null = null;
let logoutRequest: Promise<void> | null = null;

export class SessionError extends Error {
  status: number;
  constructor(message: string, status = 0) {
    super(message);
    this.status = status;
  }
}

async function authRequest<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`/api/auth/${path}`, {
      ...init,
      credentials: "include",
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
    });
  } catch {
    throw new SessionError("认证服务连接失败，请重试");
  }
  if (response.status === 401) throw new SessionError("会话已失效，请重新登录", 401);
  if (!response.ok) throw new SessionError("认证服务暂时不可用，请重试", response.status);
  const body = await response.json();
  if (body.code !== SUCCESS_CODE) throw new SessionError("认证请求未成功，请重试", response.status);
  return body.data as T;
}

export function sessionGeneration() {
  return generation;
}

function invalidateRequests() {
  generation += 1;
  csrfToken = null;
  csrfRequest = null;
  identityRequest = null;
}

function announceChange() {
  try {
    // 只传重新校验通知，不传身份、权限或凭据。
    localStorage.setItem(SYNC_KEY, crypto.randomUUID());
  } catch { /* 禁用存储时由窗口聚焦校验兜底。 */ }
}

export function expireSession(expectedGeneration = generation) {
  if (expectedGeneration !== generation) return;
  const changed = useLoginStore.getState().status !== "anonymous";
  invalidateRequests();
  useLoginStore.setState({ status: "anonymous", userInfo: null, error: null });
  if (changed) announceChange();
}

export function getCsrfToken(): Promise<string> {
  if (csrfToken) return Promise.resolve(csrfToken);
  if (csrfRequest) return csrfRequest;
  const current = generation;
  const pending = authRequest<{ csrfToken: string }>("csrf").then((data) => {
    if (current !== generation) throw new SessionError("会话已变更，请重试");
    if (!data || typeof data.csrfToken !== "string" || !data.csrfToken) {
      throw new SessionError("无法取得安全校验信息，请重试");
    }
    csrfToken = data.csrfToken;
    return csrfToken;
  }).finally(() => {
    if (csrfRequest === pending) csrfRequest = null;
  });
  csrfRequest = pending;
  return pending;
}

export function refreshSession(notify = false): Promise<void> {
  if (logoutRequest) return logoutRequest;
  if (identityRequest) return identityRequest;
  invalidateRequests();
  const current = generation;
  useLoginStore.setState({ status: "loading", userInfo: null, error: null });
  const pending = (async () => {
    try {
      const userInfo = await authRequest<UserInfo>("me");
      if (current !== generation) return;
      if (!userInfo || typeof userInfo.id !== "string" ||
          !Array.isArray(userInfo.roles) || !userInfo.roles.every((role) => typeof role === "string") ||
          !Array.isArray(userInfo.permissions) || !userInfo.permissions.every((permission) => typeof permission === "string")) {
        throw new SessionError("身份信息格式异常，请重试");
      }
      // 每次重新确认 Session 都重新获取 CSRF，不复用登录前的值。
      await getCsrfToken();
      if (current !== generation) return;
      useLoginStore.setState({ status: "authenticated", userInfo, error: null });
      if (notify) announceChange();
    } catch (error) {
      if (current !== generation) return;
      if (error instanceof SessionError && error.status === 401) {
        useLoginStore.setState({ status: "anonymous", userInfo: null, error: null });
      } else {
        useLoginStore.setState({ status: "error", userInfo: null, error: "无法确认登录状态，请重试" });
      }
    } finally {
      if (current === generation) identityRequest = null;
    }
  })();
  identityRequest = pending;
  return pending;
}

export function safeReturnTo(value: string | null | undefined): string {
  if (!value || !value.startsWith("/#/") || /[\\\r\n]/.test(value)) return "/#/dashboard";
  try {
    const decoded = decodeURIComponent(value);
    const pathname = decoded.slice(2).split("?")[0];
    if (/[\\\r\n%#]/.test(decoded.slice(2)) || pathname.startsWith("//") ||
        ["/login", "/logout", "/403", "/404"].includes(pathname.replace(/\/$/, ""))) return "/#/dashboard";
    return value;
  } catch {
    return "/#/dashboard";
  }
}

export function startLogin(returnTo?: string | null) {
  window.location.assign(`/api/auth/login?${new URLSearchParams({ returnTo: safeReturnTo(returnTo) })}`);
}

export function logoutSession(sso = false): Promise<void> {
  if (logoutRequest) return logoutRequest;
  const pending = (async () => {
    const current = generation;
    const csrf = await getCsrfToken();
    if (current !== generation) throw new SessionError("会话已变更，请重试退出");
    let data: { url: string } | null;
    try {
      data = await authRequest<{ url: string } | null>(sso ? "logout/sso" : "logout", {
        method: "POST",
        headers: { "X-CSRF-Token": csrf },
      });
    } catch (error) {
      // SSO logout destroys the local session before contacting the provider.
      // Reflect that fact locally even when the provider endpoint is unavailable.
      if (sso && error instanceof SessionError && error.status >= 500) {
        expireSession();
        window.location.hash = "/login?loggedOut=1&centerLogout=failed";
      }
      throw error;
    }
    // 只有成功 Resp 才宣告退出；SSO 后续失败也不恢复本地身份。
    expireSession();
    window.location.hash = "/login?loggedOut=1";
    if (sso) {
      let url: URL;
      try {
        url = new URL(data?.url ?? "");
        if (url.protocol !== "https:") throw new Error();
      } catch {
        throw new SessionError("当前应用已退出，但中心退出地址无效，中心退出未确认");
      }
      window.location.assign(url.href);
    }
  })().finally(() => {
    logoutRequest = null;
  });
  logoutRequest = pending;
  return pending;
}

export function initializeSession() {
  try { localStorage.removeItem(StoreNames.LOGIN); } catch { /* 不影响 Cookie 会话校验。 */ }
  const onStorage = (event: StorageEvent) => {
    if (event.key !== SYNC_KEY) return;
    invalidateRequests();
    void refreshSession();
  };
  const onFocus = () => { if (!logoutRequest) void refreshSession(); };
  const onVisible = () => {
    if (document.visibilityState === "visible") onFocus();
  };
  window.addEventListener("storage", onStorage);
  window.addEventListener("focus", onFocus);
  window.addEventListener("pageshow", onFocus);
  document.addEventListener("visibilitychange", onVisible);
  void refreshSession(true);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener("focus", onFocus);
    window.removeEventListener("pageshow", onFocus);
    document.removeEventListener("visibilitychange", onVisible);
  };
}
