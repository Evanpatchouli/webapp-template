import mongoose from 'mongoose';
import { Types } from 'mongoose';
import { RoleSchema } from '../modules/role-module/role.schema';
import { UserSchema } from '../modules/user-module/user.schema';
import config from './config';
import {
  PermissionType,
  PermissionStatus,
  ApiMethod,
  PermissionSchema,
} from '../modules/permission-module/permission.schema';

// 数据库连接配置
const MONGO_URI = process.env.MONGODB_URI || config.CONNECTION;

// 定义接口
interface PermissionData {
  perm_code: string;
  perm_name: string;
  description: string;
  type: PermissionType;
  parent_id?: Types.ObjectId | null;
  icon?: string;
  path?: string;
  component?: string;
  api_method?: ApiMethod;
  api_path?: string;
  sort_order: number;
  is_system: boolean;
  tag?: string;
}

interface RoleData {
  role_code: string;
  role_name: string;
  description: string;
  is_system: boolean;
  sort_order: number;
  permission_codes: string[];
}

// 权限数据定义
const permissions: PermissionData[] = [
  // ========== 系统管理权限（管理员使用） ==========
  {
    perm_code: 'SYSTEM_MANAGE',
    perm_name: '系统管理',
    description: '系统管理模块',
    type: PermissionType.MENU,
    parent_id: null,
    icon: 'setting',
    path: '/system',
    component: 'Layout',
    sort_order: 100,
    is_system: true,
    tag: 'system',
  },
  {
    perm_code: 'USER_MANAGE',
    perm_name: '用户管理',
    description: '管理小程序用户',
    type: PermissionType.MENU,
    parent_id: null,
    icon: 'user',
    path: '/user',
    component: 'system/user/index',
    sort_order: 101,
    is_system: true,
    tag: 'system',
  },
  {
    perm_code: 'USER_LIST',
    perm_name: '用户列表',
    description: '查看用户列表',
    type: PermissionType.BUTTON,
    parent_id: null,
    sort_order: 1,
    is_system: true,
    tag: 'user',
  },
  {
    perm_code: 'USER_DETAIL',
    perm_name: '用户详情',
    description: '查看用户详细信息',
    type: PermissionType.BUTTON,
    parent_id: null,
    sort_order: 2,
    is_system: true,
    tag: 'user',
  },
  {
    perm_code: 'USER_EDIT',
    perm_name: '编辑用户',
    description: '编辑用户信息',
    type: PermissionType.BUTTON,
    parent_id: null,
    sort_order: 3,
    is_system: true,
    tag: 'user',
  },
  {
    perm_code: 'USER_DISABLE',
    perm_name: '禁用用户',
    description: '禁用用户账号',
    type: PermissionType.BUTTON,
    parent_id: null,
    sort_order: 4,
    is_system: true,
    tag: 'user',
  },
  {
    perm_code: 'CONTENT_MANAGE',
    perm_name: '内容管理',
    description: '管理平台内容',
    type: PermissionType.MENU,
    parent_id: null,
    icon: 'file-text',
    path: '/content',
    component: 'system/content/index',
    sort_order: 102,
    is_system: true,
    tag: 'content',
  },
  {
    perm_code: 'CONTENT_AUDIT',
    perm_name: '内容审核',
    description: '审核用户发布的内容',
    type: PermissionType.BUTTON,
    parent_id: null,
    sort_order: 1,
    is_system: true,
    tag: 'content',
  },
  {
    perm_code: 'CONTENT_DELETE',
    perm_name: '删除内容',
    description: '删除违规内容',
    type: PermissionType.BUTTON,
    parent_id: null,
    sort_order: 2,
    is_system: true,
    tag: 'content',
  },

  // ========== 动态分享权限 ==========
  {
    perm_code: 'MOMENT_MANAGE',
    perm_name: '动态管理',
    description: '管理宠物动态',
    type: PermissionType.MENU,
    parent_id: null,
    icon: 'camera',
    path: '/moment',
    component: 'moment/index',
    sort_order: 20,
    is_system: false,
    tag: 'moment',
  },
  {
    perm_code: 'MOMENT_POST',
    perm_name: '发布动态',
    description: '发布宠物动态',
    type: PermissionType.BUTTON,
    parent_id: null,
    sort_order: 1,
    is_system: false,
    tag: 'moment',
  },
  {
    perm_code: 'MOMENT_LIKE',
    perm_name: '点赞动态',
    description: '给动态点赞',
    type: PermissionType.BUTTON,
    parent_id: null,
    sort_order: 2,
    is_system: false,
    tag: 'moment',
  },
  {
    perm_code: 'MOMENT_COMMENT',
    perm_name: '评论动态',
    description: '评论宠物动态',
    type: PermissionType.BUTTON,
    parent_id: null,
    sort_order: 3,
    is_system: false,
    tag: 'moment',
  },
  {
    perm_code: 'MOMENT_SHARE',
    perm_name: '分享动态',
    description: '分享动态到其他平台',
    type: PermissionType.BUTTON,
    parent_id: null,
    sort_order: 4,
    is_system: false,
    tag: 'moment',
  },

  // ========== API 接口权限 ==========
  {
    perm_code: 'API_MOMENT_CREATE',
    perm_name: '创建动态API',
    description: '创建动态接口',
    type: PermissionType.API,
    api_method: ApiMethod.POST,
    api_path: '/api/moments',
    sort_order: 4,
    is_system: false,
    tag: 'api',
  },
  {
    perm_code: 'API_USER_LIST',
    perm_name: '用户列表API',
    description: '获取用户列表接口（管理员）',
    type: PermissionType.API,
    api_method: ApiMethod.GET,
    api_path: '/api/admin/users',
    sort_order: 100,
    is_system: true,
    tag: 'api',
  },

  // ========== 应用数据管理权限（新增） ==========
  {
    perm_code: 'DATA_MANAGE',
    perm_name: '应用数据',
    description: '应用数据管理模块',
    type: PermissionType.MENU,
    parent_id: null,
    icon: 'database',
    path: '/data',
    component: 'Layout',
    sort_order: 103,
    is_system: true,
    tag: 'data',
  },
  {
    perm_code: 'DATA_BACKUP',
    perm_name: '数据备份',
    description: '备份应用数据',
    type: PermissionType.MENU,
    parent_id: null,
    icon: 'cloud-upload',
    path: '/data/backup',
    component: 'data/backup/index',
    sort_order: 1,
    is_system: true,
    tag: 'data',
  },
  {
    perm_code: 'BACKUP_EXECUTE',
    perm_name: '执行备份',
    description: '执行数据备份操作',
    type: PermissionType.BUTTON,
    parent_id: null,
    sort_order: 1,
    is_system: true,
    tag: 'data',
  },
  {
    perm_code: 'BACKUP_DOWNLOAD',
    perm_name: '下载备份',
    description: '下载备份文件',
    type: PermissionType.BUTTON,
    parent_id: null,
    sort_order: 2,
    is_system: true,
    tag: 'data',
  },
  {
    perm_code: 'BACKUP_DELETE',
    perm_name: '删除备份',
    description: '删除旧的备份文件',
    type: PermissionType.BUTTON,
    parent_id: null,
    sort_order: 3,
    is_system: true,
    tag: 'data',
  },
  {
    perm_code: 'DATA_CLEAN',
    perm_name: '数据清理',
    description: '清理过期或无效数据',
    type: PermissionType.MENU,
    parent_id: null,
    icon: 'delete',
    path: '/data/clean',
    component: 'data/clean/index',
    sort_order: 2,
    is_system: true,
    tag: 'data',
  },
  {
    perm_code: 'CLEAN_EXECUTE',
    perm_name: '执行清理',
    description: '执行数据清理操作',
    type: PermissionType.BUTTON,
    parent_id: null,
    sort_order: 1,
    is_system: true,
    tag: 'data',
  },
  {
    perm_code: 'CLEAN_PREVIEW',
    perm_name: '预览清理',
    description: '预览将要清理的数据',
    type: PermissionType.BUTTON,
    parent_id: null,
    sort_order: 2,
    is_system: true,
    tag: 'data',
  },
  {
    perm_code: 'DATA_STATISTICS',
    perm_name: '数据统计',
    description: '查看应用数据统计',
    type: PermissionType.MENU,
    parent_id: null,
    icon: 'bar-chart',
    path: '/data/statistics',
    component: 'data/statistics/index',
    sort_order: 3,
    is_system: true,
    tag: 'data',
  },
  {
    perm_code: 'STATS_VIEW',
    perm_name: '查看统计',
    description: '查看数据统计分析',
    type: PermissionType.BUTTON,
    parent_id: null,
    sort_order: 1,
    is_system: true,
    tag: 'data',
  },
  {
    perm_code: 'STATS_EXPORT',
    perm_name: '导出统计',
    description: '导出统计数据',
    type: PermissionType.BUTTON,
    parent_id: null,
    sort_order: 2,
    is_system: true,
    tag: 'data',
  },

  // ========== 系统监控权限（新增） ==========
  {
    perm_code: 'SYSTEM_MONITOR',
    perm_name: '系统监控',
    description: '系统运行状态监控',
    type: PermissionType.MENU,
    parent_id: null,
    icon: 'dashboard',
    path: '/monitor',
    component: 'monitor/index',
    sort_order: 104,
    is_system: true,
    tag: 'system',
  },
  {
    perm_code: 'MONITOR_SERVER',
    perm_name: '服务器监控',
    description: '监控服务器运行状态',
    type: PermissionType.BUTTON,
    parent_id: null,
    sort_order: 1,
    is_system: true,
    tag: 'system',
  },
  {
    perm_code: 'MONITOR_DATABASE',
    perm_name: '数据库监控',
    description: '监控数据库运行状态',
    type: PermissionType.BUTTON,
    parent_id: null,
    sort_order: 2,
    is_system: true,
    tag: 'system',
  },
  {
    perm_code: 'MONITOR_LOG',
    perm_name: '日志监控',
    description: '查看系统运行日志',
    type: PermissionType.BUTTON,
    parent_id: null,
    sort_order: 3,
    is_system: true,
    tag: 'system',
  },

  // ========== API 相关权限（新增） ==========
  {
    perm_code: 'API_MANAGE',
    perm_name: 'API管理',
    description: '管理API接口',
    type: PermissionType.MENU,
    parent_id: null,
    icon: 'api',
    path: '/api',
    component: 'api/index',
    sort_order: 105,
    is_system: true,
    tag: 'system',
  },
  {
    perm_code: 'API_DOC',
    perm_name: 'API文档',
    description: '查看API接口文档',
    type: PermissionType.BUTTON,
    parent_id: null,
    sort_order: 1,
    is_system: true,
    tag: 'system',
  },
  {
    perm_code: 'API_TEST',
    perm_name: 'API测试',
    description: '测试API接口',
    type: PermissionType.BUTTON,
    parent_id: null,
    sort_order: 2,
    is_system: true,
    tag: 'system',
  },
  {
    perm_code: 'API_DEBUG',
    perm_name: 'API调试',
    description: '调试API接口',
    type: PermissionType.BUTTON,
    parent_id: null,
    sort_order: 3,
    is_system: true,
    tag: 'system',
  },

  // ========== 数据管理API权限（新增） ==========
  {
    perm_code: 'API_DATA_BACKUP',
    perm_name: '数据备份API',
    description: '数据备份相关接口',
    type: PermissionType.API,
    api_method: ApiMethod.POST,
    api_path: '/api/admin/data/backup',
    sort_order: 110,
    is_system: true,
    tag: 'api',
  },
  {
    perm_code: 'API_DATA_CLEAN',
    perm_name: '数据清理API',
    description: '数据清理相关接口',
    type: PermissionType.API,
    api_method: ApiMethod.POST,
    api_path: '/api/admin/data/clean',
    sort_order: 111,
    is_system: true,
    tag: 'api',
  },
  {
    perm_code: 'API_STATS_GET',
    perm_name: '获取统计API',
    description: '获取统计数据接口',
    type: PermissionType.API,
    api_method: ApiMethod.GET,
    api_path: '/api/admin/data/stats',
    sort_order: 112,
    is_system: true,
    tag: 'api',
  },
  {
    perm_code: 'API_MONITOR_GET',
    perm_name: '获取监控API',
    description: '获取系统监控数据接口',
    type: PermissionType.API,
    api_method: ApiMethod.GET,
    api_path: '/api/admin/monitor',
    sort_order: 113,
    is_system: true,
    tag: 'api',
  },
];

