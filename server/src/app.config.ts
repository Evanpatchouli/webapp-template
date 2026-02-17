import { env } from './config/env';

export default class AppConfig {
  public static readonly Process = {
    ROOT: process.cwd(),
  };
  public static readonly Server = {
    PORT: env.APP_PORT || 8693,
  };

  public static readonly DataBase = {
    Mongo: {
      CONNECTION: env.DB_MONGO_CONNECTION as string,
      USERNAME: env.DB_MONGO_USERNAME as string,
      PASSWORD: env.DB_MONGO_PASSWORD as string,
    } as const,
  };

  public static readonly Migrator = {
    on: false,
    waitAfter: 1000,
  };

  public static readonly Jwt = {
    SK: env.JWT_SECRET,
    TTL: '7d',
  } as const;

  public static readonly Log4js = {
    level: env.LOG_LEVEL || 'info',
    path: './logs',
    prefix: '',
    // prefix: '【萌宠空间】'
  } as const;

  public static readonly Session = {
    secret: env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
  };
}
