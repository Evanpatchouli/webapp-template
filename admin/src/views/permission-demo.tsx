import { Card, Space, Divider, Tag } from 'antd';
import { useLoginStore } from '@/auth/store';
import { usePermissionChecker, useHasPermission, useIsSuperAdmin } from '@/auth/hooks';
import AuthWrapper from '@/components/AuthWrapper';
import AuthButton from '@/components/AuthButton';
import { PERMISSIONS, ROLES } from '@/constants/permissions';

/**
 * 权限控制使用示例页面
 */
export default function PermissionDemo() {
  const { userInfo } = useLoginStore();
  const checker = usePermissionChecker();
  const canManageData = useHasPermission(PERMISSIONS.DATA_MANAGE);
  const isSuperAdmin = useIsSuperAdmin();

  return (
    <div style={{ padding: '24px' }}>
      <h1>权限控制系统使用示例</h1>

      {/* 当前用户信息 */}
      <Card title="当前用户信息" style={{ marginBottom: '24px' }}>
        <p><strong>用户ID:</strong> {userInfo?.id || '未登录'}</p>
        <p><strong>昵称:</strong> {userInfo?.nickname || '未设置'}</p>
        <p>
          <strong>角色:</strong>{' '}
          {userInfo?.roles?.map(role => (
            <Tag color="blue" key={role}>{role}</Tag>
          )) || '无'}
        </p>
        <p>
          <strong>权限:</strong>{' '}
          {userInfo?.permissions?.map(perm => (
            <Tag color="green" key={perm}>{perm}</Tag>
          )) || '无'}
        </p>
        <p>
          <strong>是否超级管理员:</strong>{' '}
          <Tag color={isSuperAdmin ? 'red' : 'default'}>
            {isSuperAdmin ? '是' : '否'}
          </Tag>
        </p>
      </Card>

      <Divider />

      {/* 示例1: 使用 Hook 方式 */}
      <Card title="示例1: 使用 Hook 方式" style={{ marginBottom: '24px' }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <div>
            <strong>useHasPermission Hook:</strong>
            {canManageData ? (
              <Tag color="success">有 DATA_MANAGE 权限</Tag>
            ) : (
              <Tag color="error">无 DATA_MANAGE 权限</Tag>
            )}
          </div>

          <div>
            <strong>usePermissionChecker Hook:</strong>
            {checker.hasRole(ROLES.DEV_ADMIN) ? (
              <Tag color="success">有 DEV_ADMIN 角色</Tag>
            ) : (
              <Tag color="error">无 DEV_ADMIN 角色</Tag>
            )}
          </div>
        </Space>
      </Card>

      <Divider />

      {/* 示例2: 使用 AuthWrapper 组件 */}
      <Card title="示例2: 使用 AuthWrapper 组件" style={{ marginBottom: '24px' }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <div>
            <strong>有权限时显示:</strong>
            <AuthWrapper permission={PERMISSIONS.USER_LIST}>
              <Tag color="success">您有 USER_LIST 权限，可以看到这段内容</Tag>
            </AuthWrapper>
          </div>

          <div>
            <strong>无权限时显示 fallback:</strong>
            <AuthWrapper
              permission={PERMISSIONS.BACKUP_DELETE}
              fallback={<Tag color="warning">您没有 BACKUP_DELETE 权限</Tag>}
            >
              <Tag color="success">您有 BACKUP_DELETE 权限</Tag>
            </AuthWrapper>
          </div>
        </Space>
      </Card>

      <Divider />

      {/* 示例3: 使用 AuthButton 组件 */}
      <Card title="示例3: 使用 AuthButton 组件" style={{ marginBottom: '24px' }}>
        <Space>
          <AuthButton
            type="primary"
            permission={PERMISSIONS.BACKUP_EXECUTE}
            onClick={() => alert('执行备份')}
          >
            执行备份
          </AuthButton>

          <AuthButton
            danger
            permission={PERMISSIONS.CLEAN_EXECUTE}
            fallback={<button disabled>执行清理（无权限）</button>}
            onClick={() => alert('执行清理')}
          >
            执行清理
          </AuthButton>
        </Space>
      </Card>

      <Divider />

      {/* 示例4: 条件渲染 */}
      <Card title="示例4: 条件渲染" style={{ marginBottom: '24px' }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          {canManageData && (
            <div>
              <Tag color="blue">使用 Hook 条件渲染: 您有数据管理权限</Tag>
            </div>
          )}

          {checker.hasPermission([PERMISSIONS.USER_EDIT, PERMISSIONS.USER_DISABLE]) && (
            <div>
              <Tag color="purple">您有编辑或禁用用户权限（任意一个）</Tag>
            </div>
          )}

          {isSuperAdmin && (
            <div>
              <Tag color="red">超级管理员专属内容</Tag>
            </div>
          )}
        </Space>
      </Card>
    </div>
  );
}
