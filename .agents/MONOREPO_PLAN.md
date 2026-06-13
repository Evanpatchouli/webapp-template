# Monorepo 架构迁移方案

> 本文档记录标准的 Monorepo 架构设计，供将来项目重构时参考

## 📋 当前状态

**实施日期**: 2026-02-01
**当前方案**: Migrator 作为 Server 的一部分独立运行
**原因**: 首次尝试 Monorepo，schemas 依赖 NestJS 装饰器

---

## 🎯 标准 Monorepo 架构（目标）

### 推荐结构

```
cute-pet-space/
├── packages/
│   ├── database/              # 共享数据库模块 ✨
│   │   ├── src/
│   │   │   ├── schemas/       # Mongoose Schemas
│   │   │   │   ├── user.schema.ts
│   │   │   │   ├── role.schema.ts
│   │   │   │   └── permission.schema.ts
│   │   │   ├── models/        # Model 导出
│   │   │   │   └── index.ts
│   │   │   ├── types/         # TypeScript 类型定义
│   │   │   └── index.ts       # 统一导出
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── server/                # 后端服务
│   │   ├── src/
│   │   │   ├── modules/       # 业务模块
│   │   │   ├── auth/          # 认证系统
│   │   │   └── main.ts
│   │   └── package.json
│   │       └── dependencies:
│   │           └── "@cute-pet-space/database": "workspace:*"
│   │
│   ├── admin/                 # 前端管理
│   │   ├── src/
│   │   └── package.json
│   │
│   └── migrator/              # 数据迁移工具 ✨
│       ├── src/
│       │   ├── migrations/
│       │   │   ├── v1.ts
│       │   │   └── v2.ts
│       │   └── index.ts
│       ├── package.json
│       │   └── dependencies:
│       │       └── "@cute-pet-space/database": "workspace:*"
│       └── tsconfig.json
│
├── package.json               # 根 package.json
├── pnpm-workspace.yaml        # pnpm workspace 配置
└── tsconfig.base.json         # 基础 TS 配置
```

---

## 📦 核心配置文件

### 1. pnpm-workspace.yaml

```yaml
packages:
  - 'packages/*'
```

### 2. 根 package.json

```json
{
  "name": "cute-pet-space",
  "private": true,
  "workspaces": [
    "packages/*"
  ],
  "scripts": {
    "build": "pnpm -r build",
    "dev": "pnpm -r --parallel dev",
    "migrate": "pnpm --filter @cute-pet-space/migrator start"
  },
  "devDependencies": {
    "typescript": "^5.7.3"
  }
}
```

### 3. tsconfig.base.json

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  }
}
```

---

## 🔧 Database 包设计

### package.json

```json
{
  "name": "@cute-pet-space/database",
  "version": "1.0.0",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch"
  },
  "dependencies": {
    "mongoose": "^9.1.5"
  },
  "devDependencies": {
    "typescript": "^5.7.3"
  }
}
```

### 目录结构

```
packages/database/
├── src/
│   ├── schemas/
│   │   ├── user.schema.ts      # 纯 Mongoose Schema
│   │   ├── role.schema.ts
│   │   └── permission.schema.ts
│   ├── types/
│   │   ├── user.types.ts       # TypeScript 接口
│   │   ├── role.types.ts
│   │   └── permission.types.ts
│   ├── models/
│   │   └── index.ts            # Model 导出
│   └── index.ts                # 统一导出
├── dist/                       # 编译输出
├── package.json
└── tsconfig.json
```

---

## 🔄 Schema 重构方案

### 问题：NestJS 装饰器依赖

当前 schemas 使用 `@nestjs/mongoose` 装饰器：

```typescript
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema()
export class User {
  @Prop({ required: true })
  name: string;
}
```

### 解决方案：分离定义

**方案 A: 纯 Mongoose Schema（推荐）**

```typescript
// packages/database/src/schemas/user.schema.ts
import { Schema, model } from 'mongoose';

const userSchema = new Schema({
  openid: {
    type: String,
    required: [true, 'openid不能为空'],
    unique: true,
    trim: true,
    maxlength: [100, 'openid长度不能超过100个字符'],
  },
  phone: {
    type: String,
    unique: true,
    sparse: true,
    trim: true,
    match: [/^1[3-9]\d{9}$/, '请输入正确的手机号码'],
  },
  // ... 其他字段
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    currentTime: () => Math.floor(Date.now() / 1000),
  },
  collection: 'users',
});

// 索引
userSchema.index({ status: 1 });
userSchema.index({ deleted_at: 1 });

// 静态方法
userSchema.statics.findByOpenid = function(openid: string) {
  return this.findOne({ openid, deleted_at: null });
};

export const UserSchema = userSchema;
export const UserModel = model('User', userSchema);
```

**方案 B: TypeScript 接口 + Schema 分离**

```typescript
// packages/database/src/types/user.types.ts
export interface IUser {
  openid: string;
  phone?: string;
  username?: string;
  nickname?: string;
  status: number;
  role_ids: string[];
  // ...
}

// packages/database/src/schemas/user.schema.ts
import { Schema } from 'mongoose';
import type { IUser } from '../types/user.types';

export const UserSchema = new Schema<IUser>({
  // ... schema 定义
});
```

---

## 📝 迁移步骤

### 阶段 1: 准备工作

1. ✅ 创建 `packages/` 目录结构
2. ✅ 配置 `pnpm-workspace.yaml`
3. ✅ 创建 `tsconfig.base.json`

### 阶段 2: 创建 database 包

1. ✅ 创建 `packages/database/`
2. ✅ 重写 schemas（去除 NestJS 装饰器）
3. ✅ 添加 TypeScript 类型定义
4. ✅ 构建并测试

### 阶段 3: 迁移 server

1. ✅ 移动到 `packages/server/`
2. ✅ 添加 database 包依赖
3. ✅ 更新 import 路径
4. ✅ 测试功能正常

### 阶段 4: 独立 migrator

1. ✅ 创建 `packages/migrator/`
2. ✅ 移动迁移脚本
3. ✅ 添加 database 包依赖
4. ✅ 测试迁移功能

### 阶段 5: 迁移 admin

1. ✅ 移动到 `packages/admin/`
2. ✅ 更新配置
3. ✅ 测试构建

---

## 💡 使用 pnpm workspace

### 安装依赖

```bash
# 根目录安装所有依赖
pnpm install

# 为特定包安装依赖
pnpm --filter @cute-pet-space/server add express

# 添加 workspace 依赖
pnpm --filter @cute-pet-space/server add @cute-pet-space/database@workspace:*
```

### 运行命令

```bash
# 所有包并行运行 dev
pnpm -r --parallel dev

# 运行特定包
pnpm --filter @cute-pet-space/server dev

# 构建所有包
pnpm -r build
```

---

## ⚠️ 注意事项

### 1. 依赖管理

- 共享依赖放在根 `package.json`
- 特定依赖放在各包的 `package.json`
- 使用 `workspace:*` 引用内部包

### 2. TypeScript 配置

- 各包继承 `tsconfig.base.json`
- 使用 `references` 配置包依赖关系

### 3. 构建顺序

- database 包必须先构建
- server 和 migrator 依赖 database
- 使用 `pnpm -r build` 自动处理顺序

---

## 📚 参考资源

- [pnpm workspace 文档](https://pnpm.io/workspaces)
- [TypeScript Project References](https://www.typescriptlang.org/docs/handbook/project-references.html)
- [Mongoose Schema 文档](https://mongoosejs.com/docs/guide.html)

---

**创建日期**: 2026-02-01
**预计实施**: 待定（项目稳定后）
**优先级**: 中等
