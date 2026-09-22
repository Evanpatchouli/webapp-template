import { INestApplication, ValidationPipe } from '@nestjs/common';
import session from 'express-session';
import type { Store } from 'express-session';
import type { Request, Response, NextFunction } from 'express';
import { csrf, sessionCookie } from './auth/session.security';
import type { OidcSettings } from './auth/oidc.config';
import { TraceIdInterceptor } from './common/trace/trace.interceptor';

/** Shared by production and HTTP integration tests. The caller supplies a persistent store. */
export function configureApplication(app: INestApplication, settings: OidcSettings, store: Store) {
  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({ transform: true, transformOptions: { enableImplicitConversion: false } }));
  app.useGlobalInterceptors(new TraceIdInterceptor());
  app.getHttpAdapter().getInstance().set('trust proxy', settings.trustProxy);
  app.enableCors({ origin: settings.origin, credentials: true });
  app.use((req: Request, res: Response, next: NextFunction) => {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Referrer-Policy', 'no-referrer');
    if (/^\/api\/(user\/(login|register|logout)(\/|$)|captcha(\/|$)|opt(\/|$))/.test(req.path)) {
      res.status(410).json({ code: 'LEGACY_AUTH_DISABLED', message: '请使用 Nexus Auth 登录' });
      return;
    }
    next();
  });
  const sessionMiddleware = session({ name: settings.cookieName, secret: settings.sessionSecret, store,
    resave: false, saveUninitialized: false, rolling: true,
    cookie: { ...sessionCookie, maxAge: settings.idleSeconds * 1000 } });
  app.use((req: Request, res: Response, next: NextFunction) => {
    sessionMiddleware(req, res, (error?: unknown) => {
      if (error) { res.status(503).json({ code: 'SESSION_UNAVAILABLE', message: '会话服务暂不可用' }); return; }
      next();
    });
  });
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
    if (req.headers.origin !== settings.origin) {
      res.status(403).json({ code: 'CSRF_ORIGIN', message: '请求来源验证失败' }); return;
    }
    csrf.csrfSynchronisedProtection(req, res, (error?: unknown) => {
      if (error) { res.status(403).json({ code: 'CSRF_INVALID', message: '请求验证失败，请刷新后重试' }); return; }
      next();
    });
  });
}
