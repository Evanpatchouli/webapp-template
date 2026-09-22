import { Inject, Injectable } from '@nestjs/common';
import * as oidc from 'openid-client';
import { OIDC_SETTINGS, type OidcSettings } from './oidc.config';

@Injectable()
export class OidcService {
  private configuration?: Promise<oidc.Configuration>;
  constructor(@Inject(OIDC_SETTINGS) private readonly settings: OidcSettings) {}

  async client(): Promise<oidc.Configuration> {
    if (!this.configuration) {
      const authentication = this.settings.authMethod === 'client_secret_post'
        ? oidc.ClientSecretPost(this.settings.clientSecret)
        : oidc.ClientSecretBasic(this.settings.clientSecret);
      this.configuration = oidc.discovery(new URL(this.settings.issuer), this.settings.clientId,
        { redirect_uris: [this.settings.redirectUri], response_types: ['code'],
          token_endpoint_auth_method: this.settings.authMethod }, authentication, { timeout: 10 }).then((config) => {
        const metadata = config.serverMetadata();
        if (metadata.issuer !== this.settings.issuer || !metadata.code_challenge_methods_supported?.includes('S256')) {
          throw new Error('Unexpected issuer or missing S256 support');
        }
        for (const endpoint of [metadata.authorization_endpoint, metadata.token_endpoint, metadata.jwks_uri]) {
          if (!endpoint || new URL(endpoint).protocol !== 'https:') throw new Error('Invalid OIDC endpoint');
        }
        oidc.enableNonRepudiationChecks(config);
        return config;
      }).catch((error) => { this.configuration = undefined; throw error; });
    }
    return this.configuration;
  }

  async authorization() {
    const config = await this.client();
    const verifier = oidc.randomPKCECodeVerifier();
    const state = oidc.randomState();
    const nonce = oidc.randomNonce();
    const url = oidc.buildAuthorizationUrl(config, {
      response_type: 'code', scope: 'openid profile email', redirect_uri: this.settings.redirectUri,
      code_challenge_method: 'S256', code_challenge: await oidc.calculatePKCECodeChallenge(verifier), state, nonce,
    });
    return { url: url.href, verifier, state, nonce };
  }

  async exchange(url: URL, transaction: { verifier: string; state: string; nonce: string }) {
    const tokens = await oidc.authorizationCodeGrant(await this.client(), url, {
      pkceCodeVerifier: transaction.verifier, expectedState: transaction.state,
      expectedNonce: transaction.nonce, idTokenExpected: true,
    }, { redirect_uri: this.settings.redirectUri });
    const claims = tokens.claims();
    if (!claims?.sub || !tokens.id_token) throw new Error('Missing OIDC identity');
    return { sub: claims.sub, idToken: tokens.id_token };
  }

  async logout(idToken: string, state: string) {
    const config = await this.client();
    const endpoint = config.serverMetadata().end_session_endpoint;
    if (!endpoint || new URL(endpoint).protocol !== 'https:') throw new Error('SSO logout unavailable');
    return oidc.buildEndSessionUrl(config, {
      id_token_hint: idToken, post_logout_redirect_uri: this.settings.logoutRedirectUri, state,
    }).href;
  }
}
