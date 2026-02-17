import { createHashRouter, Navigate, RouterProvider } from "react-router";
import Home from "@/views/home";
import LoginView from "@/views/login";
import Forbidden from "@/views/forbidden";
import { Suspense } from "react";
import { generateRoutes } from "./generator";
import { routeConfigs } from "./config";
import { Spin } from "antd";
import NotFound from "@/views/notfound";

const authorizedRoutes = generateRoutes(routeConfigs);

const router = createHashRouter([
  {
    path: "/login",
    Component: LoginView,
  },
  {
    path: "/403",
    Component: Forbidden,
  },
  {
    path: "/404",
    Component: NotFound,
  },
  {
    path: "/",
    element: <Home />,
    children: [
      {
        index: true, // 当访问父路由时
        element: <Navigate to="/dashboard" replace />,
      },
      ...authorizedRoutes,
      // 404 兜底
      {
        path: "*",
        element: <Navigate to="/404" replace />,
      },
    ],
  },
]);

// 带 Suspense 的路由提供者
export const RouterView = () => (
  <Suspense
    fallback={
      <div
        style={{
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Spin size="large" tip="页面加载中..." />
      </div>
    }
  >
    <RouterProvider router={router} />
  </Suspense>
);
