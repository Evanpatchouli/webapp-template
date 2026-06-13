# 项目核心信息

> 本文档记录项目的核心架构、技术栈和重要决策

## 📋 项目概览

**项目名称**: 萌宠空间 (Cute Pet Space)
**项目类型**: TypeScript 全栈 Monorepo
**开发阶段**: 开发中
**最后更新**: 2026-02-01

---

## 🏗️ 技术栈

### 后端 (cute-pet-space-server)
- **框架**: NestJS 11.0.1
- **数据库**: MongoDB + Mongoose 9.1.5
- **认证**: JWT + express-session
- **日志**: log4js 6.9.1
- **验证码**: svg-captcha 1.4.0

### 前端 (cute-pet-space-admin)
- **框架**: React 19.2.0
- **构建**: Vite 7.2.5
- **路由**: React Router 7.13.0
- **状态**: Zustand 5.0.10
- **UI**: Ant Design 6.2.2
- **HTTP**: Axios 1.13.4

---

## 📁 项目结构

```
webapp-template/
├── server/    # NestJS 后端
│   ├── src/
│   │   ├── modules/          # 功能模块
│   │   ├── auth/             # 认证系统
│   │   ├── common/           # 公共工具
│   │   └── migrator/         # 数据迁移
│   └── dist/
│
├── admin/     # React 前端
│   ├── src/
│   │   ├── views/            # 页面组件
│   │   ├── components/       # 公共组件
│   │   ├── auth/             # 认证状态
│   │   ├── api/              # API 集成
│   │   └── router/           # 路由配置
│   └── dist/
│
├── common/    # 前后端共享代码
|
├── migrator/  # 数据迁移脚本
│
└── .agents/                  # Agent 记忆系统
    ├── INTERACTION_GUIDE.md
    ├── project-context.md
    └── daily-logs/
```

---

## 🔑 核心功能模块

### 1. 权限系统 (RBAC)
**状态**: ✅ 已完成
**位置**:
- 后端: `src/modules/{role,permission,user}-module/`
- 前端: `src/auth/`, `src/components/Auth*.tsx`

**角色定义** (7个):
- SUPER_ADMIN - 超级管理员
- DEV_ADMIN - 开发管理员
- OPS_ADMIN - 运维管理员
- CONTENT_ADMIN - 内容管理员
- VIP_USER - VIP用户
- NORMAL_USER - 普通用户
- GUEST - 游客

**权限数量**: 70+ 个权限编码

**关键文件**:
- `server/src/migrator/v1.ts` - 权限数据定义
- `admin/src/constants/permissions.ts` - 前端权限常量
- `admin/src/auth/permission.ts` - 权限检查逻辑

### 2. 用户认证
**状态**: ✅ 已完成
**认证方式**: JWT Token
**存储**: localStorage (Zustand persist)

### 3. 后端模块
- user-module - 用户管理
- role-module - 角色管理
- permission-module - 权限管理
- captcha-module - 验证码
- opt-module - OTP 一次性密码

---

## 🎯 重要架构决策

### 决策 1: 前后端权限同步
**日期**: 2026-02-01
**决策**: 前端权限常量与后端 `migrator/v1.ts` 完全同步
**原因**: 确保权限编码一致性，避免前后端不匹配
**影响**: 后端修改权限时需同步更新前端常量

### 决策 2: 使用 Flexbox 布局
**日期**: 2026-02-01
**决策**: 主布局使用 Flexbox 替代 calc() 计算高度
**原因**: 更优雅、自适应、易维护
**实现**: `minHeight: 100vh` + `maxHeight: 100vh` + `flex: 1`

---

## 📝 待办事项

- [ ] 后端运行 migrator 初始化权限数据
- [ ] 完善用户管理页面
- [ ] 添加宠物管理功能
- [ ] 添加动态分享功能

---

**最后更新**: 2026-02-01
