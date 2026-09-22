# 接入 Nexus Auth 认证替代自主认证的迁移实施方案

## 1. 范围与基线

- 编写日期：2026-09-22。
- 工作分支：`codex/migrate-nexus-auth-oidc`，通过 `git fetch origin main` 后从 `origin/main` 新建。
- 基线提交：`a6b158331a55a3c474f5ef7657522547b7d5f2c2`，提交标题：`fix(auth): 移除全局鉴权中间件并修复登出流程`；调查时本地 main、origin/main 与分支 HEAD 一致。
- 方案编写当时只新增了本文档；当前分支已按本文方案落地认证代码、迁移脚本、前端会话改造和测试。Casdoor Application 注册、真实身份绑定清单、生产 Secret/域名及真实中心端到端联调仍需部署阶段完成。
- 主要依据：已完整阅读的 `E:\nexus-auth\docs\application-integration.md`，以及下文列出的 main 实际代码。仓库中未找到 `AGENTS.md` 和 `docs/workflows/README.md`；沿用任务提供的用户级规范。
- 历史 `.agents/project-context.md` 仍包含旧项目名称，因此技术判断以代码、包清单为准。未连接业务数据库，用户数量、存量数据质量及生产拓扑尚未核实。

目标是将密码、验证码登录和身份认证交给 Nexus Auth；保留现有 MongoDB 本地用户 ID、业务角色、资源权限、数据归属和登录审计。推荐 NestJS 作为 Confidential OIDC Client / BFF，浏览器只持有本地业务 Session Cookie。

当前实现状态：已完成 P1-P3 的代码骨架和主要安全边界，包括 OIDC Discovery/Code+PKCE、后端业务 Session、`(issuer, sub)` 映射、旧认证入口退出、CSRF/CORS/Cookie 配置、前端 me 初始化和登出语义；P0/P4-P6 的 Client 注册、真实账号预绑定、生产切换、后通道登出和真实中心联调仍是部署工作。

## 2. 现有认证盘点

