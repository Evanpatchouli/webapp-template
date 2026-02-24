'use strict';

const ADMIN_USER_ID = "000000000000000000000000";

// common/src/constants/roles.ts
const ROLES = {
    SUPER_ADMIN: 'SUPER_ADMIN',
    DEV_ADMIN: 'DEV_ADMIN',
    OPS_ADMIN: 'OPS_ADMIN',
    CONTENT_ADMIN: 'CONTENT_ADMIN',
    OPERATOR: 'OPERATOR',
    VIP_USER: 'VIP_USER',
    NORMAL_USER: 'NORMAL_USER',
    GUEST: 'GUEST',
};
const ROLE_METADATA = {
    [ROLES.SUPER_ADMIN]: {
        label: '超级管理员',
        description: '系统最高权限',
        color: '#ff4d4f',
        level: 0,
    },
    [ROLES.DEV_ADMIN]: {
        label: '开发管理员',
        description: '负责系统开发',
        color: '#1890ff',
        level: 1,
    },
    [ROLES.OPS_ADMIN]: {
        label: '运维管理员',
        description: '负责数据运维',
        color: '#52c41a',
        level: 1,
    },
    [ROLES.CONTENT_ADMIN]: {
        label: '内容主管',
        description: '负责内容策略',
        color: '#faad14',
        level: 1,
    },
    [ROLES.OPERATOR]: {
        label: '运营专员',
        description: '日常运营操作',
        color: '#722ed1',
        level: 2,
    },
    [ROLES.VIP_USER]: {
        label: 'VIP用户',
        description: '高级会员',
        color: '#eb2f96',
        level: 10,
    },
    [ROLES.NORMAL_USER]: {
        label: '普通用户',
        description: '注册用户',
        color: '#666666',
        level: 11,
    },
    [ROLES.GUEST]: {
        label: '游客',
        description: '未登录用户',
        color: '#bfbfbf',
        level: 12,
    },
};

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

exports.ADMIN_USER_ID = ADMIN_USER_ID;
exports.ROLES = ROLES;
exports.ROLE_METADATA = ROLE_METADATA;
exports.sleep = sleep;
//# sourceMappingURL=index.js.map
