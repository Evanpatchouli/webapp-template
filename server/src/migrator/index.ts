import { MigrationManager } from './migration-manager';
import AppConfig from '../app.config';
import { logger } from '@/common/logger';
import { sleep } from '@/utils/sleep';
import { v1 } from './v1';
import { v2 } from './v2';
import { v3 } from './v3';

const MigratorConfig = AppConfig.Migrator;

export const migrate = async () => {
  if (!MigratorConfig.on) {
    return;
  }

  logger.info('🚀 开始执行数据迁移...');

  // 不传 mongoUri，使用已有的 mongoose 连接
  const manager = new MigrationManager();

  try {
    // 注册所有迁移脚本
    manager.register({
      version: 'v1',
      name: '初始化权限和角色数据',
      up: v1,
    });

    manager.register({
      version: 'v2',
      name: '更新管理员邮箱',
      up: v2,
    });

    manager.register({
      version: 'v3',
      name: 'Nexus Auth 身份映射与会话索引',
      up: v3,
    });

    // 连接（实际上会跳过，使用已有连接）
    await manager.connect();

    // 运行迁移
    await manager.run({ force: false });

    logger.info('✅ 数据库迁移成功');
    logger.info(`⏳ 将在 ${MigratorConfig.waitAfter / 1000} 秒后启动服务器...`);
    await sleep(MigratorConfig.waitAfter);
  } catch (error) {
    logger.error('❌ 数据库迁移失败:', error);
    throw error;
  } finally {
    // 断开连接（实际上会跳过，保持连接）
    await manager.disconnect();
  }
};
