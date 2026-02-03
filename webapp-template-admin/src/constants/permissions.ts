// 权限类型枚举（对应后端 PermissionType）
export enum PermissionType {
  MENU = 1,    // 菜单
  BUTTON = 2,  // 按钮
  API = 3,     // 接口
  DATA = 4,    // 数据权限
}

// 角色编码常量（与后端 migrator/v1.ts 保持一致）
export const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',        // 超级管理员
  DEV_ADMIN: 'DEV_ADMIN',            // 开发管理员
  OPS_ADMIN: 'OPS_ADMIN',            // 运维管理员
  CONTENT_ADMIN: 'CONTENT_ADMIN',    // 内容管理员
  VIP_USER: 'VIP_USER',              // VIP用户
  NORMAL_USER: 'NORMAL_USER',        // 普通用户
  GUEST: 'GUEST',                    // 游客
} as const;

// 权限编码常量（与后端 migrator/v1.ts 保持一致）
export const PERMISSIONS = {
  // ========== 系统管理权限 ==========
  SYSTEM_MANAGE: 'SYSTEM_MANAGE',           // 系统管理模块
  USER_MANAGE: 'USER_MANAGE',               // 用户管理
  USER_LIST: 'USER_LIST',                   // 用户列表
  USER_DETAIL: 'USER_DETAIL',               // 用户详情
  USER_EDIT: 'USER_EDIT',                   // 编辑用户
  USER_DISABLE: 'USER_DISABLE',             // 禁用用户
  CONTENT_MANAGE: 'CONTENT_MANAGE',         // 内容管理
  CONTENT_AUDIT: 'CONTENT_AUDIT',           // 内容审核
  CONTENT_DELETE: 'CONTENT_DELETE',         // 删除内容

  // ========== 动态分享权限 ==========
  MOMENT_MANAGE: 'MOMENT_MANAGE',           // 动态管理
  MOMENT_POST: 'MOMENT_POST',               // 发布动态
  MOMENT_LIKE: 'MOMENT_LIKE',               // 点赞动态
  MOMENT_COMMENT: 'MOMENT_COMMENT',         // 评论动态
  MOMENT_SHARE: 'MOMENT_SHARE',             // 分享动态

  // ========== 应用数据管理权限 ==========
  DATA_MANAGE: 'DATA_MANAGE',               // 应用数据管理模块
  DATA_BACKUP: 'DATA_BACKUP',               // 数据备份
  BACKUP_EXECUTE: 'BACKUP_EXECUTE',         // 执行备份
  BACKUP_DOWNLOAD: 'BACKUP_DOWNLOAD',       // 下载备份
  BACKUP_DELETE: 'BACKUP_DELETE',           // 删除备份
  DATA_CLEAN: 'DATA_CLEAN',                 // 数据清理
  CLEAN_EXECUTE: 'CLEAN_EXECUTE',           // 执行清理
  CLEAN_PREVIEW: 'CLEAN_PREVIEW',           // 预览清理
  DATA_STATISTICS: 'DATA_STATISTICS',       // 数据统计
  STATS_VIEW: 'STATS_VIEW',                 // 查看统计
  STATS_EXPORT: 'STATS_EXPORT',             // 导出统计

  // ========== 系统监控权限 ==========
  SYSTEM_MONITOR: 'SYSTEM_MONITOR',         // 系统监控
  MONITOR_SERVER: 'MONITOR_SERVER',         // 服务器监控
  MONITOR_DATABASE: 'MONITOR_DATABASE',     // 数据库监控
  MONITOR_LOG: 'MONITOR_LOG',               // 日志监控

  // ========== API管理权限 ==========
  API_MANAGE: 'API_MANAGE',                 // API管理
  API_DOC: 'API_DOC',                       // API文档
  API_TEST: 'API_TEST',                     // API测试
  API_DEBUG: 'API_DEBUG',                   // API调试

  // ========== API接口权限 ==========
  API_MOMENT_CREATE: 'API_MOMENT_CREATE',   // 创建动态API
  API_USER_LIST: 'API_USER_LIST',           // 用户列表API
  API_DATA_BACKUP: 'API_DATA_BACKUP',       // 数据备份API
  API_DATA_CLEAN: 'API_DATA_CLEAN',         // 数据清理API
  API_STATS_GET: 'API_STATS_GET',           // 获取统计API
  API_MONITOR_GET: 'API_MONITOR_GET',       // 获取监控API
} as const;

export type RoleCode = typeof ROLES[keyof typeof ROLES];
export type PermissionCode = typeof PERMISSIONS[keyof typeof PERMISSIONS];

// 权限标签分类（用于分组显示）
export const PERMISSION_TAGS = {
  SYSTEM: 'system',       // 系统管理
  USER: 'user',           // 用户管理
  CONTENT: 'content',     // 内容管理
  MOMENT: 'moment',       // 动态管理
  DATA: 'data',           // 数据管理
  API: 'api',             // API管理
} as const;

// 角色权限映射（参考后端定义，用于前端展示）
export const ROLE_PERMISSIONS_MAP = {
  [ROLES.SUPER_ADMIN]: '拥有所有权限',
  [ROLES.DEV_ADMIN]: '系统开发和API管理',
  [ROLES.OPS_ADMIN]: '系统运维和数据管理',
  [ROLES.CONTENT_ADMIN]: '内容审核和管理',
  [ROLES.VIP_USER]: '高级会员功能',
  [ROLES.NORMAL_USER]: '普通用户功能',
  [ROLES.GUEST]: '游客浏览功能',
} as const;
