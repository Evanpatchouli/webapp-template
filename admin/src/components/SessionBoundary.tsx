import type { ReactNode } from "react";
import { Button, Result, Spin } from "antd";
import { Navigate, useLocation } from "react-router";
import { useLoginStore } from "@/auth/store";
import { refreshSession } from "@/auth/session";

export default function SessionBoundary({ children }: { children: ReactNode }) {
  const status = useLoginStore((state) => state.status);
  const location = useLocation();
  if (status === "loading") return <div style={{ padding: 80, textAlign: "center" }}><Spin description="正在确认登录状态"><div style={{ height: 80 }} /></Spin></div>;
  if (status === "error") return <Result status="warning" title="无法确认登录状态" subTitle="认证服务暂时不可用，请重试。" extra={<Button onClick={() => void refreshSession()}>重试</Button>} />;
  if (status === "anonymous") {
    const returnTo = `/#${location.pathname}${location.search}`;
    return <Navigate to={`/login?${new URLSearchParams({ returnTo })}`} replace />;
  }
  return children;
}
