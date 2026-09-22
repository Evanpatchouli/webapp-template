import { safeReturnTo, sessionCookie } from './session.security';

describe('session security helpers', () => {
  it('accepts only local hash routes for post-login navigation', () => {
    expect(safeReturnTo('/#/dashboard')).toBe('/#/dashboard');
    expect(safeReturnTo('/#/system/user?tab=active')).toBe('/#/system/user?tab=active');
    expect(safeReturnTo('https://attacker.example/')).toBe('/#/dashboard');
    expect(safeReturnTo('//attacker.example/')).toBe('/#/dashboard');
    expect(safeReturnTo('/#/../../secrets')).toBe('/#/dashboard');
    expect(safeReturnTo('/#/dashboard%0d%0aLocation:%20https://attacker.example')).toBe('/#/dashboard');
  });

  it('uses a host-only secure session cookie', () => {
    expect(sessionCookie).toEqual({
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
    });
  });
});
