# Nexus Auth 外部身份预绑定运维

## 数据与服务契约

`external_identities` 保存 `issuer`、`sub`、ObjectId 类型的 `local_user_id`，以及 `linked_by`、`link_method`、`linked_at`、`created_at`、`last_login_at`。三个时间字段使用 BSON Date，未登录时 `last_login_at=null`。身份键按原值保存，不 trim、不改大小写；集合及两个唯一索引 `(issuer, sub)`、`(issuer, local_user_id)` 使用 `{locale: "simple"}`。

`IdentityService` 注入 User Model、ExternalIdentity Model、UserRoleService；由认证模块注册。`resolve(issuer, sub)` 返回 `{id, username, nickname, email, roles, permissions, identityId, authVersion}`，其中 `authVersion` 来自 `user.auth_version ?? 0`。未绑定为 403 `account_not_linked`，本地用户不存在、禁用、软删除为 401 `account_unavailable`。仅成功解析登录时更新身份的 `last_login_at`。不接收中心管理员声明、不通过邮箱/用户名/openid 合并、不创建用户、不修改原用户及角色。

Guard 每次调用 `forSession(userId, identityId)`，同时匹配映射 `_id` 和 `local_user_id`，再次读取本地状态和 `getRoles(userId, {withPermission: true})`；只返回启用且未删除的角色/权限，去重并输出代码数组。错配或失效映射为 401 `invalid_session_identity`。数据库/RBAC 故障向上传递，由认证边界按服务不可用处理。`identityId`、`authVersion` 供 Session 内部使用，对外 me 响应应按主认证契约白名单输出。

主认证实现使用 `auth_sessions`，以 Session ID 的 SHA-256 为 `_id`，保存字符串 `userId`、`identityId`、`sealedToken`、`authVersion` 及 Date 类型的 `expiresAt`、`absoluteExpiresAt`。禁用/删除用户时递增 `users.auth_version`；Session 保存并校验登录时版本与当前 `authVersion`，防止账号重新启用后旧会话恢复。本轮仅启用 OIDC，不实现 legacy 回退；backchannel logout 未实现，仍待中心联调，不承诺中心退出/禁用立即撤销所有业务会话。

## 离线 CLI

使用现有依赖，在 `server` 目录执行：

```powershell
pnpm run auth:bind -- --file E:/secure/bindings.json
```

默认 dry-run：连接指定数据库只读检查用户及已有映射，不建集合/索引、不写数据库。该工具不访问 Nexus Auth；issuer/sub 必须经过可信渠道人工核实。JSON 文件必须是非空数组，每项严格只包含以下五个字段：

```json
[
  {
    "issuer": "https://issuer.example",
    "sub": "verified-subject",
    "local_user_id": "0123456789abcdef01234567",
    "linked_by": "operator-id/change-ticket",
    "link_method": "reviewed-prebinding"
  }
]
```

也可显式传参（不与 `--file` 混用）：

```powershell
pnpm run auth:bind -- --issuer https://issuer.example --sub verified-subject --local-user-id 0123456789abcdef01234567 --linked-by operator-id/change-ticket --link-method reviewed-prebinding
```

审核 dry-run 后，在同一命令末尾显式增加 `--apply` 才会写库。批次先完整检查冲突、缺失/禁用/删除用户，再建立两个唯一索引；建索引失败时不写入映射。每行写入前复查，使用 insert 而非覆盖/upsert，数据库唯一约束兜底并发。相同映射重复执行只报告 `already_linked`，保留原操作者、依据及时间。两种唯一键的冲突均拒绝，不迁移业务用户 ID 或角色。

工具通过 `src/config/env.ts` 延迟加载数据库配置 `DB_MONGO_CONNECTION`、`DB_MONGO_USERNAME`、`DB_MONGO_PASSWORD`；OIDC 模式无需 JWT 的配置由主认证实现提供。不要在 CLI 参数、清单或日志中加入密码、Token、Cookie、Secret、连接字符串；真实清单不得提交 Git。清单及 linked_by/link_method 应存放于受控目录，填写可追溯操作者和审批工单，勿填写秘密。

标准输出为逐行 JSON 审计，包含随机 runId、模式、时间、清单行号、映射 SHA-256 指纹及结果；不输出原始 issuer/sub、本地账号或数据库异常。将输出保存到受限审计存储，并关联审批记录及清单版本；失败通过标准错误输出固定分类码及已知行号，退出码为 1。成功记录的操作者/依据随映射原子持久化。运行环境配置加载器自己的输出也应遵守日志脱敏约定。

此批处理不是整批事务：预检后发生并发冲突、账号状态变化或数据库故障，可能已有部分行成功；按审计确认后可幂等重跑。它不修改/解除既有映射，不提供自动回滚。用户状态与插入不在跨集合事务内；并发禁用可能留下不可登录的映射，登录与每次 Session 复查仍拒绝该账号。变更/解除绑定需另行审批并撤销相关 Session；禁止直接修改同一身份记录的身份键后复用旧会话。

## 验证边界

`identity.service.spec.ts` 使用模型/集合 mock，覆盖准入、当前 RBAC、精确查询、Schema 索引声明、CLI 默认 dry-run、冲突、幂等及并发错误处理，不连接真实数据库。测试不替代独立测试数据库中的索引构建/并发插入验收，也不代表真实中心与 Session 登录联调通过。

```powershell
pnpm exec jest --runInBand src/auth/identity.service.spec.ts
```

完整 OIDC、Session、发布与回滚操作以 `docs/nexus-auth-migration-plan.md` 及当前 `server/src/auth` 实现为准；本节重点描述身份数据层和绑定工具。
