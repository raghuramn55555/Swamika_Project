import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../core/services/auth.service';
import { ThemeService } from '../core/services/theme.service';

@Component({
  selector: 'sw-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
  <div class="login-wrap">

    <!-- ── Left brand panel ─────────────────────────────────────────────── -->
    <aside class="brand-panel">
      <div class="brand-inner">
        <div class="brand-logo">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>
        </div>
        <h1 class="brand-name">Swamika BV</h1>
        <p class="brand-sub">AI-Driven CV Search Engine</p>

        <div class="wf-label">Recruitment Workflow</div>
        <ul class="workflow">
          @for (s of steps; track s.label) {
            <li>
              <div class="wf-icon">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" [innerHTML]="s.path"></svg>
              </div>
              <div>
                <span class="wf-title">{{ s.label }}</span>
                <span class="wf-desc">{{ s.desc }}</span>
              </div>
            </li>
          }
        </ul>
      </div>
      <div class="brand-foot">© Swamika BV &nbsp;·&nbsp; Version 1.0 &nbsp;·&nbsp; AI Recruitment Platform</div>
    </aside>

    <!-- ── Right form panel ─────────────────────────────────────────────── -->
    <main class="form-panel">

      <!-- Theme toggle: shows moon in light mode, sun in dark mode -->
      <button class="theme-toggle-btn" (click)="theme.toggle()"
              [attr.aria-label]="theme.isDark() ? 'Switch to light mode' : 'Switch to dark mode'"
              [title]="theme.isDark() ? 'Switch to light mode' : 'Switch to dark mode'">
        @if (theme.isDark()) {
          <i class="fa-solid fa-sun"></i>
        } @else {
          <i class="fa-solid fa-moon"></i>
        }
      </button>

      <div class="form-box">
        <h2>Sign in</h2>
        <p class="form-sub">Enter your credentials to access your workspace.</p>

        <form [formGroup]="form" (ngSubmit)="submit()" novalidate autocomplete="on">

          <!-- Email -->
          <div class="field-wrap">
            <label class="field-label" for="email">Email address</label>
            <input id="email" type="email" formControlName="email"
                   class="field-input" [class.err]="f('email').touched && f('email').invalid"
                   placeholder="you@swamika.be" autocomplete="email" />
            @if (f('email').touched && f('email').hasError('required')) {
              <span class="field-err">Email is required</span>
            } @else if (f('email').touched && f('email').hasError('email')) {
              <span class="field-err">Enter a valid email address</span>
            }
          </div>

          <!-- Password -->
          <div class="field-wrap">
            <label class="field-label" for="password">Password</label>
            <div class="input-wrap">
              <input id="password" [type]="showPwd() ? 'text' : 'password'"
                     formControlName="password"
                     class="field-input" [class.err]="f('password').touched && f('password').invalid"
                     autocomplete="current-password" />
              <button type="button" class="vis-btn"
                      (click)="showPwd.update(v=>!v)"
                      [attr.aria-label]="showPwd() ? 'Hide password' : 'Show password'">
                @if (showPwd()) {
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                } @else {
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                }
              </button>
            </div>
            @if (f('password').touched && f('password').hasError('required')) {
              <span class="field-err">Password is required</span>
            }
          </div>

          <!-- Remember me -->
          <label class="check-row">
            <input type="checkbox" formControlName="remember" />
            Remember me
          </label>

          <!-- Error banner -->
          @if (errorMsg()) {
            <div class="err-banner" role="alert">{{ errorMsg() }}</div>
          }

          <!-- Submit -->
          <button type="submit" class="submit-btn" [class.loading]="loading()" [disabled]="loading()">
            @if (loading()) {
              <span class="spinner"></span> Signing in…
            } @else {
              Sign in
            }
          </button>

        </form>

        <div class="form-foot">© Swamika BV &nbsp;·&nbsp; Version 1.0 &nbsp;·&nbsp; AI Recruitment Platform</div>
      </div>
    </main>
  </div>
  `,
  styles: [`
    /* ── Root layout ─────────────────────────────────────────────────────── */
    .login-wrap {
      display: flex; min-height: 100vh;
      background: var(--bg); color: var(--text);
    }

    /* ── Brand panel ─────────────────────────────────────────────────────── */
    .brand-panel {
      flex: 1; display: flex; flex-direction: column; justify-content: space-between;
      padding: 44px 44px 32px;
      background: linear-gradient(160deg, #283593 0%, #1a237e 50%, #00695c 100%);
      position: relative; overflow: hidden;
    }
    @media (max-width: 860px) { .brand-panel { display: none; } }
    .brand-inner { position: relative; z-index: 2; max-width: 380px; color: #fff; }
    .brand-logo {
      width: 52px; height: 52px; border-radius: 14px;
      background: rgba(255,255,255,0.15); backdrop-filter: blur(6px);
      display: flex; align-items: center; justify-content: center;
      margin-bottom: 18px; color: #fff;
    }
    .brand-name { font-size: 2rem; font-weight: 700; color: #fff; margin-bottom: 4px; }
    .brand-sub  { font-size: 0.875rem; color: rgba(255,255,255,0.65); margin-bottom: 32px; }
    .wf-label {
      font-size: 10px; font-weight: 700; text-transform: uppercase;
      letter-spacing: 0.1em; color: rgba(255,255,255,0.45); margin-bottom: 16px;
    }
    .workflow { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; }
    .workflow li {
      display: flex; align-items: flex-start; gap: 12px;
      padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.08);
    }
    .workflow li:last-child { border-bottom: none; }
    .wf-icon {
      width: 32px; height: 32px; border-radius: 9px; flex-shrink: 0;
      background: rgba(255,255,255,0.12);
      display: flex; align-items: center; justify-content: center; color: #80cbc4;
    }
    .wf-title { display: block; font-size: 0.875rem; font-weight: 600; color: #fff; }
    .wf-desc  { display: block; font-size: 0.75rem; color: rgba(255,255,255,0.55); margin-top: 2px; }
    .brand-foot { font-size: 11px; color: rgba(255,255,255,0.35); position: relative; z-index: 2; }

    /* ── Form panel ──────────────────────────────────────────────────────── */
    .form-panel {
      flex: 0 0 480px; display: flex; flex-direction: column;
      background: var(--bg); position: relative;
    }
    @media (max-width: 860px) { .form-panel { flex: 1; } }

    /* Theme toggle — top right of form panel */
    .theme-toggle-btn {
      position: absolute; top: 20px; right: 24px;
      width: 38px; height: 38px; border-radius: 10px;
      border: 1.5px solid var(--border); background: var(--surface);
      cursor: pointer; display: flex; align-items: center; justify-content: center;
      transition: background 0.2s, border-color 0.2s, transform 0.15s;
    }
    .theme-toggle-btn .fa-sun  { font-size: 16px; color: #f59e0b; }
    .theme-toggle-btn .fa-moon { font-size: 16px; color: #6366f1; }
    .theme-toggle-btn:hover { background: var(--surface-2); border-color: var(--brand); transform: scale(1.08); }
    .theme-toggle-btn:focus-visible { outline: 2px solid var(--focus); outline-offset: 2px; }

    .form-box {
      flex: 1; display: flex; flex-direction: column; justify-content: center;
      padding: 40px 44px; max-width: 420px; width: 100%; margin: 0 auto;
    }
    h2 { font-size: 1.75rem; font-weight: 700; color: var(--text); margin-bottom: 6px; }
    .form-sub { font-size: 13px; color: var(--text-muted); margin-bottom: 28px; }

    /* Fields — use global tokens, no hardcoded colors */
    .field-wrap { margin-bottom: 16px; }
    .field-label { display: block; font-size: 12px; font-weight: 600; color: var(--text-muted); margin-bottom: 6px; }
    .field-input {
      width: 100%; border: 1px solid var(--border); border-radius: 8px;
      padding: 10px 12px; font-size: 13px;
      background: var(--surface); color: var(--text); font-family: inherit;
      transition: border-color 0.15s;
    }
    .field-input:focus { outline: none; border-color: var(--brand); }
    .field-input.err   { border-color: var(--red); }
    .input-wrap { position: relative; }
    .input-wrap .field-input { padding-right: 40px; }
    .vis-btn {
      position: absolute; right: 10px; top: 50%; transform: translateY(-50%);
      background: none; border: none; cursor: pointer;
      color: var(--text-muted); display: flex; align-items: center;
    }
    .vis-btn:hover { color: var(--text); }
    .field-err { font-size: 11.5px; color: var(--red); margin-top: 4px; display: block; }

    .check-row {
      display: flex; align-items: center; gap: 8px;
      font-size: 12.5px; color: var(--text-muted); cursor: pointer; margin-bottom: 20px;
      input { accent-color: var(--brand); width: 14px; height: 14px; cursor: pointer; }
    }
    .err-banner {
      background: var(--red-soft); border: 1px solid var(--red); color: var(--red);
      border-radius: 8px; padding: 10px 14px; font-size: 12.5px; margin-bottom: 16px;
    }

    /* Submit — extends global .btn */
    .submit-btn {
      width: 100%; padding: 11px; border: none; border-radius: 8px;
      background: var(--brand); color: #fff;
      font-size: 14px; font-weight: 600; cursor: pointer;
      display: flex; align-items: center; justify-content: center; gap: 8px;
      transition: background 0.15s;
    }
    .submit-btn:hover:not(:disabled) { background: var(--brand-strong); }
    .submit-btn:disabled { opacity: 0.7; cursor: not-allowed; }
    .spinner {
      width: 16px; height: 16px; border-radius: 50%;
      border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff;
      animation: spin 0.7s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .form-foot { font-size: 11px; color: var(--text-faint); text-align: center; margin-top: 36px; }
  `],
})
export class LoginComponent {
  private fb     = inject(FormBuilder);
  private auth   = inject(AuthService);
  private router = inject(Router);
  public  theme  = inject(ThemeService);

  loading  = signal(false);
  errorMsg = signal('');
  showPwd  = signal(false);

  form = this.fb.nonNullable.group({
    email:    ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
    remember: [false],
  });

  steps = [
    { label: 'Upload CVs',        desc: 'PDF or DOCX — bulk or single file',              path: '<path d="M12 16V4M6 10l6-6 6 6"/><path d="M4 20h16"/>' },
    { label: 'AI Processing',     desc: 'Extract skills, experience and evidence',         path: '<circle cx="12" cy="12" r="3"/><path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2"/>' },
    { label: 'Search Candidates', desc: 'Natural language or vacancy-driven search',       path: '<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>' },
    { label: 'Compare Profiles',  desc: 'Side-by-side blind or revealed review',          path: '<rect x="2" y="3" width="8" height="18" rx="1.5"/><rect x="14" y="3" width="8" height="18" rx="1.5"/>' },
    { label: 'Create Shortlists', desc: 'Save, annotate and export candidates',           path: '<path d="M5 3h14v18l-7-4-7 4V3z"/>' },
  ];

  f(name: string) { return this.form.get(name)!; }

  async submit(): Promise<void> {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    this.loading.set(true);
    this.errorMsg.set('');
    const { email, password } = this.form.getRawValue();
    const result = await this.auth.login({ email, password });
    this.loading.set(false);
    if (result.ok) {
      this.router.navigate(['/dashboard']);
    } else {
      this.errorMsg.set(result.error ?? 'Sign in failed. Please try again.');
    }
  }
}