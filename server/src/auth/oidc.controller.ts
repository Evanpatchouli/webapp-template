import { Controller, Get, Post, Req, Res, Inject, Logger, ServiceUnavailableException, UnauthorizedException } from '@nestjs/common';
import type { Request, Response } from 'express';
import { randomState } from 'openid-client';
import { Auth, Public } from './auth.decorator';
import { OidcService } from './oidc.service';
import { BusinessSessionService } from './session.service';
import { IdentityService } from './identity.service';
import { OIDC_SETTINGS, type OidcSettings } from './oidc.config';
import { csrf, saveSession, destroySession, regenerateSession, safeReturnTo, sessionCookie } from './session.security';
import Resp from '../common/models/Resp';
import { EventEmitter2 } from '@nestjs/event-emitter';
import UserLoginEvent from '../events/user.login.event';
import UserLogoutEvent from '../events/user.logout.event';

@Controller('auth')
export class OidcController {
  private readonly logger = new Logger(OidcController.name);
  constructor(private readonly oidc: OidcService, private readonly sessions: BusinessSessionService,
    private readonly identities: IdentityService, private readonly events: EventEmitter2,
    @Inject(OIDC_SETTINGS) private readonly settings: OidcSettings) {}

  @Public()
  @Get('login')
  async login(@Req() req: Request, @Res() res: Response) {
    try {
      const auth = await this.oidc.authorization();
      req.session.oidcBinding ??= randomState();
      await saveSession(req);
      await this.sessions.transaction(auth.state, req.session.oidcBinding, 'login', {
        verifier: auth.verifier, nonce: auth.nonce, state: auth.state, returnTo: safeReturnTo(req.query.returnTo),
      });
      res.redirect(auth.url);
    } catch {
      this.logger.warn('oidc_login_unavailable');
      throw new ServiceUnavailableException('认证服务暂不可用');
    }
  }

  @Public()
  @Get('callback')
  async callback(@Req() req: Request, @Res() res: Response) {
    try {
      if (typeof req.query.state !== 'string' || !req.session.oidcBinding) throw new UnauthorizedException();
      const transaction = await this.sessions.consume<{ verifier: string; nonce: string; state: string; returnTo: string }>(
        req.query.state, req.session.oidcBinding, 'login');
      // Reconstruct from the configured URL, never from Host / Forwarded headers.
      const callback = new URL(this.settings.redirectUri);
      const query = req.originalUrl.indexOf('?');
      callback.search = query < 0 ? '' : req.originalUrl.slice(query);
      const result = await this.oidc.exchange(callback, transaction);
      const user = await this.identities.resolve(this.settings.issuer, result.sub);
      await this.sessions.revoke(req.sessionID);
      await regenerateSession(req);
      await this.sessions.create(req.sessionID, user.id, user.identityId, result.idToken, user.authVersion);
      try { await saveSession(req); }
      catch (error) { await this.sessions.revoke(req.sessionID); throw error; }
      this.events.emit('user.login', new UserLoginEvent(user.id, req.ip ?? '', Date.now(), 'OIDC'));
      res.redirect(this.settings.origin + safeReturnTo(transaction.returnTo));
    } catch (error) {
      const reason = error instanceof Error && error.message === 'account_not_linked' ? 'account_not_linked' : 'authentication_failed';
      this.logger.warn(reason);
      res.redirect(`${this.settings.origin}/#/login?error=${reason}`);
    }
  }

  @Auth()
  @Get('me')
  me(@Req() req: Request) {
    const user = req.meta!.user!;
    return Resp.success({ id: user.id, nickname: user.nickname, username: user.username,
      email: user.email, roles: user.roles, permissions: user.permissions });
  }

  @Public()
  @Get('csrf')
  async csrfToken(@Req() req: Request) {
    const csrfToken = csrf.generateToken(req);
    await saveSession(req);
    return Resp.success({ csrfToken });
  }

  @Public()
  @Post('logout')
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const record = await this.sessions.read(req.sessionID);
    await this.sessions.revoke(req.sessionID);
    await destroySession(req);
    res.clearCookie(this.settings.cookieName, sessionCookie);
    if (record) this.events.emit('user.logout', new UserLogoutEvent(record.userId));
    return Resp.success();
  }

  @Public()
  @Post('logout/sso')
  async logoutSso(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const idToken = await this.sessions.takeTokenAndRevoke(req.sessionID);
    await destroySession(req);
    res.clearCookie(this.settings.cookieName, sessionCookie);
    if (!idToken) return Resp.success({ url: `${this.settings.origin}/#/login` });
    try {
      const state = randomState();
      // A separate short-lived browser binding survives destruction of the business session.
      const binding = randomState();
      await this.sessions.transaction(state, binding, 'logout', {});
      const url = await this.oidc.logout(idToken, state);
      res.cookie('__Host-webapp-logout', binding, { ...sessionCookie, maxAge: 300_000 });
      return Resp.success({ url });
    } catch {
      this.logger.warn('sso_logout_unconfirmed');
      throw new ServiceUnavailableException('当前应用已退出，中心退出未确认');
    }
  }

  @Public()
  @Get('logout/callback')
  async logoutCallback(@Req() req: Request, @Res() res: Response) {
    // Only read our fixed-name opaque cookie; never deserialize untrusted session contents.
    const binding = req.headers.cookie?.split(';').map((part) => part.trim()).find((part) => part.startsWith('__Host-webapp-logout='))?.slice('__Host-webapp-logout='.length);
    res.clearCookie('__Host-webapp-logout', sessionCookie);
    if (!binding || typeof req.query.state !== 'string') throw new UnauthorizedException('Invalid logout callback');
    await this.sessions.consume(req.query.state, binding, 'logout');
    res.redirect(`${this.settings.origin}/#/login`);
  }
}
