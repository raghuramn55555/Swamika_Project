import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { TokenService } from './token.service';
import {
  UserProfile, UserRole, LoginRequest, RegisterRequest,
  AuthResponse, ApiProblem,
  ROLE_LABELS, ROLE_PERMISSIONS,
} from '../models/user.models';
import { ServiceResult } from '../models/api.models';

const API = '/api/v1';

/**
 * Set to true once the Spring Boot backend is running.
 * While false every call goes through the local mock so the
 * UI works stand-alone during front-end development.
 */
const BACKEND_AVAILABLE = false;

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http   = inject(HttpClient);
  private tokens = inject(TokenService);
  private router = inject(Router);

  // ── Reactive state ────────────────────────────────────────────────────────
  currentUser     = signal<UserProfile | null>(this.loadProfile());
  isAuthenticated = computed(() => this.currentUser() !== null);

  roleLabel = computed(() =>
    ROLE_LABELS[this.currentUser()?.role ?? 'RECRUITER']
  );

  firstName = computed(() =>
    this.currentUser()?.fullName.split(' ')[0] ?? 'there'
  );

  // ── Login ─────────────────────────────────────────────────────────────────
  async login(req: LoginRequest): Promise<ServiceResult> {
    if (!BACKEND_AVAILABLE) return this.mockLogin(req);

    try {
      const res = await firstValueFrom(
        this.http.post<AuthResponse>(`${API}/auth/login`, req)
      );
      this.applyAuthResponse(res);
      return { ok: true };
    } catch (err) {
      if (this.isNetworkError(err)) return this.mockLogin(req);
      return { ok: false, error: this.extractError(err), code: this.extractCode(err) };
    }
  }

  // ── Register ──────────────────────────────────────────────────────────────
  async register(req: RegisterRequest): Promise<ServiceResult> {
    if (!BACKEND_AVAILABLE) return this.mockRegister(req);

    try {
      const res = await firstValueFrom(
        this.http.post<AuthResponse>(`${API}/auth/register`, req)
      );
      this.applyAuthResponse(res);
      return { ok: true };
    } catch (err) {
      if (this.isNetworkError(err)) return this.mockRegister(req);
      return { ok: false, error: this.extractError(err), code: this.extractCode(err) };
    }
  }

  // ── Token refresh ─────────────────────────────────────────────────────────
  async refreshAccessToken(): Promise<boolean> {
    if (!BACKEND_AVAILABLE) return true;   // mock tokens never expire
    const refreshToken = this.tokens.getRefreshToken();
    if (!refreshToken) return false;
    try {
      const res = await firstValueFrom(
        this.http.post<AuthResponse>(`${API}/auth/refresh`, { refreshToken })
      );
      this.applyAuthResponse(res);
      return true;
    } catch {
      this.clearSession();
      return false;
    }
  }

  // ── Logout ────────────────────────────────────────────────────────────────
  async logout(): Promise<void> {
    if (BACKEND_AVAILABLE) {
      try {
        await firstValueFrom(this.http.post(`${API}/auth/logout`, {}));
      } catch { /* best-effort */ }
    }
    this.clearSession();
    this.router.navigate(['/login']);
  }

  // ── Permission helpers ────────────────────────────────────────────────────
  can(permission: string): boolean {
    const role = this.currentUser()?.role;
    return role ? ROLE_PERMISSIONS[role].includes(permission) : false;
  }

  hasRole(...roles: UserRole[]): boolean {
    const role = this.currentUser()?.role;
    return role ? roles.includes(role) : false;
  }

  // ── Session helpers ───────────────────────────────────────────────────────
  private applyAuthResponse(res: AuthResponse): void {
    this.tokens.setTokens(res.accessToken, res.refreshToken);
    this.currentUser.set(res.user);
    this.saveProfile(res.user);
  }

  private clearSession(): void {
    this.tokens.clear();
    this.currentUser.set(null);
    try { localStorage.removeItem('sw_profile'); } catch {}
  }

  private saveProfile(user: UserProfile): void {
    try { localStorage.setItem('sw_profile', JSON.stringify(user)); } catch {}
  }

  private loadProfile(): UserProfile | null {
    try {
      const raw = localStorage.getItem('sw_profile');
      if (!raw) return null;
      if (!this.tokens.hasAnyToken()) return null;
      return JSON.parse(raw) as UserProfile;
    } catch { return null; }
  }

  private isNetworkError(err: unknown): boolean {
    return err instanceof HttpErrorResponse &&
      (err.status === 0 || err.status === 504 || err.status === 502);
  }

  private extractError(err: unknown): string {
    if (err instanceof HttpErrorResponse) {
      const body = err.error as Partial<ApiProblem>;
      if (body?.detail) return body.detail;
      if (err.status === 401) return 'Incorrect email or password.';
      if (err.status === 409) return 'An account with this email already exists.';
      if (err.status === 403) return 'Access denied.';
    }
    return 'Something went wrong. Please try again.';
  }

  private extractCode(err: unknown): string {
    if (err instanceof HttpErrorResponse) {
      return (err.error as Partial<ApiProblem>)?.errorCode ?? '';
    }
    return '';
  }

  // ── Mock implementation (no backend) ─────────────────────────────────────
  private readonly MOCK_USERS_KEY = 'sw_mock_users';

  private mockLogin(req: LoginRequest): ServiceResult {
    const users = this.getMockUsers();
    const stored = users.find(
      u => u.email.toLowerCase() === req.email.toLowerCase() && u._pwd === req.password
    );
    const demo = this.getDemoUser(req.email, req.password);
    const user: UserProfile | null = stored ?? demo;

    if (!user) {
      const emailKnown = users.some(
        u => u.email.toLowerCase() === req.email.toLowerCase()
      );
      return {
        ok: false,
        error: emailKnown
          ? 'Incorrect password. Please try again.'
          : 'No account found with this email address. Please check your credentials.',
      };
    }

    const token = this.buildMockToken(user);
    this.tokens.setTokens(token, 'mock-refresh');
    this.currentUser.set(user);
    this.saveProfile(user);
    return { ok: true };
  }

  private mockRegister(req: RegisterRequest): ServiceResult {
    const users = this.getMockUsers();
    if (users.some(u => u.email.toLowerCase() === req.email.toLowerCase())) {
      return { ok: false, error: 'An account with this email already exists.' };
    }
    const profile: UserProfile = {
      id:           'u-' + Date.now(),
      fullName:     req.fullName,
      email:        req.email,
      role:         req.role,
      organisation: req.organisation,
      createdAt:    new Date().toISOString(),
    };
    users.push({ ...profile, _pwd: req.password } as any);
    try { localStorage.setItem(this.MOCK_USERS_KEY, JSON.stringify(users)); } catch {}

    const token = this.buildMockToken(profile);
    this.tokens.setTokens(token, 'mock-refresh');
    this.currentUser.set(profile);
    this.saveProfile(profile);
    return { ok: true };
  }

  // Built-in demo accounts — any password 6+ chars works
  private getDemoUser(email: string, password: string): UserProfile | null {
    if (password.length < 6) return null;
    const map: Record<string, Omit<UserProfile, 'email'>> = {
      'admin@swamika.be':     { id: 'demo-1', fullName: 'Alex Admin',     role: 'ADMINISTRATOR', createdAt: '' },
      'recruiter@swamika.be': { id: 'demo-2', fullName: 'Rita Recruiter', role: 'RECRUITER',     createdAt: '' },
      'reviewer@swamika.be':  { id: 'demo-3', fullName: 'Hans Reviewer',  role: 'REVIEWER',      createdAt: '' },
      'auditor@swamika.be':   { id: 'demo-4', fullName: 'Ava Auditor',    role: 'AUDITOR',       createdAt: '' },
    };
    const base = map[email.toLowerCase()];
    return base ? { ...base, email } : null;
  }

  private getMockUsers(): (UserProfile & { _pwd: string })[] {
    try {
      const raw = localStorage.getItem(this.MOCK_USERS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  }

  /** Structurally valid (unsigned) JWT for dev — guards and interceptor read it fine */
  private buildMockToken(user: UserProfile): string {
    const now    = Math.floor(Date.now() / 1000);
    const header  = btoa(JSON.stringify({ alg: 'none', typ: 'JWT' }));
    const payload = btoa(JSON.stringify({
      sub: user.id, email: user.email, role: user.role,
      exp: now + 3600, iat: now,
    }));
    return `${header}.${payload}.mock`;
  }
}
