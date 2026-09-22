import mongoose from 'mongoose';
import { ExternalIdentitySchema } from '../auth/identity.schema';

/** Additive migration: create only identity/session indexes. */
export async function v3() {
  const model =
    mongoose.models.ExternalIdentity ??
    mongoose.model('ExternalIdentity', ExternalIdentitySchema);
  await model.createIndexes();
  const db = mongoose.connection.db!;
  await db
    .collection('auth_sessions')
    .createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
  await db.collection('auth_sessions').createIndex({ userId: 1 });
  await db
    .collection('auth_transactions')
    .createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
  await db.collection('auth_transactions').createIndex({ binding: 1, kind: 1 });
}
