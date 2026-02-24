import 'module-alias/register';
import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { migrate } from './migrator';
import { logger } from '@/common/logger';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import AppConfig from './app.config';
import cache from './cache';
import { TraceIdInterceptor } from '@/common/trace/trace.interceptor';
import session from 'express-session';

class ApplicationStarter {
  private readonly name = 'nest-server-starter';

  async NestAppStarter(): Promise<void> {
    const startTime = performance.now();

    try {
      // 执行数据库迁移
      await this.runMigrations(startTime);

      // 启动 NestJS 应用
      await this.bootstrapNestApp(startTime);

      const totalTime = (performance.now() - startTime) / 1000;
      logger.info(`🎉 服务启动完成，全程耗时 ${totalTime.toFixed(2)} 秒`);
    } catch (error) {
      logger.error('❌ 服务启动失败:', error);
      process.exit(1);
    }
  }

  private async runMigrations(startTime: number): Promise<void> {
    if (AppConfig.Migrator.on) {
      const migrationStart = performance.now();
      logger.info('🚀 开始执行数据库迁移...');

      await migrate();

      const migrationTime = (performance.now() - migrationStart) / 1000;
      logger.info(`✅ 数据库迁移完成，耗时 ${migrationTime.toFixed(2)} 秒`);
    }
  }

  private async bootstrapNestApp(startTime: number): Promise<void> {
    const bootstrapStart = performance.now();
    logger.info('🚀 启动 NestJS 应用...');

    const app = await NestFactory.create(AppModule);
    const httpAdapter = app.get(HttpAdapterHost);
    // 全局前缀
    app.setGlobalPrefix('api');
    // app.useGlobalFilters(new CatchGlobalExcenptionFilter(httpAdapter));
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true, // 必须设置为 true
        transformOptions: {
          enableImplicitConversion: false, // 如果使用 @Transform，这个可以设为 false
        },
        whitelist: false, // 移除未装饰的属性
        forbidNonWhitelisted: false, // 禁止未装饰的属性
      }),
    );
    app.useGlobalInterceptors(new TraceIdInterceptor());
    app.use(
      session({
        secret: 'my-secret',
        resave: false,
        saveUninitialized: false,
      }),
    );

    // 启用 CORS
    app.enableCors({
      origin: process.env.CORS_ORIGIN || '*',
      credentials: true,
    });

    const port = process.env.PORT || 8693;
    await app.listen(port);

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
  logger.error('未处理的 Promise 拒绝:', reason);
});

process.on('uncaughtException', (error) => {
  logger.error('未捕获的异常:', error);
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
    logger.error('❌ 关闭应用时发生错误:', error);
    process.exit(1);
  }
}