// 角色数据定义
const roles: RoleData[] = [
  {
    role_code: 'SUPER_ADMIN',
    role_name: '超级管理员',
    description: '系统最高权限管理员，拥有所有权限',
    is_system: true,
    sort_order: 1,
    permission_codes: permissions.map((p) => p.perm_code), // 拥有所有权限
  },
  {
    role_code: 'DEV_ADMIN',
    role_name: '开发管理员',
    description: '负责系统开发和API管理的管理员',
    is_system: true,
    sort_order: 3,
    permission_codes: [
      // 系统管理
      'SYSTEM_MANAGE',
      
      // API管理
      'API_MANAGE',
      'API_DOC',
      'API_TEST',
      'API_DEBUG',
      
      // 系统监控
      'SYSTEM_MONITOR',
      'MONITOR_SERVER',
      'MONITOR_DATABASE',
      'MONITOR_LOG',
      
      // 应用数据管理（只读）
      'DATA_MANAGE',
      'DATA_STATISTICS',
      'STATS_VIEW',
      
      // 用户管理（只读）
      'USER_MANAGE',
      'USER_LIST',
      'USER_DETAIL',
      
      // API接口权限
      'API_USER_LIST',
      'API_MONITOR_GET',
      'API_STATS_GET',
      'API_MOMENT_CREATE',
    ],
  },
  {
    role_code: 'OPS_ADMIN',
    role_name: '运维管理员',
    description: '负责系统运维和数据管理的管理员',
    is_system: true,
    sort_order: 4,
    permission_codes: [
      // 应用数据管理
      'DATA_MANAGE',
      'DATA_BACKUP',
      'BACKUP_EXECUTE',
      'BACKUP_DOWNLOAD',
      'BACKUP_DELETE',
      'DATA_CLEAN',
      'CLEAN_EXECUTE',
      'CLEAN_PREVIEW',
      'DATA_STATISTICS',
      'STATS_VIEW',
      'STATS_EXPORT',
      
      // 系统监控
      'SYSTEM_MONITOR',
      'MONITOR_SERVER',
      'MONITOR_DATABASE',
      'MONITOR_LOG',
      
      // 内容管理
      'CONTENT_MANAGE',
      'CONTENT_AUDIT',
      'CONTENT_DELETE',
      
      // API接口权限
      'API_DATA_BACKUP',
      'API_DATA_CLEAN',
      'API_STATS_GET',
      'API_MONITOR_GET',
      'API_USER_LIST',
    ],
  },
  {
    role_code: 'CONTENT_ADMIN',
    role_name: '内容管理员',
    description: '负责内容审核和管理的管理员',
    is_system: true,
    sort_order: 2,
    permission_codes: [
      'CONTENT_MANAGE',
      'CONTENT_AUDIT',
      'CONTENT_DELETE',
      'USER_VIEW',
      'API_USER_LIST',
    ],
  },
  {
    role_code: 'VIP_USER',
    role_name: 'VIP用户',
    description: '高级会员用户，拥有更多功能',
    is_system: false,
    sort_order: 10,
    permission_codes: [
      'MOMENT_MANAGE',
      'MOMENT_POST',
      'MOMENT_LIKE',
      'MOMENT_COMMENT',
      'MOMENT_SHARE',
      'API_MOMENT_CREATE',
    ],
  },
  {
    role_code: 'NORMAL_USER',
    role_name: '普通用户',
    description: '普通注册用户',
    is_system: false,
    sort_order: 20,
    permission_codes: [
      'MOMENT_MANAGE',
      'MOMENT_POST',
      'MOMENT_LIKE',
      'MOMENT_COMMENT',
      'API_MOMENT_CREATE',
    ],
  },
  {
    role_code: 'GUEST',
    role_name: '游客',
    description: '未登录游客用户',
    is_system: false,
    sort_order: 30,
    permission_codes: [
      'MOMENT_MANAGE',
      'MOMENT_LIKE',
    ],
  },
];

