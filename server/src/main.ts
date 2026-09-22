import 'module-alias/register';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { logger } from '@/common/logger';
import { INestApplication } from '@nestjs/common';
import AppConfig from './app.config';
import cache from './cache';
import MongoStore from 'connect-mongo';
import { getConnectionToken } from '@nestjs/mongoose';
import type { Connection } from 'mongoose';
import { OIDC_SETTINGS, type OidcSettings } from './auth/oidc.config';
import { configureApplication } from './bootstrap';

class ApplicationStarter {
  private readonly name = 'nest-server-starter';

  async NestAppStarter(): Promise<void> {
    const startTime = performance.now();

    try {
      // 执行数据库迁移
      // Migrations run through the explicit deployment command, never before Mongo connects.

      // 启动 NestJS 应用
      await this.bootstrapNestApp(startTime);

      const totalTime = (performance.now() - startTime) / 1000;
      logger.info(`🎉 服务启动完成，全程耗时 ${totalTime.toFixed(2)} 秒`);
    } catch (error) {
      logger.error('❌ 服务启动失败:', error instanceof Error ? error.name : 'unknown_error');
      process.exit(1);
    }
  }

  private async bootstrapNestApp(startTime: number): Promise<void> {
    const bootstrapStart = performance.now();
    logger.info('🚀 启动 NestJS 应用...');

    const app = await NestFactory.create(AppModule);
    const settings = app.get<OidcSettings>(OIDC_SETTINGS);
    const connection = app.get<Connection>(getConnectionToken());
    const store = MongoStore.create({ client: connection.getClient(), dbName: connection.name,
      collectionName: 'web_sessions', ttl: settings.idleSeconds, touchAfter: 0 });
    store.on('error', () => logger.error('Session Store unavailable'));
    configureApplication(app, settings, store);

    const port = AppConfig.Server.PORT;
    const host = AppConfig.Server.HOST;
    await app.listen(port, host);

    const bootstrapTime = (performance.now() - bootstrapStart) / 1000;
    logger.info(`✅ NestJS 应用启动完成，耗时 ${bootstrapTime.toFixed(2)} 秒`);
    logger.info(`🌐 服务运行在: http://localhost:${port}`);

    // 添加优雅关闭
    this.setupGracefulShutdown(app);
  }

  private setupGracefulShutdown(app: INestApplication): void {
    const signals = ['SIGINT', 'SIGTERM'];

    signals.forEach((signal) => {
      // eslint-disable-next-line @typescript-eslint/no-misused-promises
      process.on(signal, () => GracefulShutdown(signal, app));
    });
  }
}

// 启动应用
async function main() {
  const starter = new ApplicationStarter();
  await starter.NestAppStarter();
}

// 错误处理
process.on('unhandledRejection', (reason, promise) => {
  logger.error('未处理的 Promise 拒绝:', reason instanceof Error ? reason.name : 'unknown_error');
});

process.on('uncaughtException', (error) => {
  logger.error('未捕获的异常:', error.name);
  process.exit(1);
});

// 执行启动
main().catch((error) => {
  logger.error('启动失败:', error);
  process.exit(1);
});

// 优雅关闭
async function GracefulShutdown(signal: string, app: INestApplication) {
  logger.info(`收到 ${signal} 信号，开始优雅关闭...`);

  try {
    logger.info('正在持久化缓存...');
    cache.persist();
    logger.info('缓存持久化完成');
    await app.close();
    logger.info('✅ 应用已优雅关闭');
    process.exit(0);
  } catch (error) {
    logger.error('❌ 关闭应用时发生错误:', error instanceof Error ? error.name : 'unknown_error');
    process.exit(1);
  }
}
