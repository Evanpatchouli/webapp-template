# Admin：React + TypeScript + Vite

## Nexus Auth 会话认证

前端通过同源 `/api/auth/*` 使用后端 BFF 会话，不保存或发送 Bearer Token。开发和部署需将 `/api` 代理到同一后端；浏览器不接触 OIDC Secret。

- `GET /api/auth/me`：成功 Resp 的 data 为 `{id,nickname,username,email,roles,permissions}`；401 表示匿名，其余失败显示可重试错误。
- `GET /api/auth/csrf`：成功 Resp 的 data 为 `{csrfToken}`。在 me 成功后重新获取，写请求发送 `X-CSRF-Token`；不自动重放失败写请求。
- 登录按钮顶层导航至 `GET /api/auth/login?returnTo=/#/...`，默认回到 `/#/dashboard`。后端仍须校验 returnTo。
- 回调错误 `/#/login?error=authentication_failed` 和 `account_not_linked` 显示固定提示，不回显任意错误参数。
- `POST /api/auth/logout`：只有成功 Resp 才清身份并停留 `/#/login?loggedOut=1`。失败保留状态、显示重试提示，不宣称成功。
- `POST /api/auth/logout/sso`：成功 Resp 的 data 为 `{url}`，确认本地退出后顶层导航到该地址；中心退出不保证其他应用本地会话同步撤销。

Resp 成功码沿用项目的 `SUCCESS`。内存状态为 loading/authenticated/anonymous/error，受保护内容只在 authenticated 时挂载。匿名深链接保留 returnTo 并进入登录页；退出页、回调失败页不自动发起 SSO。403 不清会话，服务故障不自动跳转中心。

启动精确删除旧 `app-login-store`，保留其他业务存储。跨标签通过 `app-session-change` 非敏感随机通知触发 me 校验，不传播身份或 CSRF；焦点/可见性恢复时也重新校验。请求去重与会话代次检查阻止过期响应覆盖新身份。

本地账号、手机、邮箱、扫码登录与注册组件、验证码 API、管理页密码重置入口已退出使用；角色、权限菜单及按钮逻辑保留。

验证：`pnpm --dir admin build`、`pnpm --dir admin exec playwright test`。真实 OIDC、Cookie、代理与多标签浏览器联调仍需后端及测试 Client。

## 模板开发说明

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
