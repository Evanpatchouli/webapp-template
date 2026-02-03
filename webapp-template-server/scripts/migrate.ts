import { MigrationManager } from '../src/migrator/migration-manager';
import { v1 } from '../src/migrator/v1';
import config from '../src/migrator/config';

// 解析命令行参数
const args = process.argv.slice(2);
const force = args.includes('--force') || args.includes('-f');

async function runMigration() {
  const MONGO_URI = process.env.MONGODB_URI || config.CONNECTION;
  const manager = new MigrationManager(MONGO_URI);

  try {
    // 连接数据库
    await manager.connect();

    // 注册所有迁移脚本
    manager.register({
      version: 'v1',
      name: '初始化权限和角色数据',
      up: v1,
    });

    // 运行迁移
    await manager.run({ force });

    process.exit(0);
  } catch (error) {
    console.error('\n❌ 迁移执行失败:', error);
    process.exit(1);
  } finally {
    await manager.disconnect();
  }
}

runMigration();
