import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Model, Types, model } from 'mongoose';
import { IdentityService } from './identity.service';
import {
  ExternalIdentity,
  ExternalIdentitySchema,
  IDENTITY_COLLATION,
} from './identity.schema';
import { User } from '../modules/user-module/user.schema';
import { UserRoleService } from '../modules/user-module/user.service.role';
import {
  bindIdentities,
  BindingError,
  parseArguments,
  validateBindings,
} from '../../scripts/bind-identity';

jest.mock('../modules/user-module/user.service.role', () => ({
  UserRoleService: class {},
}));

const userId = '0123456789abcdef01234567';
const identityId = 'abcdef0123456789abcdef01';
const otherId = '111111111111111111111111';
const binding = {
  issuer: 'https://issuer.example',
  sub: 'Case Sensitive Subject',
      local_user_id: userId,
  linked_by: 'operator/ticket-123',
  link_method: 'reviewed-prebinding',
};
const query = (value: unknown) => {
  const result = {
    collation: jest.fn().mockReturnThis(),
    lean: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    exec: jest.fn().mockResolvedValue(value),
  };
  return result;
};

describe('IdentityService', () => {
  let users: { findOne: jest.Mock };
  let identities: { findOne: jest.Mock; updateOne: jest.Mock };
  let roles: { getRoles: jest.Mock };
  let service: IdentityService;
  const identity = {
    ...binding,
    _id: new Types.ObjectId(identityId),
    local_user_id: new Types.ObjectId(userId),
  };
  const user = {
    _id: new Types.ObjectId(userId),
    username: 'original',
    nickname: 'Original',
    email: 'local@example.test',
    status: 1,
    deleted_at: null,
    password: 'must-not-return',
    isAdmin: true,
  };

  beforeEach(() => {
    users = { findOne: jest.fn().mockReturnValue(query(user)) };
    identities = {
      findOne: jest.fn().mockReturnValue(query(identity)),
      updateOne: jest.fn().mockReturnValue(query({ matchedCount: 1 })),
    };
    roles = { getRoles: jest.fn().mockResolvedValue([]) };
    service = new IdentityService(
      users as unknown as Model<User>,
      identities as unknown as Model<ExternalIdentity>,
      roles as unknown as UserRoleService,
    );
  });

  it('resolves an exact identity to the original user and current local permissions only', async () => {
    roles.getRoles.mockResolvedValue([
      {
        role_code: 'NORMAL_USER',
        status: 1,
        deleted_at: null,
        permissions: [
          { perm_code: 'READ', status: 1 },
          { perm_code: 'READ', status: 1 },
          { perm_code: 'DISABLED', status: 0 },
          { perm_code: 'DELETED', status: 1, deleted_at: new Date() },
        ],
      },
      {
        role_code: 'ADMIN',
        status: 0,
        permissions: [{ perm_code: 'WRITE', status: 1 }],
      },
      { role_code: 'OLD', status: 1, deleted_at: new Date(), permissions: [] },
    ]);
    expect(await service.resolve(binding.issuer, binding.sub)).toEqual({
      id: userId,
      identityId,
      username: user.username,
      nickname: user.nickname,
      email: user.email,
      roles: ['NORMAL_USER'],
      permissions: ['READ'],
      authVersion: 0,
    });
    expect(identities.findOne).toHaveBeenNthCalledWith(1, {
      issuer: binding.issuer,
      sub: binding.sub,
    });
    expect(
      identities.findOne.mock.results[0].value.collation,
    ).toHaveBeenCalledWith(IDENTITY_COLLATION);
    expect(roles.getRoles).toHaveBeenCalledWith(userId, {
      withPermission: true,
    });
    expect(identities.updateOne).toHaveBeenCalledTimes(1);
  });

  it('rejects an unbound subject without JIT or user lookup', async () => {
    identities.findOne.mockReturnValue(query(null));
    await expect(service.resolve(binding.issuer, 'unbound')).rejects.toThrow(
      new ForbiddenException('account_not_linked'),
    );
    expect(users.findOne).not.toHaveBeenCalled();
    expect(identities.updateOne).not.toHaveBeenCalled();
  });

  it.each(['', null, { $ne: null }])(
    'rejects malformed subject %p without querying',
    async (sub) => {
      await expect(
        service.resolve(binding.issuer, sub as string),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(identities.findOne).not.toHaveBeenCalled();
    },
  );

  it('does not normalize issuer or subject, or query by email/openid', async () => {
    await service.resolve('https://issuer.example/Other', ' Subject ');
    expect(identities.findOne).toHaveBeenNthCalledWith(1, {
      issuer: 'https://issuer.example/Other',
      sub: ' Subject ',
    });
  });

  it.each([
    null,
    { ...user, status: 0 },
    { ...user, deleted_at: 1 },
    { ...user, deleted_at: 0 },
  ])('rejects absent, disabled or deleted users', async (value) => {
    users.findOne.mockReturnValue(query(value));
    await expect(
      service.resolve(binding.issuer, binding.sub),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(roles.getRoles).not.toHaveBeenCalled();
    expect(identities.updateOne).not.toHaveBeenCalled();
  });

  it('matches both session identifiers and rejects removed/reassigned mappings', async () => {
    identities.findOne.mockReturnValue(query(null));
    await expect(service.forSession(userId, identityId)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(identities.findOne).toHaveBeenCalledWith({
      _id: new Types.ObjectId(identityId),
      local_user_id: new Types.ObjectId(userId),
    });
    expect(users.findOne).not.toHaveBeenCalled();
  });

  it.each([
    ['bad', identityId],
    [userId, 'bad'],
  ])('rejects invalid session ids', async (uid, iid) => {
    await expect(service.forSession(uid, iid)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(identities.findOne).not.toHaveBeenCalled();
  });

  it('reloads roles and local state on every request without changing login timestamps', async () => {
    roles.getRoles
      .mockResolvedValueOnce([{ role_code: 'ADMIN', status: 1 }])
      .mockResolvedValueOnce([]);
    expect((await service.forSession(userId, identityId)).roles).toEqual([
      'ADMIN',
    ]);
    expect((await service.forSession(userId, identityId)).roles).toEqual([]);
    users.findOne.mockReturnValue(query({ ...user, status: 0 }));
    await expect(service.forSession(userId, identityId)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(identities.findOne).toHaveBeenCalledTimes(3);
    expect(identities.updateOne).not.toHaveBeenCalled();
  });

  it('returns the current authentication version for session revocation', async () => {
    users.findOne
      .mockReturnValueOnce(query({ ...user, auth_version: 3 }))
      .mockReturnValueOnce(query({ ...user, auth_version: 4 }));
    expect((await service.forSession(userId, identityId)).authVersion).toBe(3);
    expect((await service.forSession(userId, identityId)).authVersion).toBe(4);
    expect(users.findOne.mock.results[0].value.select).toHaveBeenCalledWith(
      '+auth_version _id username nickname email status deleted_at',
    );
  });

  it('fails closed if the mapping disappears during login', async () => {
    identities.updateOne.mockReturnValue(query({ matchedCount: 0 }));
    await expect(
      service.resolve(binding.issuer, binding.sub),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('propagates infrastructure failures instead of treating them as unbound accounts', async () => {
    roles.getRoles.mockRejectedValue(new Error('database_unavailable'));
    await expect(service.forSession(userId, identityId)).rejects.toThrow(
      'database_unavailable',
    );
  });
});

describe('ExternalIdentity schema', () => {
  it('uses both exact unique indexes and preserves long case-sensitive subject values', async () => {
    expect(ExternalIdentitySchema.indexes()).toEqual(
      expect.arrayContaining([
        [
          { issuer: 1, sub: 1 },
          expect.objectContaining({
            unique: true,
            collation: { locale: 'simple' },
          }),
        ],
        [
          { issuer: 1, local_user_id: 1 },
          expect.objectContaining({
            unique: true,
            collation: { locale: 'simple' },
          }),
        ],
      ]),
    );
    const Identity = model('IdentitySchemaTest', ExternalIdentitySchema);
    const sub = ` ${'Ab'.repeat(150)} `;
    const doc = new Identity({ ...binding, sub });
    await expect(doc.validate()).resolves.toBeUndefined();
    expect(doc.sub).toBe(sub);
    expect(ExternalIdentitySchema.path('local_user_id').instance).toBe(
      'ObjectId',
    );
    expect(doc.local_user_id).toBeInstanceOf(Types.ObjectId);
    expect(doc.created_at).toBeInstanceOf(Date);
    expect(doc.last_login_at).toBeNull();
  });
});

describe('offline binding CLI (mock collections, no connections)', () => {
  let users: { findOne: jest.Mock };
  let identities: {
    findOne: jest.Mock;
    insertOne: jest.Mock;
    createIndex: jest.Mock;
  };
  let audit: jest.Mock;
  beforeEach(() => {
    users = {
      findOne: jest.fn().mockResolvedValue({ status: 1, deleted_at: null }),
    };
    identities = {
      findOne: jest.fn().mockResolvedValue(null),
      insertOne: jest.fn().mockResolvedValue({}),
      createIndex: jest.fn().mockResolvedValue('index'),
    };
    audit = jest.fn();
  });

  it('defaults to dry-run and requires explicit apply', async () => {
    const args = [
      '--issuer',
      binding.issuer,
      '--sub',
      binding.sub,
      '--local-user-id',
      userId,
      '--linked-by',
      binding.linked_by,
      '--link-method',
      binding.link_method,
    ];
    expect((await parseArguments(args)).apply).toBe(false);
    expect((await parseArguments([...args, '--apply'])).apply).toBe(true);
    await expect(parseArguments([...args, '--force'])).rejects.toThrow(
      'invalid_arguments',
    );
    await expect(
      parseArguments([...args, '--file', 'unused.json']),
    ).rejects.toThrow('mixed_input_modes');
  });

  it('dry-run performs no inserts or index creation and emits no raw account data', async () => {
    await bindIdentities(users, identities, [binding], false, audit);
    expect(identities.insertOne).not.toHaveBeenCalled();
    expect(identities.createIndex).not.toHaveBeenCalled();
    expect(audit).toHaveBeenCalledWith({
      row: 1,
      fingerprint: expect.stringMatching(/^[a-f\d]{64}$/),
      outcome: 'would_link',
    });
    expect(JSON.stringify(audit.mock.calls)).not.toContain(binding.sub);
  });

  it('creates indexes and inserts audit fields without modifying users', async () => {
    await bindIdentities(users, identities, [binding], true, audit);
    expect(identities.createIndex).toHaveBeenCalledTimes(2);
    expect(identities.insertOne).toHaveBeenCalledWith({
      ...binding,
      local_user_id: new Types.ObjectId(userId),
      linked_at: expect.any(Date),
      created_at: expect.any(Date),
      last_login_at: null,
    });
    expect(identities.createIndex.mock.invocationCallOrder[1]).toBeLessThan(
      identities.insertOne.mock.invocationCallOrder[0],
    );
  });

  it('repeated identical binding leaves existing data and audit metadata untouched', async () => {
    identities.findOne.mockResolvedValue({
      ...binding,
      local_user_id: new Types.ObjectId(userId),
    });
    await bindIdentities(users, identities, [binding], true, audit);
    expect(identities.insertOne).not.toHaveBeenCalled();
    expect(audit).toHaveBeenLastCalledWith(
      expect.objectContaining({ outcome: 'already_linked' }),
    );
  });

  it.each([
    [[{ ...binding, local_user_id: otherId }]],
    [[null, { ...binding, sub: 'different' }]],
  ])('rejects conflicts on either unique key', async (results) => {
    for (const value of results)
      identities.findOne.mockResolvedValueOnce(value);
    await expect(
      bindIdentities(users, identities, [binding], true, audit),
    ).rejects.toThrow('binding_conflict');
    expect(identities.insertOne).not.toHaveBeenCalled();
    expect(identities.createIndex).not.toHaveBeenCalled();
  });

  it('preflights the entire batch before any writes', async () => {
    users.findOne
      .mockResolvedValueOnce({ status: 1 })
      .mockResolvedValueOnce({ status: 0 });
    await expect(
      bindIdentities(
        users,
        identities,
        [binding, { ...binding, sub: 'second', local_user_id: otherId }],
        true,
        audit,
      ),
    ).rejects.toThrow('account_unavailable');
    expect(identities.insertOne).not.toHaveBeenCalled();
    expect(identities.createIndex).not.toHaveBeenCalled();
  });

  it.each([null, { status: 0 }, { status: 1, deleted_at: 0 }])(
    'rejects missing/inactive/deleted local users',
    async (user) => {
      users.findOne.mockResolvedValue(user);
      await expect(
        bindIdentities(users, identities, [binding], true, audit),
      ).rejects.toBeInstanceOf(BindingError);
      expect(identities.insertOne).not.toHaveBeenCalled();
    },
  );

  it('accepts a concurrent identical insert without overwriting it', async () => {
    identities.insertOne.mockImplementation(() => {
      identities.findOne.mockResolvedValue({
        ...binding,
        local_user_id: new Types.ObjectId(userId),
      });
      return Promise.reject(Object.assign(new Error('duplicate_key'), { code: 11000 }));
    });
    await bindIdentities(users, identities, [binding], true, audit);
    expect(audit).toHaveBeenLastCalledWith(
      expect.objectContaining({ outcome: 'already_linked' }),
    );
  });

  it('rejects a concurrent conflicting insert', async () => {
    identities.insertOne.mockImplementation(() => {
      identities.findOne.mockResolvedValue({
        ...binding,
        local_user_id: new Types.ObjectId(otherId),
      });
      return Promise.reject(Object.assign(new Error('duplicate_key'), { code: 11000 }));
    });
    await expect(
      bindIdentities(users, identities, [binding], true, audit),
    ).rejects.toThrow('binding_conflict');
  });

  it('refuses writes when unique indexes cannot be established', async () => {
    identities.createIndex.mockRejectedValue(new Error('index_failure'));
    await expect(
      bindIdentities(users, identities, [binding], true, audit),
    ).rejects.toThrow('index_failure');
    expect(identities.insertOne).not.toHaveBeenCalled();
  });

  it('validates conflicting manifests and refuses implicit profile linking/secret fields', () => {
    expect(() =>
      validateBindings([binding, { ...binding, local_user_id: otherId }]),
    ).toThrow('manifest_conflict');
    expect(() =>
      validateBindings([binding, { ...binding, sub: 'other' }]),
    ).toThrow('manifest_conflict');
    expect(() => validateBindings([{ ...binding, token: 'secret' }])).toThrow(
      'invalid_binding',
    );
    expect(() =>
      validateBindings([{ ...binding, local_user_id: 'email@example.test' }]),
    ).toThrow('invalid_user_id');
    expect(() =>
      validateBindings([
        { ...binding, issuer: 'https://user:secret@example.test' },
      ]),
    ).toThrow('invalid_issuer');
    expect(
      validateBindings([
        binding,
        { ...binding, issuer: 'https://other.example' },
      ]),
    ).toHaveLength(2);
    expect(validateBindings([{ ...binding, sub: ' Case ' }])[0].sub).toBe(
      ' Case ',
    );
  });
});
