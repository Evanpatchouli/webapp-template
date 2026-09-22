import 'reflect-metadata';
import { createHash, randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import mongoose, { Types } from 'mongoose';
import type { Collection } from 'mongoose';
import {
  ExternalIdentitySchema,
  IDENTITY_COLLATION,
} from '../src/auth/identity.schema';

export interface Binding {
  issuer: string;
  sub: string;
  local_user_id: string;
  linked_by: string;
  link_method: string;
}

export class BindingError extends Error {
  constructor(
    readonly code: string,
    readonly row?: number,
  ) {
    super(code);
  }
}

export function validateBindings(input: unknown): Binding[] {
  if (!Array.isArray(input) || input.length === 0)
    throw new BindingError('invalid_manifest');
  const subjects = new Map<string, string>();
  const users = new Map<string, string>();
  return input.map((entry: unknown, row) => {
    const keys = ['issuer', 'sub', 'local_user_id', 'linked_by', 'link_method'];
    if (
      !entry ||
      typeof entry !== 'object' ||
      Array.isArray(entry) ||
      Object.keys(entry).some((key) => !keys.includes(key)) ||
      keys.some((key) => typeof entry[key] !== 'string' || !entry[key].length)
    ) {
      throw new BindingError('invalid_binding', row + 1);
    }
    const binding = entry as Binding;
    let issuer: URL;
    try {
      issuer = new URL(binding.issuer);
    } catch {
      throw new BindingError('invalid_issuer', row + 1);
    }
    if (
      issuer.protocol !== 'https:' ||
      issuer.username ||
      issuer.password ||
      issuer.search ||
      issuer.hash
    ) {
      throw new BindingError('invalid_issuer', row + 1);
    }
    if (!/^[a-f\d]{24}$/i.test(binding.local_user_id))
      throw new BindingError('invalid_user_id', row + 1);
    const normalized = {
      ...binding,
      local_user_id: binding.local_user_id.toLowerCase(),
    };
    const subjectKey = JSON.stringify([binding.issuer, binding.sub]);
    const userKey = JSON.stringify([binding.issuer, normalized.local_user_id]);
    if (
      (subjects.has(subjectKey) &&
        subjects.get(subjectKey) !== normalized.local_user_id) ||
      (users.has(userKey) && users.get(userKey) !== binding.sub)
    ) {
      throw new BindingError('manifest_conflict', row + 1);
    }
    subjects.set(subjectKey, normalized.local_user_id);
    users.set(userKey, binding.sub);
    return normalized;
  });
}

export async function parseArguments(
  args: string[],
): Promise<{ bindings: Binding[]; apply: boolean }> {
  const values = new Map<string, string>();
  let apply = false;
  const allowed = [
    '--file',
    '--issuer',
    '--sub',
    '--local-user-id',
    '--linked-by',
    '--link-method',
  ];
  for (let i = 0; i < args.length; i++) {
    const key = args[i];
    if (key === '--apply' && !apply) {
      apply = true;
      continue;
    }
    if (
      !allowed.includes(key) ||
      values.has(key) ||
      !args[i + 1] ||
      args[i + 1].startsWith('--')
    ) {
      throw new BindingError('invalid_arguments');
    }
    values.set(key, args[++i]);
  }
  if (values.has('--file')) {
    if (values.size !== 1) throw new BindingError('mixed_input_modes');
    let input: unknown;
    try {
      input = JSON.parse(await readFile(values.get('--file')!, 'utf8'));
    } catch {
      throw new BindingError('manifest_read_failed');
    }
    return { bindings: validateBindings(input), apply };
  }
  return {
    bindings: validateBindings([
      {
        issuer: values.get('--issuer'),
        sub: values.get('--sub'),
        local_user_id: values.get('--local-user-id'),
        linked_by: values.get('--linked-by'),
        link_method: values.get('--link-method'),
      },
    ]),
    apply,
  };
}

// Only a digest and fixed outcome codes are emitted, never connection strings or claims.
export type Audit = (event: {
  row: number;
  fingerprint: string;
  outcome: string;
}) => void;

export async function bindIdentities(
  users: Pick<Collection, 'findOne'>,
  identities: Pick<Collection, 'findOne' | 'insertOne' | 'createIndex'>,
  input: unknown,
  apply: boolean,
  audit: Audit,
): Promise<void> {
  const bindings = validateBindings(input);
  const fingerprint = (binding: Binding) =>
    createHash('sha256')
      .update(
        JSON.stringify([binding.issuer, binding.sub, binding.local_user_id]),
      )
      .digest('hex');
  const check = async (binding: Binding, row: number) => {
    const local_user_id = new Types.ObjectId(binding.local_user_id);
    const user = await users.findOne(
      { _id: local_user_id },
      { projection: { status: 1, deleted_at: 1 } },
    );
    if (!user || user.status !== 1 || user.deleted_at != null)
      throw new BindingError('account_unavailable', row);
    const bySubject = await identities.findOne(
      { issuer: binding.issuer, sub: binding.sub },
      { collation: IDENTITY_COLLATION },
    );
    const byUser = await identities.findOne(
      { issuer: binding.issuer, local_user_id },
      { collation: IDENTITY_COLLATION },
    );
    if (
      (bySubject &&
        bySubject.local_user_id.toString() !== binding.local_user_id) ||
      (byUser && byUser.sub !== binding.sub)
    )
      throw new BindingError('binding_conflict', row);
    return Boolean(bySubject);
  };
  // Entire-batch preflight before even building indexes. Dry-run performs reads only.
  for (const [index, binding] of bindings.entries()) {
    const exists = await check(binding, index + 1);
    audit({
      row: index + 1,
      fingerprint: fingerprint(binding),
      outcome: exists ? 'already_linked' : 'would_link',
    });
  }
  if (!apply) return;
  for (const [keys, options] of ExternalIdentitySchema.indexes()) {
    await identities.createIndex(
      keys as Parameters<Collection['createIndex']>[0],
      {
        name: options.name,
        unique: true,
        collation: IDENTITY_COLLATION,
      },
    );
  }
  for (const [index, binding] of bindings.entries()) {
    const row = index + 1;
    if (await check(binding, row)) {
      audit({
        row,
        fingerprint: fingerprint(binding),
        outcome: 'already_linked',
      });
      continue;
    }
    const now = new Date();
    try {
      await identities.insertOne({
        ...binding,
        local_user_id: new Types.ObjectId(binding.local_user_id),
        linked_at: now,
        created_at: now,
        last_login_at: null,
      });
      audit({ row, fingerprint: fingerprint(binding), outcome: 'linked' });
    } catch (error) {
      // A concurrent identical insert is idempotent; either uniqueness conflict fails closed.
      if ((error as { code?: number }).code !== 11000) throw error;
      if (!(await check(binding, row)))
        throw new BindingError('binding_conflict', row);
      audit({
        row,
        fingerprint: fingerprint(binding),
        outcome: 'already_linked',
      });
    }
  }
}

async function main(): Promise<void> {
  const runId = randomUUID();
  let connection: mongoose.Connection | undefined;
  let apply = false;
  try {
    const parsed = await parseArguments(process.argv.slice(2));
    apply = parsed.apply;
    // Lazy load: importing this tool for tests never reads environment files or connects.
    const { env } =
      require('../src/config/env') as typeof import('../src/config/env');
    if (!env.DB_MONGO_CONNECTION)
      throw new BindingError('database_not_configured');
    connection = mongoose.createConnection(env.DB_MONGO_CONNECTION, {
      user: env.DB_MONGO_USERNAME ?? undefined,
      pass: env.DB_MONGO_PASSWORD ?? undefined,
      autoCreate: false,
      autoIndex: false,
      serverSelectionTimeoutMS: 10000,
    });
    await connection.asPromise();
    await bindIdentities(
      connection.collection('users'),
      connection.collection('external_identities'),
      parsed.bindings,
      apply,
      (event) =>
        console.log(
          JSON.stringify({
            runId,
            mode: apply ? 'apply' : 'dry-run',
            at: new Date().toISOString(),
            ...event,
          }),
        ),
    );
    console.log(
      JSON.stringify({
        runId,
        outcome: 'completed',
        mode: apply ? 'apply' : 'dry-run',
      }),
    );
  } catch (error) {
    console.error(
      JSON.stringify({
        runId,
        mode: apply ? 'apply' : 'dry-run',
        outcome: 'failed',
        code: error instanceof BindingError ? error.code : 'binding_failed',
        row: error instanceof BindingError ? error.row : undefined,
      }),
    );
    process.exitCode = 1;
  } finally {
    if (connection)
      await connection.close().catch(() => {
        process.exitCode = 1;
      });
  }
}

if (require.main === module) void main();
