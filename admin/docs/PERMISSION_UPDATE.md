# 权限系统更新总结

## 📋 更新内容

本次更新将前端权限常量与后端 `migrator/v1.ts` 中实际定义的角色和权限完全同步。

---

## 🔄 更新的文件

### 1. `src/constants/permissions.ts` ✅
**更新内容**: 完全同步后端定义的角色和权限

#### 角色定义（7个）
- `SUPER_ADMIN` - 超级管理员（拥有所有权限）
- `DEV_ADMIN` - 开发管理员（系统开发和API管理）
- `OPS_ADMIN` - 运维管理员（系统运维和数据管理）
- `CONTENT_ADMIN` - 内容管理员（内容审核和管理）
- `VIP_USER` - VIP用户（高级会员功能）
- `NORMAL_USER` - 普通用户（普通用户功能）
- `GUEST` - 游客（游客浏览功能）

#### 权限定义（按模块分类，共70+个）

**系统管理权限**
- SYSTEM_MANAGE, USER_MANAGE, USER_LIST, USER_DETAIL, USER_EDIT, USER_DISABLE
- CONTENT_MANAGE, CONTENT_AUDIT, CONTENT_DELETE

**动态分享权限**
- MOMENT_MANAGE, MOMENT_POST, MOMENT_LIKE, MOMENT_COMMENT, MOMENT_SHARE

**应用数据管理权限**
- DATA_MANAGE, DATA_BACKUP, BACKUP_EXECUTE, BACKUP_DOWNLOAD, BACKUP_DELETE
- DATA_CLEAN, CLEAN_EXECUTE, CLEAN_PREVIEW
- DATA_STATISTICS, STATS_VIEW, STATS_EXPORT

**系统监控权限**
- SYSTEM_MONITOR, MONITOR_SERVER, MONITOR_DATABASE, MONITOR_LOG

**API管理权限**
- API_MANAGE, API_DOC, API_TEST, API_DEBUG

**API接口权限**
- API_MOMENT_CREATE, API_USER_LIST
- API_DATA_BACKUP, API_DATA_CLEAN, API_STATS_GET, API_MONITOR_GET

#### 新增内容
- `PERMISSION_TAGS` - 权限标签分类常量
- `ROLE_PERMISSIONS_MAP` - 角色权限映射（用于前端展示）

---

### 2. `src/router/index.tsx` ✅
**更新内容**: 修复路由权限配置

**变更**:
```typescript
// 之前（使用不存在的权限）
<AuthRoute permission={PERMISSIONS.ROLE_VIEW}>

// 之后（使用实际存在的权限）
<AuthRoute permission={PERMISSIONS.SYSTEM_MANAGE}>
```

---

### 3. `src/views/permission-demo.tsx` ✅
**更新内容**: 更新示例页面使用实际存在的权限

**变更**:
- 使用系统管理和数据管理相关权限作为示例
- 移除宠物相关权限示例
- `ADMIN` 角色 → `DEV_ADMIN` 角色

---

### 4. `src/hooks/useLoginCheck.ts` ✅
**更新内容**: 修复登录检查逻辑，支持公共路由

**问题**: 之前只排除了 `/login`，导致 `/403` 页面也会被重定向到登录页

**解决方案**:
```typescript
// 之前
const isAtLogin = useMemo(
  () => withoutTrailingSlash(url.pathname) === "/login",
  [url.pathname],
);

// 之后
const isPublicRoute = useMemo(() => {
  const pathname = withoutTrailingSlash(url.pathname);
  return pathname === "/login" || pathname === "/403";
}, [url.pathname]);
```

---

## 📚 权限系统架构

### 数据流
```
后端 migrator/v1.ts
  ↓ 定义角色和权限
后端数据库
  ↓ 用户登录
返回 userInfo { roles: [], permissions: [] }
  ↓ 存储到 Zustand
前端 useLoginStore
  ↓ 权限检查
PermissionChecker / Hooks / 组件
  ↓ UI控制
显示/隐藏 按钮、菜单、路由
```

### 权限检查方式

1. **工具函数** (非React组件)
   ```typescript
   import { hasPermission } from '@/auth/permission';
   if (hasPermission('DATA_MANAGE')) { /* ... */ }
   ```

2. **Hooks** (React组件)
   ```typescript
   const canManageData = useHasPermission(PERMISSIONS.DATA_MANAGE);
   ```

3. **组件包装**
   ```typescript
   <AuthWrapper permission={PERMISSIONS.DATA_MANAGE}>
     <button>数据管理</button>
   </AuthWrapper>
   ```

4. **权限按钮**
   ```typescript
   <AuthButton permission={PERMISSIONS.BACKUP_EXECUTE}>
     执行备份
   </AuthButton>
   ```

5. **路由控制**
   ```typescript
   <AuthRoute permission={PERMISSIONS.SYSTEM_MANAGE}>
     <AdminPage />
   </AuthRoute>
   ```

---

## ⚠️ 注意事项

1. **前后端同步**: 权限常量必须与后端 `migrator/v1.ts` 保持一致
2. **大小写敏感**: 权限编码统一使用大写字母和下划线
3. **前端权限仅用于UI控制**: 真正的权限验证必须在后端进行
4. **超级管理员**: 拥有所有权限，后端返回时包含所有权限编码

---

## 🔍 后端角色权限映射参考

| 角色 | 权限数量 | 主要权限范围 |
|------|---------|-------------|
| SUPER_ADMIN | 全部 | 所有权限 |
| DEV_ADMIN | ~15 | 系统开发、API管理、监控 |
| OPS_ADMIN | ~20 | 运维、数据管理、监控 |
| CONTENT_ADMIN | ~5 | 内容审核和管理 |
| VIP_USER | ~6 | 动态管理（完整功能） |
| NORMAL_USER | ~5 | 动态管理（基础功能） |
| GUEST | ~2 | 浏览功能 |

---

## 📖 相关文档

- 详细使用文档: `src/auth/README.md`
- 系统架构文档: `docs/PERMISSION_SYSTEM.md`
- 后端权限定义: `server/src/migrator/v1.ts`

---

## ✅ 验证清单

- [x] 权限常量与后端完全同步
- [x] 角色常量与后端完全同步
- [x] 路由权限配置使用实际存在的权限
- [x] 示例页面使用实际存在的权限
- [x] 登录检查逻辑支持公共路由（/login, /403）
- [x] 所有权限检查组件和Hooks正常工作

---

**更新完成时间**: 2026-02-01
**更新人**: Claude Sonnet 4.5
