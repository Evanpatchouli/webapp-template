// router/config.tsx
import { lazy, type ComponentType } from "react";
import { ROLES, PERMISSIONS, type RoleCode, type PermissionCode } from "@/constants/permissions";

// 路由配置接口
export interface RouteConfig {
  path: string;
  label: string;
  icon?: string;
  component: ComponentType;
  permission?: PermissionCode;      // 所需权限编码
  roles?: RoleCode | RoleCode[];         // 允许的角色（可选）
  hideInMenu?: boolean;     // 是否在菜单中隐藏
  children?: RouteConfig[];
}

// 权限路由映射表（与后端权限树对应）
export const routeConfigs: RouteConfig[] = [
  // ========== 仪表盘（公开）==========
  {
    path: "/dashboard",
    label: "仪表盘",
    icon: "dashboard",
    component: lazy(() => import("@/views/dashboard")),
  },

  // ========== 系统管理模块 ==========
  {
    path: "/system",
    label: "系统管理",
    icon: "setting",
    component: lazy(() => import("@/views/system/layout")), // Layout 组件
    permission: PERMISSIONS.SYSTEM,
    children: [
      {
        path: "/system/user",
        label: "用户管理",
        icon: "user",
        component: lazy(() => import("@/views/system/user")),
        permission: PERMISSIONS.SYSTEM_USER,
      },
      {
        path: "/system/role",
        label: "角色管理",
        icon: "team",
        component: lazy(() => import("@/views/system/role")),
        permission: PERMISSIONS.SYSTEM_ROLE,
      },
    ],
  },

  // ========== 内容管理模块 ==========
  // {
  //   path: "/content",
  //   label: "内容管理",
  //   icon: "file-text",
  //   component: lazy(() => import("@/views/content/layout")),
  //   permission: PERMISSIONS.CONTENT,
  //   children: [
  //     {
  //       path: "/content/moment",
  //       label: "动态管理",
  //       icon: "camera",
  //       component: lazy(() => import("@/views/content/moment")),
  //       permission: PERMISSIONS.CONTENT_MOMENT,
  //     },
  //   ],
  // },

  // // ========== 数据管理模块 ==========
  // {
  //   path: "/data",
  //   label: "数据管理",
  //   icon: "database",
  //   component: lazy(() => import("@/views/data/layout")),
  //   permission: PERMISSIONS.DATA,
  //   children: [
  //     {
  //       path: "/data/statistics",
  //       label: "数据统计",
  //       icon: "bar-chart",
  //       component: lazy(() => import("@/views/data/statistics")),
  //       permission: PERMISSIONS.DATA_STATISTICS,
  //     },
  //     {
  //       path: "/data/backup",
  //       label: "数据备份",
  //       icon: "cloud-upload",
  //       component: lazy(() => import("@/views/data/backup")),
  //       permission: PERMISSIONS.DATA_BACKUP,
  //       roles: [ROLES.SUPER_ADMIN, ROLES.OPS_ADMIN], // 仅运维可见
  //     },
  //     {
  //       path: "/data/clean",
  //       label: "数据清理",
  //       icon: "delete",
  //       component: lazy(() => import("@/views/data/clean")),
  //       permission: PERMISSIONS.DATA_CLEAN,
  //       roles: [ROLES.SUPER_ADMIN, ROLES.OPS_ADMIN],
  //     },
  //   ],
  // },

  // // ========== 系统监控模块 ==========
  // {
  //   path: "/monitor",
  //   label: "系统监控",
  //   icon: "dashboard",
  //   component: lazy(() => import("@/views/monitor/layout")),
  //   permission: PERMISSIONS.MONITOR,
  //   children: [
  //     {
  //       path: "/monitor/server",
  //       label: "服务器监控",
  //       component: lazy(() => import("@/views/monitor/server")),
  //       permission: PERMISSIONS.MONITOR_SERVER,
  //     },
  //     {
  //       path: "/monitor/database",
  //       label: "数据库监控",
  //       component: lazy(() => import("@/views/monitor/database")),
  //       permission: PERMISSIONS.MONITOR_DATABASE,
  //     },
  //     {
  //       path: "/monitor/log",
  //       label: "日志监控",
  //       component: lazy(() => import("@/views/monitor/log")),
  //       permission: PERMISSIONS.MONITOR_LOG,
  //     },
  //   ],
  // },

  // // ========== API管理（开发用）==========
  // {
  //   path: "/api-manage",
  //   label: "API管理",
  //   icon: "api",
  //   component: lazy(() => import("@/views/api-manage")),
  //   permission: PERMISSIONS.API_MANAGE,
  //   roles: [ROLES.SUPER_ADMIN, ROLES.DEV_ADMIN], // 仅开发可见
  // },

  // ========== 权限演示（开发调试用，生产环境可删除）==========
  {
    path: "/permission-demo",
    label: "权限演示",
    icon: "experiment",
    component: lazy(() => import("@/views/permission-demo")),
    hideInMenu: true, // 不在菜单显示，直接访问
  },
];