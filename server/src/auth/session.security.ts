import { csrfSync } from 'csrf-sync';
import type { Request } from 'express';

export const csrf = csrfSync();

function asError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error));
}

declare module 'express-session' {
  interface SessionData {
    oidcBinding?: string;
  }
}

export function saveSession(req: Request): Promise<void> {
  return new Promise((resolve, reject) => req.session.save((error) => error ? reject(asError(error)) : resolve()));
}

export function destroySession(req: Request): Promise<void> {
  return new Promise((resolve, reject) => req.session.destroy((error) => error ? reject(asError(error)) : resolve()));
}

export function regenerateSession(req: Request): Promise<void> {
  return new Promise((resolve, reject) => req.session.regenerate((error) => error ? reject(asError(error)) : resolve()));
}

export const sessionCookie = { httpOnly: true, secure: true, sameSite: 'lax' as const, path: '/' };

// Hash routes only: reject encoded/absolute destinations and avoid arbitrary redirects.
export function safeReturnTo(value: unknown): string {
  return typeof value === 'string' && /^\/#\/[a-zA-Z0-9/_-]*(?:\?[a-zA-Z0-9._~%=&-]*)?$/.test(value) && value.length < 512
    ? value : '/#/dashboard';
}
