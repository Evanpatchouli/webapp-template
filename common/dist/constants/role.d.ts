export declare const ROLES: {
    readonly SUPER_ADMIN: "SUPER_ADMIN";
    readonly DEV_ADMIN: "DEV_ADMIN";
    readonly OPS_ADMIN: "OPS_ADMIN";
    readonly CONTENT_ADMIN: "CONTENT_ADMIN";
    readonly OPERATOR: "OPERATOR";
    readonly VIP_USER: "VIP_USER";
    readonly NORMAL_USER: "NORMAL_USER";
    readonly GUEST: "GUEST";
};
export type RoleCode = typeof ROLES[keyof typeof ROLES];
export declare const ROLE_METADATA: {
    readonly SUPER_ADMIN: {
        readonly label: "超级管理员";
        readonly description: "系统最高权限";
        readonly color: "#ff4d4f";
        readonly level: 0;
    };
    readonly DEV_ADMIN: {
        readonly label: "开发管理员";
        readonly description: "负责系统开发";
        readonly color: "#1890ff";
        readonly level: 1;
    };
    readonly OPS_ADMIN: {
        readonly label: "运维管理员";
        readonly description: "负责数据运维";
        readonly color: "#52c41a";
        readonly level: 1;
    };
    readonly CONTENT_ADMIN: {
        readonly label: "内容主管";
        readonly description: "负责内容策略";
        readonly color: "#faad14";
        readonly level: 1;
    };
    readonly OPERATOR: {
        readonly label: "运营专员";
        readonly description: "日常运营操作";
        readonly color: "#722ed1";
        readonly level: 2;
    };
    readonly VIP_USER: {
        readonly label: "VIP用户";
        readonly description: "高级会员";
        readonly color: "#eb2f96";
        readonly level: 10;
    };
    readonly NORMAL_USER: {
        readonly label: "普通用户";
        readonly description: "注册用户";
        readonly color: "#666666";
        readonly level: 11;
    };
    readonly GUEST: {
        readonly label: "游客";
        readonly description: "未登录用户";
        readonly color: "#bfbfbf";
        readonly level: 12;
    };
};
//# sourceMappingURL=role.d.ts.map