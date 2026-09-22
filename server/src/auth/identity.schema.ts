import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';

export type ExternalIdentityDocument = HydratedDocument<ExternalIdentity>;
export const IDENTITY_COLLATION = { locale: 'simple' } as const;

@Schema({
  collection: 'external_identities',
  collation: IDENTITY_COLLATION,
  versionKey: false,
})
export class ExternalIdentity {
  @Prop({ type: String, required: true, immutable: true })
  issuer: string;

  @Prop({ type: String, required: true, immutable: true })
  sub: string;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'User',
    required: true,
    immutable: true,
  })
  local_user_id: Types.ObjectId;

  @Prop({ type: String, required: true, immutable: true })
  linked_by: string;

  @Prop({ type: String, required: true, immutable: true })
  link_method: string;

  @Prop({ type: Date, default: Date.now, immutable: true })
  linked_at: Date;

  @Prop({ type: Date, default: Date.now, immutable: true })
  created_at: Date;

  @Prop({ type: Date, default: null })
  last_login_at: Date | null;
}

export const ExternalIdentitySchema =
  SchemaFactory.createForClass(ExternalIdentity);
ExternalIdentitySchema.index(
  { issuer: 1, sub: 1 },
  { unique: true, collation: IDENTITY_COLLATION, name: 'issuer_sub_unique' },
);
ExternalIdentitySchema.index(
  { issuer: 1, local_user_id: 1 },
  { unique: true, collation: IDENTITY_COLLATION, name: 'issuer_user_unique' },
);
