import { Inject, Injectable, OnModuleInit, ServiceUnavailableException, UnauthorizedException } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';
import { OIDC_SETTINGS, type OidcSettings } from './oidc.config';
import { IdentityService } from './identity.service';
import type { Request } from 'express';

interface SessionRecord {
  _id: string; userId: string; identityId: string; sealedToken: string;
  expiresAt: Date; absoluteExpiresAt: Date; authVersion: number;
}
interface Transaction {
  _id: string; binding: string; kind: 'login' | 'logout'; payload: string; expiresAt: Date;
}

@Injectable()
export class BusinessSessionService implements OnModuleInit {
  constructor(@InjectConnection() private readonly connection: Connection,
    @Inject(OIDC_SETTINGS) private readonly settings: OidcSettings,
    private readonly identities: IdentityService) {}

  private get sessions() { return this.connection.db!.collection<SessionRecord>('auth_sessions'); }
  private get transactions() { return this.connection.db!.collection<Transaction>('auth_transactions'); }

  async onModuleInit() {
    await this.sessions.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
    await this.sessions.createIndex({ userId: 1 });
    await this.transactions.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
    await this.transactions.createIndex({ binding: 1, kind: 1 });
  }

  private hash(value: string) { return createHash('sha256').update(value).digest('hex'); }
  private seal(value: string) {
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', this.settings.encryptionKey, iv);
    const ciphertext = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
    return Buffer.concat([iv, cipher.getAuthTag(), ciphertext]).toString('base64');
  }
  private unseal(value: string) {
    const bytes = Buffer.from(value, 'base64');
    const decipher = createDecipheriv('aes-256-gcm', this.settings.encryptionKey, bytes.subarray(0, 12));
    decipher.setAuthTag(bytes.subarray(12, 28));
    return Buffer.concat([decipher.update(bytes.subarray(28)), decipher.final()]).toString('utf8');
  }

  async transaction(state: string, binding: string, kind: Transaction['kind'], payload: object) {
    const active = await this.transactions.countDocuments({ binding: this.hash(binding), kind, expiresAt: { $gt: new Date() } });
    if (active >= 8) throw new ServiceUnavailableException('Too many pending authentication requests');
    await this.transactions.insertOne({ _id: this.hash(state), binding: this.hash(binding), kind,
      payload: this.seal(JSON.stringify(payload)), expiresAt: new Date(Date.now() + 300_000) });
  }

  async consume<T>(state: string, binding: string, kind: Transaction['kind']): Promise<T> {
    const transaction = await this.transactions.findOneAndDelete({
      _id: this.hash(state), binding: this.hash(binding), kind, expiresAt: { $gt: new Date() },
    });
    if (!transaction) throw new UnauthorizedException('Invalid or expired authentication transaction');
    return JSON.parse(this.unseal(transaction.payload)) as T;
  }

  async create(sessionId: string, userId: string, identityId: string, idToken: string, authVersion: number) {
    const now = Date.now();
    await this.sessions.insertOne({ _id: this.hash(sessionId), userId, identityId, authVersion,
      sealedToken: this.seal(idToken), expiresAt: new Date(now + this.settings.idleSeconds * 1000),
      absoluteExpiresAt: new Date(now + this.settings.absoluteSeconds * 1000) });
  }

  async authenticate(req: Request) {
    const record = await this.read(req.sessionID);
    if (!record) throw new UnauthorizedException('请重新登录');
    const user = await this.identities.forSession(record.userId, record.identityId).catch(async (error: unknown) => {
      if (error instanceof UnauthorizedException) await this.revoke(req.sessionID);
      throw error;
    });
    if (user.authVersion !== record.authVersion) {
      await this.revoke(req.sessionID);
      throw new UnauthorizedException('Session revoked');
    }
    const expiresAt = new Date(Math.min(Date.now() + this.settings.idleSeconds * 1000, record.absoluteExpiresAt.getTime()));
    const touched = await this.sessions.updateOne({ _id: record._id, expiresAt: { $gt: new Date() } }, { $set: { expiresAt } });
    if (!touched.matchedCount) throw new UnauthorizedException('Session revoked');
    req.session.cookie.maxAge = Math.max(1, expiresAt.getTime() - Date.now());
    return user;
  }

  async read(sessionId: string): Promise<SessionRecord | null> {
    const now = new Date();
    return this.sessions.findOne({ _id: this.hash(sessionId), expiresAt: { $gt: now }, absoluteExpiresAt: { $gt: now } });
  }
  async takeTokenAndRevoke(sessionId: string) {
    const record = await this.sessions.findOneAndDelete({ _id: this.hash(sessionId) });
    if (!record || record.expiresAt.getTime() <= Date.now() || record.absoluteExpiresAt.getTime() <= Date.now()) return undefined;
    return this.unseal(record.sealedToken);
  }
  async revoke(sessionId: string) { await this.sessions.deleteOne({ _id: this.hash(sessionId) }); }
}