| 领域 | main 中的证据 | 迁移影响 |
| --- | --- | --- |
| 技术栈 | `server/package.json`：NestJS 11、Mongoose 9、jsonwebtoken、express-session；`admin/package.json`：React 19、Vite、Axios、Zustand；根 README 要求 Node 24+ | 已有服务端，优先后端交换 Code；无需把 OIDC Token 下发 SPA |
| 登录和注册 | `server/src/modules/user-module/user.controller.ts` 暴露 `/api/user/login?type=...`、`/login/account`、`/login/openid`、`/login/phone`、`/login/email`、`/register/account`（后五项均在 `/api/user` 下） | 切换时必须同时关闭总入口和各分入口，不能只替换登录页面 |
| 密码处理 | `user.model.ts::findByUsernameAndPassword` 直接按 username、password 查询；`user.schema.ts` 含 password；`user.service.manage.ts` 写入固定重置密码 | 不能将其描述为已采用密码哈希认证；禁止迁移旧密码到中心，应采用中心激活/重设凭据 |
| 注册数据 | `user.model.ts::create` 实际构造字段未包含传入的 password/email | 不能假定每个旧账号都具有可用密码或完整邮箱，须对实际数据做只读盘点 |
| 旧 openid | Controller 直接接收请求体 openid，调用 `user.service.login.ts::useOpenid` 查询或建用户后签 Token；该路径未见上游身份凭证验证 | 它是旧微信标识字段，不是 OIDC `sub`；禁止复用此入口完成 Nexus Auth 登录或绑定 |
| Token 链路 | `user-module/utils/index.ts` → `auth/jwt.ts`：先签 HS256 JWT（7 天），再生成 UUID v7 登录令牌，将 UUID → JWT 存入缓存，缓存 TTL 为 JWT TTL + 24 小时 | 浏览器拿到的是 UUID 而非 JWT；迁移要同时退出两层凭据体系 |
| 缓存 | `server/src/cache/index.ts`：进程 Map，周期写入工作目录 `cache.json`，启动恢复 | 不是多实例共享 Session Store；旧令牌失效要防止重启从文件恢复；不能整体清空混合缓存 |
| 鉴权 | `app.module.ts` 注册 `AuthProvider` 全局 Guard；`auth.guard.ts` 校验 Bearer UUID，再校验缓存 JWT，将用户写入 `req.meta.user`；角色/权限来自 JWT 快照 | 保留装饰器和 RBAC 语义，改为 Session 解析本地用户，并查当前状态与权限 |
| 默认公开 | Guard 无认证/角色/权限注解时默认公开；`RequestMetaMiddleware` 现在仅写请求元数据 | 不能误写为旧全局鉴权中间件仍生效；需枚举所有业务路由并显式保护，公开入口单列 |
| 现有 Session | `main.ts` 注册 express-session，硬编码 secret 为 `my-secret`，未设共享 Store、安全 Cookie 和 TTL；`app.config.ts` 虽有 Session 配置但未接入此处 | 现有用途主要为图形验证码；需要升级为正式业务会话，而非直接沿用默认配置 |
| 配置和代理 | `config/env.ts` 强制 JWT_SECRET、SESSION_SECRET；main 全局 `/api` 前缀，CORS 默认 `*` 且 credentials=true；Vite 代理 `/api` 到 `VITE_APP_API_TARGET_URL` | 新增 OIDC 配置校验，凭据 CORS 改精确 Origin；保持代理外部路径一致 |
| 前端状态 | `admin/src/auth/store.ts` 将 token、isLogin、userInfo 持久化到 localStorage；`App.tsx` 收到登录事件写入；`api/request.ts` 自动发 Bearer，已有 withCredentials | 移除 Token 存储和注入；启动时向后端恢复 Session，不信任本地 isLogin |
| 路由 | `admin/src/router/index.tsx` 使用 createHashRouter；`auth/permission.ts`、权限组件和路由生成器消费 roles/permissions | Callback 必须是服务端真实路径，不能登记 `/#/callback`；业务 hash 路由可保留 |
| 登出 | `/api/user/logout` 有 `@Auth()`；服务端删除当前 UUID 缓存并发事件；`hooks/useLogout.ts` finally 清本地状态并跳登录页 | 当前是单令牌本地退出；Cookie 模式网络失败时仅清 UI 不足以证明服务端已退出 |
| 账号与 RBAC | users 的 `_id`、role_ids、status、deleted_at；Role/Permission 集合；`user.service.role.ts` 加载业务权限 | 保留 `_id` 和关联；中心 isAdmin 等声明不直接赋予本地管理员权限 |
| 引导与审计 | `migrator/index.ts` 注册 v1/v2；v1 创建默认管理员并打印凭据；`events/user.login.event.listener.ts` 记录登录事件 | 保留本地管理员 ID/权限，但先安全绑定中心身份；新部署停止默认密码认证与打印 |
| 日志风险 | `request.meta.token.middleware.ts` trace 记录 originalUrl；OPT 服务打印验证码；前端请求错误含 Axios config | OIDC Callback 引入前完成 URL/请求/异常脱敏，避免 Code、Token、Cookie、Secret 泄漏 |
| 测试 | `server/src/app.controller.spec.ts`、`server/test/app.e2e-spec.ts` 主要为 Hello World；未发现认证专用测试 | 需要新增真实认证边界测试，不能把现有测试通过视为迁移验收 |

账号注册、手机/邮箱登录可能自动建用户并赋普通角色，需逐个替换其身份来源。旧用户详情直接返回 User 的路径也需用白名单 DTO 检查，避免把 password 或后续外部身份敏感字段返回浏览器。

## 3. 目标 OIDC 架构

推荐同源部署：浏览器访问业务站点，站点 `/api` 反向代理 NestJS；Nexus Auth 位于独立域名。业务后端持 Client Secret 并执行 Authorization Code + PKCE S256，SPA 不直接交换 Code。

标准登录顺序：

