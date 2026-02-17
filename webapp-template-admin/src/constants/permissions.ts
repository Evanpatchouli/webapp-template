// =====================================================
// 1. 权限类型枚举（对应后端 PermissionType）
// =====================================================
export enum PermissionType {
  MENU = 1,    // 菜单（一级导航/页面）
  BUTTON = 2,  // 按钮（页面内操作）
  API = 3,     // 接口（后端API访问）
  DATA = 4,    // 数据权限（数据范围控制）
}

// =====================================================
// 2. 角色编码常量（新增 OPERATOR）
// =====================================================
export const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',        // 超级管理员（全部权限）
  DEV_ADMIN: 'DEV_ADMIN',            // 开发管理员（技术+监控）
  OPS_ADMIN: 'OPS_ADMIN',            // 运维管理员（数据+备份）
  CONTENT_ADMIN: 'CONTENT_ADMIN',    // 内容主管（内容策略+删除）
  OPERATOR: 'OPERATOR',              // ★ 运营专员（新增：日常运营）
  VIP_USER: 'VIP_USER',              // VIP用户（C端高级）
  NORMAL_USER: 'NORMAL_USER',        // 普通用户（C端标准）
  GUEST: 'GUEST',                    // 游客（C端受限）
} as const;

// =====================================================
// 3. 权限编码常量（树形结构，与后端 migrator/v1.ts 保持一致）
// =====================================================
export const PERMISSIONS = {
  // ========== 系统管理模块 ==========
  SYSTEM: 'SYSTEM',                           // 系统管理（一级菜单）
  SYSTEM_USER: 'SYSTEM_USER',                 // 用户管理（页面）
  SYSTEM_USER_VIEW: 'SYSTEM_USER_VIEW',       // 查看用户（按钮）
  SYSTEM_USER_EDIT: 'SYSTEM_USER_EDIT',       // 编辑用户（按钮）
  SYSTEM_USER_DISABLE: 'SYSTEM_USER_DISABLE', // 禁用用户（按钮）
  SYSTEM_ROLE: 'SYSTEM_ROLE',                 // 角色管理（页面）
  SYSTEM_ROLE_VIEW: 'SYSTEM_ROLE_VIEW',       // 查看角色（按钮）
  SYSTEM_ROLE_EDIT: 'SYSTEM_ROLE_EDIT',       // 编辑角色（按钮）

  // 系统管理 API
  API_SYSTEM_USER_LIST: 'API_SYSTEM_USER_LIST',       // 查询用户列表
  API_SYSTEM_USER_DETAIL: 'API_SYSTEM_USER_DETAIL',   // 查询用户详情
  API_SYSTEM_USER_UPDATE: 'API_SYSTEM_USER_UPDATE',   // 更新用户
  API_SYSTEM_USER_DISABLE: 'API_SYSTEM_USER_DISABLE', // 禁用用户

  // ========== 内容管理模块 ==========
  CONTENT: 'CONTENT',                           // 内容管理（一级菜单）
  CONTENT_MOMENT: 'CONTENT_MOMENT',             // 动态管理（页面）
  CONTENT_MOMENT_VIEW: 'CONTENT_MOMENT_VIEW',   // 查看动态（按钮）
  CONTENT_MOMENT_AUDIT: 'CONTENT_MOMENT_AUDIT', // 审核动态（按钮）
  CONTENT_MOMENT_EDIT: 'CONTENT_MOMENT_EDIT',   // 编辑动态（按钮）
  CONTENT_MOMENT_DELETE: 'CONTENT_MOMENT_DELETE', // 删除动态（按钮-高危）

  // 内容管理 API
  API_CONTENT_MOMENT_LIST: 'API_CONTENT_MOMENT_LIST',     // 查询动态列表
  API_CONTENT_MOMENT_AUDIT: 'API_CONTENT_MOMENT_AUDIT',   // 审核动态
  API_CONTENT_MOMENT_UPDATE: 'API_CONTENT_MOMENT_UPDATE', // 更新动态
  API_CONTENT_MOMENT_DELETE: 'API_CONTENT_MOMENT_DELETE', // 删除动态

  // ========== 数据管理模块 ==========
  DATA: 'DATA',                                 // 数据管理（一级菜单）
  DATA_STATISTICS: 'DATA_STATISTICS',           // 数据统计（页面）
  DATA_STATISTICS_VIEW: 'DATA_STATISTICS_VIEW', // 查看统计（按钮）
  DATA_STATISTICS_EXPORT: 'DATA_STATISTICS_EXPORT', // 导出统计（按钮）
  DATA_BACKUP: 'DATA_BACKUP',                   // 数据备份（页面）
  DATA_BACKUP_VIEW: 'DATA_BACKUP_VIEW',         // 查看备份（按钮）
  DATA_BACKUP_EXECUTE: 'DATA_BACKUP_EXECUTE',   // 执行备份（按钮）
  DATA_CLEAN: 'DATA_CLEAN',                     // 数据清理（页面）
  DATA_CLEAN_VIEW: 'DATA_CLEAN_VIEW',           // 查看清理（按钮）
  DATA_CLEAN_EXECUTE: 'DATA_CLEAN_EXECUTE',     // 执行清理（按钮）

  // 数据管理 API
  API_DATA_BACKUP: 'API_DATA_BACKUP',   // 数据备份接口
  API_DATA_CLEAN: 'API_DATA_CLEAN',     // 数据清理接口
  API_STATS_GET: 'API_STATS_GET',       // 获取统计数据

  // ========== 系统监控模块 ==========
  MONITOR: 'MONITOR',                     // 系统监控（一级菜单）
  MONITOR_SERVER: 'MONITOR_SERVER',       // 服务器监控（页面）
  MONITOR_DATABASE: 'MONITOR_DATABASE',   // 数据库监控（页面）
  MONITOR_LOG: 'MONITOR_LOG',             // 日志监控（页面）

  // 监控 API
  API_MONITOR_GET: 'API_MONITOR_GET',     // 获取监控数据

  // ========== API 管理模块（开发用）==========
  API_MANAGE: 'API_MANAGE',               // API管理（独立页面）

  // ========== 应用端权限（C端用户）==========
  APP_MOMENT: 'APP_MOMENT',               // 动态功能（模块）
  APP_MOMENT_CREATE: 'APP_MOMENT_CREATE', // 发布动态
  APP_MOMENT_LIKE: 'APP_MOMENT_LIKE',     // 点赞动态
  APP_MOMENT_COMMENT: 'APP_MOMENT_COMMENT', // 评论动态
  APP_MOMENT_SHARE: 'APP_MOMENT_SHARE',   // 分享动态

  // C端 API
  API_APP_MOMENT_CREATE: 'API_APP_MOMENT_CREATE', // 创建动态接口
} as const;

