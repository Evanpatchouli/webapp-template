import { createHashRouter, Navigate, RouterProvider } from "react-router";
import Home from "@/views/home";
import LoginView from "@/views/login";
import RoleView from "@/views/role";
import Forbidden from "@/views/forbidden";
import PermissionDemo from "@/views/permission-demo";
import AuthRoute from "@/components/AuthRoute";
import { PERMISSIONS } from "@/constants/permissions";
import { lazy } from "react";
import UserManageView from "@/views/user-manage";

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
    path: "/",
    element: <Home />,
    children: [
      {
        index: true, // 当访问父路由时
        element: <Navigate to="/dashboard" replace />,
      },
      {
        path: "/dashboard",
        Component: lazy(() => import("@/views/dashboard")),
      },
      {
        path: "/role",
        element: (
          <AuthRoute permission={PERMISSIONS.SYSTEM_MANAGE}>
            <RoleView />
          </AuthRoute>
        ),
      },
      {
        path: "/user-manage",
        element: (
          <AuthRoute permission={PERMISSIONS.SYSTEM_MANAGE}>
            <UserManageView />
          </AuthRoute>
        ),
      },
      {
        path: "/permission-demo",
        Component: PermissionDemo,
      },
    ],
  },
]);

export const RouterView = () => <RouterProvider router={router} />;
