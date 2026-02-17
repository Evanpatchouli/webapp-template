export const Roles = {
  SUPER_ADMIN: {
    code: 'SUPER_ADMIN',
    name: '超级管理员',
    description: '系统最高权限管理员，拥有所有权限',
    is_system: true,
  },
  DEV_ADMIN: {
    code: 'DEV_ADMIN',
    name: '开发管理员',
    description: '负责系统开发和 API 管理的管理员',
    is_system: true,
  },
  OPS_ADMIN: {
    code: 'OPS_ADMIN',
    name: '运维管理员',
    description: '负责系统运维和数据管理的管理员',
    is_system: true,
  },
  CONTENT_ADMIN: {
    code: 'CONTENT_ADMIN',
    name: '内容管理员',
    description: '负责内容审核和管理的管理员',
    is_system: true,
  },
  VIP_USER: {
    code: 'VIP_USER',
    name: 'VIP用户',
    description: '高级会员用户，拥有更多功能',
    is_system: false,
  },
  NORMAL_USER: {
    code: 'NORMAL_USER',
    name: '普通用户',
    description: '普通注册用户',
    is_system: false,
  },
  GUEST: {
    code: 'GUEST',
    name: '游客',
    description: '未登录游客用户',
    is_system: false,
  },
};

export type RoleCodes = keyof typeof Roles;