1. SPA 启动请求 `GET /api/auth/me`。有效 Session 返回本地用户与当前 roles/permissions；无 Session 返回 401。
2. 用户进入受保护页面时，由前端顶层导航至 `GET /api/auth/login`。登录页可显示“使用 Nexus Auth 登录”；用户主动退出后的页面不自动再次跳 SSO。
3. 后端通过 Discovery 初始化成熟 OIDC SDK，使用 SDK 生成 state、nonce、PKCE verifier/challenge，并将短期登录事务绑定到浏览器预登录会话。应用负责事务存储、超时及原子消费，不自行实现协议算法。
4. 浏览器跳转中心 authorization_endpoint；请求仅使用 code、openid profile email、PKCE S256、nonce/state 和预登记 redirect_uri。
5. 中心以 query 回调 `GET /api/auth/callback`。后端检查浏览器绑定、state、事务时限、单次使用，再由 SDK 交换 Code 并校验签名/JWKS、精确 issuer、audience（必要时 azp）、nonce、exp 等。PKCE verifier 仅在后端参与交换。
6. 如调用 UserInfo，使用后端 Access Token，并校验其 sub 等于已验证 ID Token 的 sub；不信任前端上传的 profile/sub。
7. 用 `(issuer, sub)` 找到本地用户，拒绝未批准绑定、禁用或删除用户，加载本地权限。映射和准入成功后 regenerate Session ID，保存成功后再重定向。
8. 返回预先允许的业务页面（可为 `/#/dashboard`），不在 URL 中附带 Token、用户信息或授权码。前端再请求 me 恢复状态。Callback 响应设置 no-store，并控制 Referrer-Policy。

`returnTo` 只接受允许的本站内部路由；拒绝绝对外站 URL、协议相对 URL 和编码绕过。不能按来访 Host 或任意查询参数生成 redirect_uri。多标签页应支持多个独立短期事务，避免共享单一 state 相互覆盖；Code/事务重放必须失败。

