import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { OIDC_SETTINGS, readOidcConfig } from './oidc.config';
import { UserModule } from '../modules/user-module';
import { User, UserSchema } from '../modules/user-module/user.schema';
import { ExternalIdentity, ExternalIdentitySchema } from './identity.schema';
import { IdentityService } from './identity.service';
import { OidcService } from './oidc.service';
import { BusinessSessionService } from './session.service';
import { OidcController } from './oidc.controller';

@Module({
  imports: [UserModule, MongooseModule.forFeature([
    { name: User.name, schema: UserSchema }, { name: ExternalIdentity.name, schema: ExternalIdentitySchema },
  ])],
  providers: [{ provide: OIDC_SETTINGS, useFactory: readOidcConfig }, IdentityService, OidcService, BusinessSessionService],
  controllers: [OidcController],
  exports: [BusinessSessionService, OIDC_SETTINGS],
})
export class OidcModule {}