export async function v1() {
  // 获取模型（使用已有的连接）
  const PermissionModel = mongoose.model('Permission', PermissionSchema);
  const RoleModel = mongoose.model('Role', RoleSchema);

  // 清空现有数据（可选）
  await PermissionModel.deleteMany({});
  await RoleModel.deleteMany({});
  console.log('🗑️  已清空现有权限和角色数据');

    // 插入权限数据
    const permissionDocs = await PermissionModel.insertMany(
      permissions.map((perm) => ({
        ...perm,
        status: PermissionStatus.ENABLED,
        created_at: Math.floor(Date.now() / 1000),
        updated_at: Math.floor(Date.now() / 1000),
      })),
    );
    console.log(`✅ 已插入 ${permissionDocs.length} 个权限`);

    // 创建权限编码到ID的映射
    const permCodeToId = new Map<string, Types.ObjectId>();
    permissionDocs.forEach((doc) => {
      permCodeToId.set(doc.perm_code, doc._id);
    });

    // 插入角色数据
    for (const roleData of roles) {
      const permissionIds = roleData.permission_codes
        .map((code) => permCodeToId.get(code))
        .filter((id) => id !== undefined);

      const roleDoc = new RoleModel({
        ...roleData,
        status: 1, // 启用状态
        permission_ids: permissionIds,
        created_at: Math.floor(Date.now() / 1000),
        updated_at: Math.floor(Date.now() / 1000),
      });

      await roleDoc.save();
      console.log(
        `✅ 已创建角色: ${roleData.role_name} (${roleData.role_code})`,
      );
      console.log(`   包含 ${permissionIds.length} 个权限`);
    }

    // 创建默认管理员用户（可选）
    const UserModel = mongoose.model('User', UserSchema);
    const superAdminRole = await RoleModel.findOne({
      role_code: 'SUPER_ADMIN',
    });

    const defaultAdminUserOpenid = 'ofSEA2KzGjX1IGcUFASZWgln9Lnw';

    const defaultAdminUser = await UserModel.findOne({
      openid: defaultAdminUserOpenid,
    });

    if (superAdminRole && !defaultAdminUser) {
      const adminUser = new UserModel({
        openid: defaultAdminUserOpenid,
        nickname: '超级管理员',
        phone: '19157691370',
        username: 'root',
        password: 'root',
        status: 1,
        role_ids: [superAdminRole._id],
        created_at: Math.floor(Date.now() / 1000),
        updated_at: Math.floor(Date.now() / 1000),
      });

      await adminUser.save();
      console.log('✅ 已创建默认管理员用户');
      console.log(`   OpenID: ${defaultAdminUserOpenid}`);
      console.log(`   手机号: 19157691370`);
    }

    console.log('\n🎉 数据初始化完成！');
    console.log('📊 统计信息：');
    console.log(`   - 权限数量: ${permissionDocs.length}`);
    console.log(`   - 角色数量: ${roles.length}`);

    // 显示角色权限统计
    const allRoles = await RoleModel.find().populate('permission_ids');
    for (const role of allRoles) {
      console.log(
        `   - ${role.role_name}: ${role.permission_ids.length} 个权限`,
      );
    }
}
