import { Injectable } from '@angular/core';
import { TokenClaims } from '../models/user.models';

/**
 * Manages JWT access & refresh tokens in localStorage.
 * Never logs token values — only references key names (NFR-014).
 */
@Injectable({ providedIn: 'root' })
export class TokenService {
  private readonly ACCESS_KEY  = 'sw_access_token';
  private readonly REFRESH_KEY = 'sw_refresh_token';

  // ── Store ─────────────────────────────────────────────────────────────────
  setTokens(accessToken: string, refreshToken: string): void {
    try {
      localStorage.setItem(this.ACCESS_KEY,  accessToken);
      localStorage.setItem(this.REFRESH_KEY, refreshToken);
    } catch { /* storage unavailable */ }
  }

  // ── Read ──────────────────────────────────────────────────────────────────
  getAccessToken(): string | null {
    return localStorage.getItem(this.ACCESS_KEY);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_KEY);
  }

  // ── Clear ─────────────────────────────────────────────────────────────────
  clear(): void {
    localStorage.removeItem(this.ACCESS_KEY);
    localStorage.removeItem(this.REFRESH_KEY);
  }

  // ── Validity ──────────────────────────────────────────────────────────────
  isAccessTokenValid(): boolean {
    const token = this.getAccessToken();
    if (!token) return false;
    const claims = this.decode(token);
    if (!claims) return false;
    // Expire 30 s early to avoid edge-case expiry mid-request
    return claims.exp * 1000 > Date.now() + 30_000;
  }

  hasAnyToken(): boolean {
    return !!this.getAccessToken() || !!this.getRefreshToken();
  }

  // ── Decode ────────────────────────────────────────────────────────────────
  decode(token: string): TokenClaims | null {
    try {
      const payload = token.split('.')[1];
      if (!payload) return null;
      // atob handles standard base64; handle URL-safe base64 padding
      const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
      return JSON.parse(json) as TokenClaims;
    } catch {
      return null;
    }
  }

  getClaims(): TokenClaims | null {
    const token = this.getAccessToken();
    return token ? this.decode(token) : null;
  }
}
