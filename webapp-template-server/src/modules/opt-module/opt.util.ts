import { TimeUnit } from '@/types';
import TimeUnitUtil from '@/utils/time.unit.util';

export type OPT = {
  code: string;
  expiry: number;
};
export const createOPT = (expireIn?: TimeUnit): OPT => {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiry = TimeUnitUtil.toMS(expireIn || '5m');
  return { code, expiry };
};
