export interface AuthPrincipal {
  id: string;
  username?: string;
  nickname?: string;
  email?: string;
  roles: string[];
  permissions: string[];
}