SDK 候选为 [openid-client 官方实现](https://github.com/panva/openid-client)，提供 Discovery、Code Flow 和 PKCE 工具。实施第一阶段先验证版本、Node 24、现有 NodeNext 编译及实际产物加载方式，锁定版本到 pnpm-lock；不在本方案承诺未经验证的具体 API 或为接入扩大为全仓模块迁移。

## 4. Casdoor Application 与在线能力

2026-09-22 使用本机 HTTPS 请求成功读取 [在线 Discovery](https://auth.evanpatchouli.space/.well-known/openid-configuration)，issuer 精确等于 `https://auth.evanpatchouli.space`。它声明 code、authorization_code、query、openid/profile/email、PKCE S256、JWKS、end_session_endpoint、backchannel_logout_supported=true 及 backchannel_logout_session_supported=true。这些是服务能力声明，不证明业务 Client 已注册或端到端联调完成。

Discovery 同时列出其他 grant，不代表本应用允许使用。未列出 token_endpoint_auth_methods_supported，且 claims_supported 未列出 nonce/email_verified/name/preferred_username；实际 Token 声明、nonce 回传以及 Confidential Client 认证方式必须联调，不能降低校验来适配。

| 配置 | 提议/要求 |
| --- | --- |
| Application | 每个业务应用独立 Client；建议 `webapp-template-admin-prod`、`webapp-template-admin-staging`、`webapp-template-admin-dev` 分环境隔离；名称待平台确认 |
| Organization / Type | `built-in` 或明确业务组织；OIDC，Confidential Client |
| Grant / PKCE | Authorization Code，强制 S256；不启用密码模式、Implicit 或把共享 demo Client 用于生产 |
| Scope | 首期仅 `openid profile email`；不申请 phone/offline_access，除非后续明确业务需求 |
| Client 认证 | Secret 仅后端密钥管理注入；与平台确认支持的 token endpoint 认证方式并实测 |
| 生产 Callback | `https://<已确认业务域名>/api/auth/callback`，待真实域名确定后登记精确完整值，不带 fragment，不用通配符 |
| 测试/开发 Callback | 对应各环境 HTTPS 域名的同一路径；开发通过 HTTPS 反向代理/Vite 代理接入，不能把未配置的 localhost 例子当成已登记地址 |
| 登出回调 | `https://<已确认业务域名>/api/auth/logout/callback`，同样逐字符登记；后端完成 logout state 校验后跳业务退出页 |
| 后通道登出 | 如纳入实施，单独登记 `https://<业务域名>/api/auth/backchannel-logout` 并验证 logout_token 与本地会话索引 |

只固定可信 issuer、Client 参数和业务回调；授权、Token、UserInfo、JWKS、中心登出端点均由 Discovery 读取。启动校验 HTTPS 与 issuer；网络异常、未知签名密钥且无法刷新时安全失败，不能关闭 TLS 或绕过签名。Discovery/JWKS 缓存及轮换由 SDK 处理，设置网络超时与可观察的失败分类。

## 5. 后端、前端和配置改造清单

| 范围 | 实施内容 |
| --- | --- |
| 新增后端 auth 模块 | OIDC Client Provider、Controller、登录事务/Session 服务、外部身份映射服务；公开协议入口仍必须校验 state/nonce/签名等 |
| `main.ts` / `app.config.ts` / `config/env.ts` | 配置实际 Session Store、密钥、安全 Cookie、受信代理、精确 CORS；OIDC 模式不强制无用途的 JWT_SECRET；关闭旧入口时保留配置的明确模式校验 |
| `auth.guard.ts` / `auth.decorator.ts` / `types/access.ts` | 从 Session 获取 local_user_id，查有效本地用户和当前 RBAC；将 AuthTokenPayload 解耦为业务主体类型，保持 req.meta.user 与现有装饰器消费习惯 |
| Controller 覆盖 | 罗列所有路由；业务 Controller 显式 Auth，公开项逐条审核。是否全局改成默认拒绝需在接口清单评审后确定，不能漏掉默认公开的业务接口 |
| 用户服务/管理 | 新增身份绑定、解除/变更绑定审计和会话失效；保留状态、角色等本地管理；OIDC 模式停用本地密码重置/注册/登录与相关验证码发行 |
| 前端登录页/API | 替换账号、短信、邮箱、扫码入口为顶层跳转；取消自动注册本地凭据。中心的密码恢复、MFA 留在中心完成 |
| store/App/事件/类型 | 删除 token、setToken 和 ILoginResult.token 依赖；显式 loading/authenticated/anonymous 状态，me 确认前不展示受保护内容；一次性清除旧持久化登录项，不清其他业务存储 |
| Axios | 删除自动 Bearer 注入；保留 Cookie 携带；对写操作附带 CSRF Token；401 清身份并统一引导登录、避免并发跳转风暴；403 不重新登录；503 展示服务异常 |
| 前端权限与登出 | 保留本地 roles/permissions 的菜单/按钮逻辑；系统用户页移除本地重置密码动作；登出需确认后端销毁成功，网络失败提供重试，不能宣称已退出 |
| 审计与文档 | 新增 OIDC 登录类型、失败原因、映射和会话撤销审计；更新 server/admin README、admin auth README、部署配置示例；清理旧认证文档指引 |

拟议接口契约：

- `GET /api/auth/login`：开启受限短期登录事务并 302。
- `GET /api/auth/callback`：校验 OIDC 响应，成功建立 Session 后 302；失败进入不含敏感参数的错误页。
- `GET /api/auth/me`：返回 `{id, nickname, username, email, roles, permissions}` 的现有 Resp 包装；无会话为 401，数据库/Store 故障为 503；禁止返回任何 Token。
- `GET /api/auth/csrf`：为当前会话生成/取得 CSRF 防护材料，响应 no-store；前端只在内存保存。采用成熟 CSRF 中间件，不能把现有 X-Nonce 当成 CSRF Token。
- `POST /api/auth/logout`：带 CSRF，幂等销毁本地 Session；会话已不存在可成功，Store 撤销失败不得伪报成功。
- `POST /api/auth/logout/sso`：显式用户动作、带 CSRF；撤销本地 Session 后发起中心登出，前端按约定顶层导航。
- `GET /api/auth/logout/callback`：校验独立短期 logout state，再跳退出页；其事务不能随业务 Session 销毁而丢失。
- `POST /api/auth/backchannel-logout`：仅在该能力落地时启用；它不依赖 Cookie/浏览器 CSRF，而依赖 SDK 对 logout_token 的专门验证与重放防护。

新增配置建议：OIDC_ISSUER、OIDC_CLIENT_ID、OIDC_CLIENT_SECRET、OIDC_REDIRECT_URI、OIDC_POST_LOGOUT_REDIRECT_URI、APP_PUBLIC_ORIGIN、SESSION_SECRET、SESSION_IDLE_TTL、SESSION_ABSOLUTE_TTL、SESSION_STORE 配置及 AUTH_MODE。值由各环境注入，配置示例只放键和非秘密示例；前端不接触 Secret。AUTH_MODE 的 legacy/oidc 仅用于受控整体切换，不允许失败时自动降级。

## 6. 旧用户与本地账号映射

新增 `external_identities` 集合，推荐字段：issuer、sub、local_user_id（ObjectId）、created_at、last_login_at、linked_at、linked_by、link_method。role_ids 仍属于 users，不复制成另一套授权主表。

- 建立 `(issuer, sub)` 唯一复合索引，使用精确大小写语义；不 trim、改写或从显示名称推导 sub，不复用 users.openid 的 100 字符限制。
- 首期一个 issuer 下一个本地用户对应一个外部主体，增加 `(issuer, local_user_id)` 唯一索引防止无意多绑；多主体绑定作为未来明确需求处理。
- 用户删除后保留映射审计并拒绝登录，不能因为软删除查询不可见而自动再建用户。禁用用户和映射变更需撤销其会话。
- 唯一索引兜底并发；建用户/绑定优先用 MongoDB 事务（部署需具备支持条件）。若环境不支持，先采用预建用户+幂等绑定，不开启非原子的首次自动建用户。

存量迁移默认采用管理员审核预绑定：只读导出本地 ID、状态、角色、必要的辅助联系方式，平台提供经过可信渠道确认的 issuer/sub；形成受限访问的映射清单。先校验重复、冲突、缺失与禁用/删除用户，输出 dry-run 报告；批准后幂等写入并保留操作者及依据。不要把真实账号清单提交到 Git。

邮箱、用户名和旧微信 openid 只做人工辅助证据，不能自动合并。即使 email_verified=true，也不能单凭邮箱静默接管有业务数据或管理员权限的旧账号；本次 Discovery 未声明 email_verified，更不能假设它存在。自助绑定若后续需要，应同时验证可靠的旧账号控制权及一次新 OIDC 登录，并进行近期再认证；当前旧 openid 路径不具备该证明能力。

首期后台建议关闭任意中心用户自动入驻：未绑定主体进入“等待管理员开通”，不创建 Session 或提升权限。确认开放注册后才引入 JIT，赋予明确的最小业务角色，保留与存量账号冲突的人工处理路径。中心 isAdmin/isForbidden 等字段不能替代本地授权模型。

管理员先绑定到原有本地管理员 ID，并验证权限；至少准备两个独立已绑定管理主体。首个登录者不能自动成为管理员。新部署需调整引导方式以安全配置管理员映射，停止可用默认密码；不修改已执行的历史迁移来伪造迁移历史。

旧密码不导入 Casdoor。由中心负责新凭据激活、恢复和 MFA。用户名/邮箱展示字段可按显式优先级更新，但不覆盖本地角色、业务联系方式或业务归属；缺少 name/preferred_username 时允许使用已验证的 displayName 等展示回退，不影响稳定身份键。

## 7. Session / Token 边界与安全

| 对象 | 存放与用途 | 生命周期/失效 |
| --- | --- | --- |
| OIDC 登录事务 | 后端短期 Store，浏览器仅有绑定 Cookie | 建议 5 分钟、一次消费；失败/成功清除；允许有限并发事务 |
| ID Token | 后端验证身份；如中心登出需要，可加密保存供 id_token_hint 使用 | 不作业务 API 凭据、不放 localStorage；按保留策略随会话清理 |
| Access Token | 后端临时调用 UserInfo 或明确授权的上游 API | 首期无持续上游调用需求时使用后丢弃；绝不作为本地 API Bearer |
| Refresh Token | 首期不申请 offline_access、不设计静默长期刷新 | 有后续需求再加入加密持久化、轮换、撤销及重用检测 |
| 业务 Session | 浏览器只有框架生成的不可预测 opaque Session ID；后端保存 local_user_id、identity 引用、时间及撤销信息 | 建议闲置 30 分钟、绝对 8 小时（待产品确认）；每次请求检查逻辑过期，不只依赖数据库 TTL 清理 |
| 旧 UUID/JWT | 仅回滚隔离路径临时保留历史代码 | OIDC 模式一律拒绝，即使请求同时带合法 Cookie 和旧 Bearer，也不得借 Bearer 覆盖用户 |

本地 Session 是业务登录态，不是继续签发自定义 JWT 来替代 OIDC。ID Token 到期不自动等价于已建立业务 Session 到期；会话时限由上述策略约束，绝对到期后重走 OIDC。中心禁用/撤销未必立即传到所有业务会话，需明确传播方式及最坏窗口。

优先使用成熟 MongoDB Session Store 适配现有基础设施，或在已有 Redis 的部署采用成熟 Redis Store；两者选择在实施前确定。不得用现有 CustomCache 或 express-session 默认 MemoryStore 承载生产业务会话；多实例共享登录事务和会话，实例重启、Store 故障需实测。[express-session 官方说明](https://expressjs.com/en/resources/middleware/session/)明确默认 MemoryStore 不面向生产，并提供 Cookie、代理及 Store 配置约定。

Cookie 建议生产使用 `__Host-webapp-session`、HttpOnly、Secure、SameSite=Lax、Path=/、不设 Domain；通过可信反向代理明确 trust proxy 范围，禁止无条件信任任意 forwarded 头。query 顶层 GET Callback 配合 Lax；若改为 form_post，必须重新评估跨站 Cookie，不能直接照搬。

Cookie 鉴权使 CSRF 成为新增必要边界：所有业务写操作及登出使用成熟 CSRF 防护，校验 Origin/必要时 Referer，并维持精确 CORS 白名单；同源部署首选关闭不需要的跨域访问。跨站部署需独立评估 SameSite=None、第三方 Cookie 限制，作为拓扑待确认项。

每次受保护请求查询用户 status/deleted_at 与当前 RBAC，首期优先正确性而非权限缓存；以后缓存必须有失效机制。Store/数据库不可用时返回服务错误，不接受陈旧或未验证身份。日志仅保留 traceId、事件类别、本地用户 ID 和脱敏原因；屏蔽 Authorization、Cookie、Set-Cookie、Code、state、verifier、nonce、Secret 和完整 Token，包括代理/access log、Axios error.config 和 SDK 异常对象。

## 8. 登出语义

默认按钮为“退出当前应用”：后端销毁当前业务会话并按相同 Cookie 属性清 Cookie，前端确认后清内存状态并停留退出页；中心 SSO 保留，再点登录可能免密码。退出期间网络失败显示重试；已清前端数据但仍有 HttpOnly Cookie 的状态不能标记为登出成功。多标签页同步 UI 清理，其他设备会话默认不受影响。

“退出中心 SSO”作为显式选项：先读取所需 id_token_hint 和创建独立 logout 事务，再销毁本地 Session，按 Discovery 构造中心登出请求，传已登记 post_logout_redirect_uri 及 state。中心故障不恢复本地会话，提示本地退出已完成但中心退出未确认。

当前 Discovery 宣告后通道登出，但不能因此将按钮命名为保证性的“退出所有应用”。只有目标应用实际接入并通过联调后，才可承诺联动范围；否则文案明确其他应用本地会话可能仍存在。

若实施后通道登出：后端用成熟协议实现验证 logout_token 签名、issuer、audience、时效、events、sid/sub 及重放约束，以 `(issuer, sid)` 或 `(issuer, sub)` 索引撤销相应业务 Session；未知会话幂等响应。没有此机制时，中心退出或账号禁用对已存在本地会话的影响不能宣称立即生效，应按绝对 TTL 和已确认的再认证策略说明窗口。

## 9. 数据迁移、切换与回滚

采用加法迁移，不改 users._id、role_ids 或业务外键。按 `server/src/migrator/index.ts` 的现有注册机制新增版本；执行前核查 MigrationManager 的失败恢复/并发行为，不默认已有可靠 down 或数据库事务。首次迁移只建身份集合/唯一索引及必要会话结构，不删旧字段。

1. 只读盘点：用户总量、禁用/软删除量、重复/空联系方式、默认管理员、已绑定中心主体，以及调用旧登录 API 的其他客户端；先确认实际部署和数据库备份恢复能力。
2. 保存加密备份与发布制品，记录映射清单版本、批次、dry-run 结果和唯一约束检查。实际用户数据不进入方案/Git/公开日志。
3. 预绑定管理员和试点账号；处理冲突后再写入。映射写入可重入，同一映射重复执行无副作用，冲突拒绝而非覆盖；核对成功数/失败数/原 ID 与角色不变。
4. 测试环境先完成全链路。生产按明确发布批次切换 AUTH_MODE；同一业务入口和用户请求只有一个权威认证来源，不能 Cookie 失败再尝试旧 Bearer。
5. 原子协调前后端发布及网关路由；多实例必须统一模式，不将 OIDC/legacy 随机混在同一流量池。可用独立试点环境/流量池，不在同一会话双轨兜底。
6. OIDC 切换同时关闭旧登录、注册、重置密码、登录验证码接口和旧 Bearer 验证。停止旧实例写缓存后按 AUTH 命名空间精确失效旧令牌及其持久化副本；验证重启不复活，保留其他缓存业务数据。
7. 观察建议至少 7 天（跨旧 JWT 有效期），记录登录成功率、Callback/映射失败分类、401/403、Store 错误和登出失败。正式窗口、告警阈值由发布负责人确定；任何串号、越权或敏感凭据泄漏立即停止扩量。

回滚优先级：先回滚有缺陷的 OIDC 发布到上一可用 OIDC 版本；如首发无可用版本，暂停登录并修复。回滚到旧自主认证只作为经批准的应急路径，因为旧密码查询及 openid 入口存在已识别风险，不能因 Nexus Auth 临时不可用自动启用。

若批准 legacy 应急回滚：恢复匹配的前后端制品与模式，撤销新业务 Session、停止新绑定写入，保留已建立外部映射及审计；已作废旧 Token 不恢复，用户必须重新认证。OIDC 首期关闭 JIT，可降低新增无旧凭据账号的回滚缺口；若已开放 JIT，其用户应进入维护/人工支持状态，不自动分配默认密码。

不整库覆盖回滚，否则会丢失切换后的业务写入。错误映射需按批次审计纠正并撤销相关 Session；不得直接删除整个身份集合。回滚窗口结束后另行批准移除旧 password 字段、自签 Token 实现/JWT_SECRET、认证专用缓存逻辑及依赖，处理备份中的历史凭据保留期限。破坏性清理单独执行，清理后不再承诺可恢复旧认证。

## 10. 分阶段实施与交付门槛

| 阶段 | 工作/交付 | 进入下一阶段的条件 |
| --- | --- | --- |
| P0 方案与接入准备 | 确定域名、独立 Client、组织、Store、准入策略；只读数据/路由盘点；SDK 最小技术验证 | 关键待确认项落定，Client/HTTPS/nonce/交换方式实际可用 |
| P1 配置和数据基础 | OIDC 配置校验、共享 Store、安全 Cookie/CSRF、加法迁移、绑定 dry-run/审计工具、日志脱敏 | 唯一约束/并发/失败恢复验证；管理员映射预备完成 |
| P2 后端认证闭环 | login/callback/me、用户准入、Session Guard、本地登出；保留原角色装饰器 | Token 验证、会话撤销及 RBAC 回归通过，无新路径调用旧签发 |
| P3 前端与旧路径退出 | SSO 登录、me 初始化、Cookie 请求、401 处理、退出页、清旧存储、移除重置密码 UI | 刷新/深链接/多标签页/CSRF 验证通过，旧 API 在 OIDC 模式均拒绝 |
| P4 中心联调与试点 | 精确 Callback、中心登出；按范围接入 backchannel；旧用户试点和回滚演练 | 管理员/普通用户/禁用用户验收；范围明确的登出联动证据 |
| P5 生产切换观察 | 协调发布、旧凭据失效、指标及审计观察 | 无串号越权、错误率符合批准阈值、可执行回滚记录 |
| P6 清理与交接 | 审批后清理旧认证字段/代码/密钥；更新部署和运维文档 | 窗口结束、恢复演练完成、确认不再依赖 legacy |

各阶段分别形成可审查变更单元，不能把业务权限重构、界面重设计或其他历史问题修复混入本次迁移。

## 11. 测试验收

| 场景 | 必须证明的结果 |
| --- | --- |
| Discovery/Client | issuer 精确、独立 Client、S256、精确 Redirect URI；错误 Secret/回调地址安全失败；不跳过 TLS |
| 正常登录 | 中心登录 → 后端验证 → 同一 local_user_id → 安全 Session；刷新及深链接可恢复；浏览器无 Token |
| Callback 攻击 | 缺失/错误/过期 state、nonce 不符、PKCE 不符、重复 code、无绑定 Cookie、并发事务混用、用户拒绝授权均不建会话 |
| Token | 错误 issuer/aud/签名、过期 ID Token、未知 kid 与 JWKS 轮换、UserInfo sub 不符均有测试；轮换成功与网络失败路径分开验证 |
| 映射 | 同 sub 重复登录身份稳定；同邮箱不同 sub 不自动合并；issuer 不同不混淆；唯一约束/并发/重复批次可验证；旧 openid 不能冒充 |
| 准入/RBAC | 未绑定、禁用、删除用户拒绝；中心管理员不自动获本地管理员；保留角色/权限 AND/OR 语义；本地撤权下次请求生效 |
| 会话 | 登录前后 Session ID 改变；闲置/绝对过期、Store 故障、实例重启/跨实例、Cookie 属性正确；失效记录不因 TTL 清理延迟复活 |
| CSRF/代理 | 跨站写操作/登出拒绝；准确 CORS；恶意 Host/Forwarded/returnTo 无法外跳或污染回调；正常顶层 Callback 成功 |
| 登出 | 当前应用退出不终止其他 SSO；当前会话再请求 401；失败不伪报成功；中心失败仍保持本地退出；logout state 校验；后通道重放拒绝 |
| 旧路径关闭 | 总登录/各分登录/注册/验证码/密码重置全部按模式拒绝；旧 Bearer 不获权；Cookie 与旧 Bearer 冲突不改变主体；旧缓存重启不恢复 |
| 前端 | localStorage 旧 token 被清理；me 未完成不闪现权限内容；401 并发不循环跳转；退出页不自动 SSO；多标签同步 |
| 数据/回滚 | 业务 ID、角色和外键不变；备份可恢复；批次幂等；冲突不覆盖；回滚不丢业务增量、不恢复已撤销凭据 |
| 日志 | 在代理、服务端、浏览器和持久化输出中检查不含密码、Code、Secret、Token、Cookie、PKCE verifier |

实施时以 Jest 单元测试覆盖映射/Guard/错误分支，Supertest 配合 Cookie agent 与隔离测试数据库/模拟 OIDC Provider 覆盖完整会话，再用独立测试 Client 做真实浏览器联调。现有 e2e 直接 createNestApplication，未复用 main 中的 Session/全局前缀配置，新增测试应共享实际启动配置，避免测试环境跳过生产中间件。

运行与变更相关的 server 单测/e2e、server 构建和 admin TypeScript/Vite 构建；使用包级命令（如 `pnpm --dir server test -- --runInBand`、`pnpm --dir server test:e2e`、`pnpm --dir server build`、`pnpm --dir admin build`），验证实际脚本与依赖后执行。现有 server lint 带 --fix，验证时避免意外格式化无关文件。模拟通过不替代真实 Client 的登录、nonce 和登出联调。

## 12. 风险、待确认项与本轮验证

| 待确认项/风险 | 默认建议与影响 |
| --- | --- |
| 生产/测试域名及代理拓扑 | 首选同源 `/api`；未明确前无法给出可登记的真实 Redirect URI |
| Client、组织、Secret 和 Token endpoint 认证方式 | 平台管理员独立配置；必须证明 nonce 回传及 SDK 严格校验兼容 |
| 现有用户/其他 API 客户端 | 只读盘点后审核映射；若存在移动端/第三方直连 Bearer 客户端，需另列接入计划，不能假定本方案 Cookie 可直接覆盖 |
| Session Store 和 MongoDB 事务条件 | 首选已有 MongoDB 的成熟 Store；确认多实例、TTL、索引、备份和事务支持后锁定适配器 |
| 开通方式 | 后台默认人工预绑定，禁止任意中心账号 JIT；开放注册需要明确批准的最小角色 |
| Session 时限与中心禁用传播 | 暂议闲置 30 分钟/绝对 8 小时；要求即时中心撤销时必须追加可靠联动，不仅缩短 Token TTL |
| 中心登出范围 | 先保证本地退出；后通道能力需验证平台实际通知及所有目标应用支持，按钮不作超出证据的承诺 |
| 旧认证应急与清理 | 旧密码/openid 风险使 legacy 回滚不能自动化；清理窗口及账号恢复渠道由负责人确定 |
| 发布门槛与负责人 | 确认试点账号、观察窗口、告警阈值、平台/应用值守和回滚批准人，文档未虚构人员或 SLA |

本轮验证范围：已 fetch 核对 main 基线、新建指定分支、阅读接入指南与相关源码/配置、实测 HTTPS Discovery、核对官方 SDK/Session 文档，并检查新增 Markdown 的路径引用、UTF-8 无 BOM 和 Git 变更范围。本轮未安装依赖、启动业务服务、注册 Client、访问业务数据库或执行端到端认证；这些不能视为已经通过。本轮交付为方案评审稿，后续按 P0 待确认项收敛后再实施。
