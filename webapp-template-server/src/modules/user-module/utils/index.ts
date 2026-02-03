import { Maybe } from '@/types';
import {
  signJWTToken,
  signLoginToken,
  AuthTokenPayload,
} from '../../../auth/jwt';

export const generateToken = (
  id: string,
  openid: Maybe<string>,
  phone: Maybe<string>,
  username: Maybe<string>,
  roles: string[],
  permissions: string[],
) => {
  const payload = {
    id,
    openid,
    phone,
    username,
    roles: roles || [],
    permissions: permissions || [],
  } as AuthTokenPayload;
  const jwtoken = signJWTToken(payload);
  return signLoginToken(jwtoken);
};
