# 交接记录

## 2026-08-28

- 已移除 `GlobalAuthTokenMiddleware` 及 `AppModule` 中的相关注册。
- 已在 `AuthGuard` 接入权限元数据校验，并保留原有默认放行策略。
- `@Permi`、`@PermiIn`、`@Permis` 已通过 JWT smoke check。
- ESLint、Prettier 和现有 Jest 测试通过。
- 完整构建仍被既有 `user.controller.ts:172` 的 `@Todo('FIX', ...)` 类型错误阻断。

## 2026-08-28：登出接口修复

- `/api/user/logout` 已添加 `@Auth()` 和 `@AuthUser()`，并移除错误的 `@Todo` 标注。
- 登出事件监听器已改用 `UserLogoutEvent`，事件处理方法已重命名。
- 管理端登出失败时也会清理本地会话并跳转登录页。
- 后端构建、Jest 和 ESLint 通过。
- 管理端构建仍受现有 `AuthButton`、未使用导入和 `types/user.ts` 缺失模块等问题阻断。
