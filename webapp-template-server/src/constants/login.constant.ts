import { ValuesOf } from '@/types';

export const LoginTypes = {
  OPENID: 'openid',
  PHONE: 'phone',
  ACCOUNT: 'account',
} as const;

export type LoginType = ValuesOf<typeof LoginTypes>;
