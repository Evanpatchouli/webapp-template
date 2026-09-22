import { Maybe } from '@webapp-template/common';
import type { AuthPrincipal } from '../auth/principal';

export interface AccessInfo {
  ip: string;
  userAgent: string;
  xtimestamp: Maybe<string | number>;
  xnonce: Maybe<string | number>;
  user?: Maybe<AuthPrincipal>;
}