// =====================================================
// 4. 类型导出
// =====================================================
export type RoleCode = typeof ROLES[keyof typeof ROLES];
export type PermissionCode = typeof PERMISSIONS[keyof typeof PERMISSIONS];

// =====================================================
// 5. 权限标签分类（用于前端分组显示）
// =====================================================
export const PERMISSION_TAGS = {
  SYSTEM: 'system',       // 系统管理
  USER: 'user',           // 用户管理
  ROLE: 'role',           // 角色管理
  CONTENT: 'content',     // 内容管理
  DATA: 'data',           // 数据管理
  MONITOR: 'monitor',     // 系统监控
  API: 'api',             // API管理
  APP: 'app',             // 应用端（C端）
} as const;

// =====================================================
// 6. 角色权限映射（用于前端展示和权限说明）
// =====================================================
export const ROLE_PERMISSIONS_MAP = {
  [ROLES.SUPER_ADMIN]: {
    label: '超级管理员',
    description: '系统最高权限，拥有所有权限',
    scope: '全部模块',
    color: '#ff4d4f', // 红色
  },
  [ROLES.DEV_ADMIN]: {
    label: '开发管理员',
    description: '负责系统开发、API管理和监控',
    scope: '系统管理、API管理、监控查看',
    color: '#1890ff', // 蓝色
  },
  [ROLES.OPS_ADMIN]: {
    label: '运维管理员',
    description: '负责数据备份、清理和系统监控',
    scope: '数据管理、系统监控、内容查看',
    color: '#52c41a', // 绿色
  },
  [ROLES.CONTENT_ADMIN]: {
    label: '内容主管',
    description: '负责内容策略、审核管理和违规处理',
    scope: '内容管理（含删除）、用户查看、数据统计',
    color: '#faad14', // 橙色
  },
  [ROLES.OPERATOR]: {
    label: '运营专员',
    description: '负责日常内容审核、用户服务和数据查看',
    scope: '内容审核/编辑、用户查看、数据统计（仅查看）',
    color: '#722ed1', // 紫色
  },
  [ROLES.VIP_USER]: {
    label: 'VIP用户',
    description: '高级会员用户，拥有完整C端功能',
    scope: '发布、点赞、评论、分享',
    color: '#eb2f96', // 粉色
  },
  [ROLES.NORMAL_USER]: {
    label: '普通用户',
    description: '普通注册用户',
    scope: '发布、点赞、评论',
    color: '#666666', // 灰色
  },
  [ROLES.GUEST]: {
    label: '游客',
    description: '未登录用户',
    scope: '仅浏览和点赞',
    color: '#bfbfbf', // 浅灰
  },
} as const;

// =====================================================
// 7. 角色层级关系（用于权限继承判断，可选）
// =====================================================
export const ROLE_HIERARCHY = [
  ROLES.SUPER_ADMIN,    // 0级：最高
  ROLES.DEV_ADMIN,      // 1级
  ROLES.OPS_ADMIN,      // 1级
  ROLES.CONTENT_ADMIN,  // 1级
  ROLES.OPERATOR,       // 2级：基层管理
  ROLES.VIP_USER,       // 3级：C端高级
  ROLES.NORMAL_USER,    // 3级：C端普通
  ROLES.GUEST,          // 4级：最低
] as const;

