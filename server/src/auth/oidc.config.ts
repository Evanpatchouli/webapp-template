import '../config/env';

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing configuration: ${name}`);
  return value;
}

function seconds(name: string, fallback: number): number {
  const value = Number(process.env[name] ?? fallback);
  if (!Number.isSafeInteger(value) || value <= 0) throw new Error(`Invalid ${name}`);
  return value;
}

export function readOidcConfig() {
  if (process.env.AUTH_MODE && process.env.AUTH_MODE !== 'oidc') {
    throw new Error('This release supports AUTH_MODE=oidc only; no automatic legacy fallback');
  }
  const issuer = new URL(process.env.OIDC_ISSUER ?? 'https://auth.evanpatchouli.space');
  const origin = new URL(required('APP_PUBLIC_ORIGIN'));
  if (issuer.protocol !== 'https:' || issuer.username || issuer.password || issuer.search || issuer.hash) {
    throw new Error('Invalid HTTPS OIDC issuer');
  }
  if (origin.protocol !== 'https:' || origin.href !== `${origin.origin}/`) {
    throw new Error('APP_PUBLIC_ORIGIN must be a bare HTTPS origin');
  }
  const redirectUri = required('OIDC_REDIRECT_URI');
  const logoutRedirectUri = required('OIDC_POST_LOGOUT_REDIRECT_URI');
  if (redirectUri !== `${origin.origin}/api/auth/callback` ||
      logoutRedirectUri !== `${origin.origin}/api/auth/logout/callback`) {
    throw new Error('OIDC redirects must exactly match the configured public origin and callback paths');
  }
  const sessionSecret = required('SESSION_SECRET');
  if (sessionSecret.length < 32) throw new Error('SESSION_SECRET must contain at least 32 characters');
  const encryptionKey = Buffer.from(required('SESSION_ENCRYPTION_KEY'), 'base64');
  if (encryptionKey.length !== 32) throw new Error('SESSION_ENCRYPTION_KEY must be 32 base64-encoded bytes');
  const idleSeconds = seconds('SESSION_IDLE_TTL', 1800);
  const absoluteSeconds = seconds('SESSION_ABSOLUTE_TTL', 28800);
  if (idleSeconds > absoluteSeconds) throw new Error('Idle TTL must not exceed absolute TTL');
  const authMethod = process.env.OIDC_TOKEN_AUTH_METHOD ?? 'client_secret_basic';
  if (!['client_secret_basic', 'client_secret_post'].includes(authMethod)) {
    throw new Error('Unsupported OIDC_TOKEN_AUTH_METHOD');
  }
  return {
    issuer: issuer.href.replace(/\/$/, ''), origin: origin.origin,
    clientId: required('OIDC_CLIENT_ID'), clientSecret: required('OIDC_CLIENT_SECRET'),
    redirectUri, logoutRedirectUri, sessionSecret, encryptionKey, idleSeconds, absoluteSeconds,
    authMethod, cookieName: '__Host-webapp-session',
    trustProxy: process.env.TRUST_PROXY?.split(',').map((entry) => entry.trim()).filter(Boolean) ?? [],
  };
}

export type OidcSettings = ReturnType<typeof readOidcConfig>;
export const OIDC_SETTINGS = Symbol('OIDC_SETTINGS');
