import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User } from '../modules/user-module/user.schema';
import { UserRoleService } from '../modules/user-module/user.service.role';
import { ExternalIdentity, IDENTITY_COLLATION } from './identity.schema';
import { PermissionStatus } from '../modules/permission-module/permission.schema';

export interface IdentityPrincipal {
  id: string;
  username: string;
  nickname: string;
  email: string;
  roles: string[];
  permissions: string[];
  identityId: string;
  authVersion: number;
}

@Injectable()
export class IdentityService {
  constructor(
    @InjectModel(User.name) private readonly users: Model<User>,
    @InjectModel(ExternalIdentity.name)
    private readonly identities: Model<ExternalIdentity>,
    private readonly roleService: UserRoleService,
  ) {}

  async resolve(issuer: string, sub: string): Promise<IdentityPrincipal> {
    // Keep the verified issuer/sub byte-for-byte; never query by profile claims.
    if (
      typeof issuer !== 'string' ||
      !issuer ||
      typeof sub !== 'string' ||
      !sub
    ) {
      throw new ForbiddenException('account_not_linked');
    }
    const identity = await this.identities
      .findOne({ issuer, sub })
      .collation(IDENTITY_COLLATION)
      .lean()
      .exec();
    if (!identity) throw new ForbiddenException('account_not_linked');
    const principal = await this.forSession(
      identity.local_user_id.toString(),
      identity._id.toString(),
    );
    const result = await this.identities
      .updateOne(
        {
          _id: identity._id,
          issuer,
          sub,
          local_user_id: identity.local_user_id,
        },
        { $max: { last_login_at: new Date() } },
        { collation: IDENTITY_COLLATION },
      )
      .exec();
    if (result.matchedCount !== 1)
      throw new ForbiddenException('account_not_linked');
    return principal;
  }

  async forSession(
    userId: string,
    identityId: string,
  ): Promise<IdentityPrincipal> {
    if (!this.isId(userId) || !this.isId(identityId)) {
      throw new UnauthorizedException('invalid_session_identity');
    }
    const identity = await this.identities
      .findOne({
        _id: new Types.ObjectId(identityId),
        local_user_id: new Types.ObjectId(userId),
      })
      .collation(IDENTITY_COLLATION)
      .lean()
      .exec();
    if (!identity) throw new UnauthorizedException('invalid_session_identity');
    const user = await this.users
      .findOne({ _id: new Types.ObjectId(userId) })
      .select('+auth_version _id username nickname email status deleted_at')
      .lean()
      .exec();
    if (!user || user.status !== 1 || user.deleted_at != null) {
      throw new UnauthorizedException('account_unavailable');
    }
    const roles = (
      await this.roleService.getRoles(userId, { withPermission: true })
    ).filter((role) => role.status === 1 && role.deleted_at == null);
    return {
      id: user._id.toString(),
      username: user.username ?? '',
      nickname: user.nickname ?? '',
      email: user.email ?? '',
      roles: [...new Set(roles.map((role) => role.role_code))],
      permissions: [
        ...new Set(
          roles.flatMap((role) =>
            (role.permissions ?? [])
              .filter(
                (permission) =>
                  permission.status === PermissionStatus.ENABLED &&
                  permission.deleted_at == null,
              )
              .map((permission) => permission.perm_code),
          ),
        ),
      ],
      identityId: identity._id.toString(),
      authVersion: user.auth_version ?? 0,
    };
  }

  private isId(value: string): boolean {
    return typeof value === 'string' && /^[a-f\d]{24}$/i.test(value);
  }
}