// =====================================================
// 8. 权限分组配置（用于权限分配界面）
// =====================================================
export const PERMISSION_GROUPS = [
  {
    key: 'system',
    label: '系统管理',
    icon: 'setting',
    permissions: [
      PERMISSIONS.SYSTEM,
      PERMISSIONS.SYSTEM_USER,
      PERMISSIONS.SYSTEM_USER_VIEW,
      PERMISSIONS.SYSTEM_USER_EDIT,
      PERMISSIONS.SYSTEM_USER_DISABLE,
      PERMISSIONS.SYSTEM_ROLE,
      PERMISSIONS.SYSTEM_ROLE_VIEW,
      PERMISSIONS.SYSTEM_ROLE_EDIT,
    ],
  },
  {
    key: 'content',
    label: '内容管理',
    icon: 'file-text',
    permissions: [
      PERMISSIONS.CONTENT,
      PERMISSIONS.CONTENT_MOMENT,
      PERMISSIONS.CONTENT_MOMENT_VIEW,
      PERMISSIONS.CONTENT_MOMENT_AUDIT,
      PERMISSIONS.CONTENT_MOMENT_EDIT,
      PERMISSIONS.CONTENT_MOMENT_DELETE,
    ],
  },
  {
    key: 'data',
    label: '数据管理',
    icon: 'database',
    permissions: [
      PERMISSIONS.DATA,
      PERMISSIONS.DATA_STATISTICS,
      PERMISSIONS.DATA_STATISTICS_VIEW,
      PERMISSIONS.DATA_STATISTICS_EXPORT,
      PERMISSIONS.DATA_BACKUP,
      PERMISSIONS.DATA_BACKUP_VIEW,
      PERMISSIONS.DATA_BACKUP_EXECUTE,
      PERMISSIONS.DATA_CLEAN,
      PERMISSIONS.DATA_CLEAN_VIEW,
      PERMISSIONS.DATA_CLEAN_EXECUTE,
    ],
  },
  {
    key: 'monitor',
    label: '系统监控',
    icon: 'dashboard',
    permissions: [
      PERMISSIONS.MONITOR,
      PERMISSIONS.MONITOR_SERVER,
      PERMISSIONS.MONITOR_DATABASE,
      PERMISSIONS.MONITOR_LOG,
    ],
  },
  {
    key: 'api',
    label: 'API管理',
    icon: 'api',
    permissions: [
      PERMISSIONS.API_MANAGE,
    ],
  },
  {
    key: 'app',
    label: '应用端功能',
    icon: 'mobile',
    permissions: [
      PERMISSIONS.APP_MOMENT,
      PERMISSIONS.APP_MOMENT_CREATE,
      PERMISSIONS.APP_MOMENT_LIKE,
      PERMISSIONS.APP_MOMENT_COMMENT,
      PERMISSIONS.APP_MOMENT_SHARE,
    ],
  },
] as const;

// =====================================================
// 9. 工具函数
// =====================================================

/**
 * 判断是否为管理端角色
 */
export function isAdminRole(roleCode: RoleCode): boolean {
  return [
    ROLES.SUPER_ADMIN,
    ROLES.DEV_ADMIN,
    ROLES.OPS_ADMIN,
    ROLES.CONTENT_ADMIN,
    ROLES.OPERATOR,
  ].includes(roleCode as any);
}

/**
 * 判断是否为C端角色
 */
export function isAppRole(roleCode: RoleCode): boolean {
  return [ROLES.VIP_USER, ROLES.NORMAL_USER, ROLES.GUEST].includes(roleCode as any);
}

/**
 * 获取角色的权限范围描述
 */
export function getRoleScope(roleCode: RoleCode): string {
  return ROLE_PERMISSIONS_MAP[roleCode]?.scope || '未知';
}

/**
 * 检查角色是否有删除权限（用于前端按钮显示控制）
 */
export function canDelete(roleCode: RoleCode): boolean {
  return [ROLES.SUPER_ADMIN, ROLES.CONTENT_ADMIN, ROLES.OPS_ADMIN].includes(roleCode as any);
}

/**
 * 检查角色是否有编辑权限
 */
export function canEdit(roleCode: RoleCode): boolean {
  return [
    ROLES.SUPER_ADMIN,
    ROLES.CONTENT_ADMIN,
    ROLES.OPERATOR, // 运营专员可以编辑
    ROLES.DEV_ADMIN,
  ].includes(roleCode as any);
}

/**
 * 检查角色是否有审核权限
 */
export function canAudit(roleCode: RoleCode): boolean {
  return [
    ROLES.SUPER_ADMIN,
    ROLES.CONTENT_ADMIN,
    ROLES.OPERATOR, // 运营专员可以审核
  ].includes(roleCode as any);
}