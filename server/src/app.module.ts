import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MongooseModule } from '@nestjs/mongoose';
import AppConfig from './app.config';
import { UserModule } from './modules/user-module';
import { EventModule } from './events/event-module';
import { RoleModule } from './modules/role-module';
import { AdminModule } from './modules/admin';
import { RequestMetaMiddleware } from './middlewares/request.meta.token.middleware';
import { GlobalExcenptionCatchProvider } from './exception/filters';
import { AuthProvider } from './auth/auth.provider';
import { LoginLogModule } from './modules/login-log-module';
import { OidcModule } from './auth/oidc.module';

@Module({
  imports: [
    EventModule,
    MongooseModule.forRoot(AppConfig.DataBase.Mongo.CONNECTION, {
      user: AppConfig.DataBase.Mongo.USERNAME,
      pass: AppConfig.DataBase.Mongo.PASSWORD,
    }),
    RoleModule,
    UserModule,
    AdminModule,
    OidcModule,
    LoginLogModule,
  ],
  controllers: [AppController],
  providers: [AuthProvider, AppService, GlobalExcenptionCatchProvider],
  exports: [],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestMetaMiddleware).forRoutes('*');
  }
}
