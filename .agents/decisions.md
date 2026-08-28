# 架构决策记录

## 2026-08-28：统一后端鉴权入口

- 后端统一使用 `AuthGuard` 作为认证与角色/权限授权入口。
- `GlobalAuthTokenMiddleware` 已移除，避免全局 token 校验与 Guard 重复执行，并保留公开接口能力。
- `AuthGuard` 继续保持无认证元数据时默认放行的行为。
- 新增 `@Permi`、`@PermiIn`、`@Permis`，分别表示单个权限、任一权限、全部权限。
