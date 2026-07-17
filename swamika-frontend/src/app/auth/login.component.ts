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
  <div class="login-root">

    <!-- ── Left visual panel ─────────────────────────────────────────────── -->
    <aside class="visual-panel">
      <!-- Animated background blobs -->
      <div class="blob blob-1"></div>
      <div class="blob blob-2"></div>
      <div class="blob blob-3"></div>

      <div class="visual-content">
        <!-- Logo -->
        <div class="logo-row">
          <div class="logo-mark">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>
            </svg>
          </div>
          <span class="logo-name">Swamika</span>
        </div>

        <!-- Hero image (AI-CV graphic) -->
        <div class="hero-img-wrap">
          <img src="image.png" alt="AI-powered CV analysis" class="hero-img"
               onerror="this.style.display='none'; this.nextElementSibling.style.display='flex'" />
          <!-- Fallback when image not yet added -->
          <div class="hero-fallback" style="display:none">
            <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" stroke-width="1">
              <path d="M4 4h11l5 5v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z"/>
              <circle cx="9" cy="9" r="2"/><path d="M16 13l-3-3-4 4-2-2-3 3"/>
            </svg>
            <p>Add ai-cv-hero.png to /public</p>
          </div>
        </div>

        <!-- Headline -->
        <div class="visual-text">
          <h1>AI-Driven CV Search</h1>
          <p>Transform unstructured CVs into searchable candidate profiles with evidence-backed ranking.</p>
        </div>

        <!-- Feature pills -->
        <div class="feature-pills">
          <span class="pill"><i class="fa-solid fa-eye-slash"></i> Blind ranking</span>
          <span class="pill"><i class="fa-solid fa-magnifying-glass"></i> Hybrid search</span>
          <span class="pill"><i class="fa-solid fa-users"></i> Team composer</span>
          <span class="pill"><i class="fa-solid fa-shield-halved"></i> Audit trail</span>
        </div>
      </div>

      <div class="visual-footer">© Swamika BV · Version 1.0 · AI Recruitment Platform</div>
    </aside>

    <!-- ── Right form panel ──────────────────────────────────────────────── -->
    <main class="form-panel">

      <!-- Theme toggle -->
      <button class="theme-btn" (click)="theme.toggle()"
              [attr.aria-label]="theme.isDark() ? 'Switch to light mode' : 'Switch to dark mode'">
        @if (theme.isDark()) {
          <i class="fa-solid fa-sun"></i>
        } @else {
          <i class="fa-solid fa-moon"></i>
        }
      </button>

      <!-- Glassmorphism card -->
      <div class="glass-card">

        <div class="card-header">
          <div class="card-logo">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>
            </svg>
          </div>
          <h2>Welcome back</h2>
          <p>Sign in to your recruitment workspace</p>
        </div>

        <form [formGroup]="form" (ngSubmit)="submit()" novalidate autocomplete="on">

          <!-- Email -->
          <div class="field">
            <label for="email">Email address</label>
            <div class="input-row" [class.input-err]="f('email').touched && f('email').invalid">
              <i class="fa-regular fa-envelope input-icon"></i>
              <input id="email" type="email" formControlName="email"
                     placeholder="you@swamika.be" autocomplete="email" />
            </div>
            @if (f('email').touched && f('email').hasError('required')) {
              <span class="err-text">Email is required</span>
            } @else if (f('email').touched && f('email').hasError('email')) {
              <span class="err-text">Enter a valid email address</span>
            }
          </div>

          <!-- Password -->
          <div class="field">
            <label for="password">Password</label>
            <div class="input-row" [class.input-err]="f('password').touched && f('password').invalid">
              <i class="fa-solid fa-lock input-icon"></i>
              <input id="password" [type]="showPwd() ? 'text' : 'password'"
                     formControlName="password" autocomplete="current-password" />
              <button type="button" class="eye-btn"
                      (click)="showPwd.update(v => !v)"
                      [attr.aria-label]="showPwd() ? 'Hide password' : 'Show password'">
                @if (showPwd()) {
                  <i class="fa-regular fa-eye-slash"></i>
                } @else {
                  <i class="fa-regular fa-eye"></i>
                }
              </button>
            </div>
            @if (f('password').touched && f('password').hasError('required')) {
              <span class="err-text">Password is required</span>
            }
          </div>

          <!-- Remember me -->
          <label class="remember-row">
            <input type="checkbox" formControlName="remember" />
            <span>Remember me</span>
          </label>

          <!-- Error banner -->
          @if (errorMsg()) {
            <div class="error-banner" role="alert">
              <i class="fa-solid fa-circle-exclamation"></i>
              {{ errorMsg() }}
            </div>
          }

          <!-- Submit button -->
          <button type="submit" class="submit-btn" [disabled]="loading()">
            @if (loading()) {
              <span class="spin"></span>
              <span>Signing in…</span>
            } @else {
              <i class="fa-solid fa-arrow-right-to-bracket"></i>
              <span>Sign in</span>
            }
          </button>

        </form>

        <div class="card-footer">© Swamika BV · Version 1.0</div>
      </div>
    </main>
  </div>
  `,
  styles: [`
    /* ── Root ───────────────────────────────────────────────────────────── */
    .login-root {
      display: flex;
      min-height: 100vh;
      background: var(--bg);
      color: var(--text);
      font-family: 'Inter', sans-serif;
    }

    /* ── Left visual panel ───────────────────────────────────────────────── */
    .visual-panel {
      flex: 1;
      position: relative;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      padding: 36px 44px 28px;
      background: linear-gradient(135deg, #0f172a 0%, #1e3a5f 40%, #0d4f47 100%);
    }

    @media (max-width: 900px) { .visual-panel { display: none; } }

    /* Animated blobs */
    .blob {
      position: absolute;
      border-radius: 50%;
      filter: blur(60px);
      opacity: 0.25;
      animation: drift 8s ease-in-out infinite alternate;
      pointer-events: none;
    }
    .blob-1 { width: 340px; height: 340px; background: #3b82f6; top: -80px; right: -60px; animation-delay: 0s; }
    .blob-2 { width: 260px; height: 260px; background: #06b6d4; bottom: 60px; left: -40px; animation-delay: 2s; }
    .blob-3 { width: 200px; height: 200px; background: #10b981; top: 45%; right: 15%; animation-delay: 4s; }

    @keyframes drift {
      from { transform: translate(0, 0) scale(1); }
      to   { transform: translate(20px, 30px) scale(1.1); }
    }

    .visual-content {
      position: relative;
      z-index: 2;
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
      gap: 24px;
    }

    /* Logo row */
    .logo-row {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .logo-mark {
      width: 40px;
      height: 40px;
      border-radius: 12px;
      background: rgba(255,255,255,0.15);
      backdrop-filter: blur(8px);
      border: 1px solid rgba(255,255,255,0.2);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      flex-shrink: 0;
    }
    .logo-name {
      font-family: 'Space Grotesk', sans-serif;
      font-size: 1.25rem;
      font-weight: 700;
      color: #fff;
      letter-spacing: -0.3px;
    }

    /* Hero image — constrained so it never overflows */
    .hero-img-wrap {
      border-radius: 16px;
      overflow: hidden;
      border: 1px solid rgba(255,255,255,0.15);
      background: rgba(255,255,255,0.05);
      backdrop-filter: blur(4px);
      width: 100%;
      max-height: 280px;
    }
    .hero-img {
      width: 100%;
      height: 280px;
      object-fit: cover;
      object-position: center;
      display: block;
    }
    .hero-fallback {
      height: 280px;
      display: none;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 12px;
      color: rgba(255,255,255,0.4);
      font-size: 12px;
    }

    /* Headline */
    .visual-text h1 {
      font-family: 'Space Grotesk', sans-serif;
      font-size: 1.6rem;
      font-weight: 700;
      color: #fff;
      margin: 0 0 8px;
      line-height: 1.2;
    }
    .visual-text p {
      font-size: 0.875rem;
      color: rgba(255,255,255,0.6);
      line-height: 1.6;
      margin: 0;
    }

    /* Feature pills */
    .feature-pills {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    .pill {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 14px;
      border-radius: 20px;
      font-size: 0.78rem;
      font-weight: 500;
      background: rgba(255,255,255,0.1);
      border: 1px solid rgba(255,255,255,0.15);
      color: rgba(255,255,255,0.85);
      backdrop-filter: blur(4px);
      white-space: nowrap;
    }
    .pill i { font-size: 11px; }

    .visual-footer {
      position: relative;
      z-index: 2;
      font-size: 11px;
      color: rgba(255,255,255,0.3);
      padding-top: 20px;
    }

    /* ── Right form panel ────────────────────────────────────────────────── */
    .form-panel {
      flex: 0 0 460px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--bg);
      position: relative;
      padding: 24px;
      min-height: 100vh;
    }

    /* Desktop dark mode: slightly deeper than card surface but not harsh */
    html[data-theme="dark"] .form-panel {
      background: #111827;
    }

    @media (max-width: 900px) {
      .form-panel {
        flex: 1;
        background: linear-gradient(160deg, #0f172a 0%, #1a2744 50%, #0d3d38 100%);
      }
      .glass-card {
        background: rgba(255,255,255,0.06);
        border-color: rgba(255,255,255,0.12);
      }
      .card-header h2 { color: #fff; }
      .card-header p  { color: rgba(255,255,255,0.6); }
      .field label    { color: rgba(255,255,255,0.5); }
      .input-row {
        background: rgba(255,255,255,0.08);
        border-color: rgba(255,255,255,0.15);
      }
      .input-row input { color: #fff; }
      .input-row input::placeholder { color: rgba(255,255,255,0.35); }
      .input-icon { color: rgba(255,255,255,0.4); }
      .eye-btn    { color: rgba(255,255,255,0.4); }
      .remember-row { color: rgba(255,255,255,0.55); }
      .card-footer  { color: rgba(255,255,255,0.25); }
    }

    /* Theme button */
    .theme-btn {
      position: absolute;
      top: 20px;
      right: 20px;
      width: 38px;
      height: 38px;
      border-radius: 10px;
      border: 1.5px solid var(--border);
      background: var(--surface);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.2s, transform 0.15s;
      z-index: 10;
    }
    .theme-btn:hover { background: var(--surface-2); transform: scale(1.08); }
    .theme-btn .fa-sun  { font-size: 15px; color: #f59e0b; }
    .theme-btn .fa-moon { font-size: 15px; color: #6366f1; }
    @media (max-width: 900px) {
      .theme-btn {
        background: rgba(255,255,255,0.1);
        border-color: rgba(255,255,255,0.2);
      }
      .theme-btn:hover { background: rgba(255,255,255,0.18); }
    }

    /* ── Glass card ──────────────────────────────────────────────────────── */
    .glass-card {
      width: 100%;
      max-width: 390px;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 20px;
      padding: 36px 32px 28px;
      box-shadow:
        0 0 0 1px rgba(255,255,255,0.05),
        0 4px 6px -1px rgba(0,0,0,0.07),
        0 20px 40px -8px rgba(0,0,0,0.12);
    }

    /* Card header */
    .card-header { margin-bottom: 28px; text-align: center; }
    .card-logo {
      width: 48px;
      height: 48px;
      border-radius: 14px;
      background: linear-gradient(135deg, #0f172a, #1e3a5f);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      margin: 0 auto 16px;
    }
    .card-header h2 {
      font-family: 'Space Grotesk', sans-serif;
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--text);
      margin: 0 0 6px;
    }
    .card-header p {
      font-size: 0.875rem;
      color: var(--text-muted);
      margin: 0;
    }

    /* ── Fields ──────────────────────────────────────────────────────────── */
    .field { margin-bottom: 16px; }
    .field label {
      display: block;
      font-size: 11px;
      font-weight: 700;
      color: var(--text-muted);
      margin-bottom: 7px;
      letter-spacing: 0.06em;
      text-transform: uppercase;
    }
    .input-row {
      display: flex;
      align-items: center;
      border: 1.5px solid var(--border);
      border-radius: 10px;
      background: var(--surface-2);
      transition: border-color 0.15s, box-shadow 0.15s;
      overflow: hidden;
    }
    .input-row:focus-within {
      border-color: #1e3a5f;
      box-shadow: 0 0 0 3px rgba(30,58,95,0.12);
      background: var(--surface);
    }
    .input-row.input-err { border-color: var(--red); }
    .input-row.input-err:focus-within { box-shadow: 0 0 0 3px rgba(178,58,49,0.12); }

    .input-icon {
      padding: 0 11px;
      color: var(--text-faint);
      font-size: 13px;
      flex-shrink: 0;
    }
    .input-row input {
      flex: 1;
      border: none;
      background: transparent;
      padding: 11px 8px 11px 0;
      font-size: 13.5px;
      color: var(--text);
      font-family: 'Inter', sans-serif;
      outline: none;
      min-width: 0;
    }
    .input-row input::placeholder { color: var(--text-faint); }

    .eye-btn {
      background: none;
      border: none;
      padding: 0 11px;
      cursor: pointer;
      color: var(--text-faint);
      display: flex;
      align-items: center;
      font-size: 13px;
    }
    .eye-btn:hover { color: var(--text); }

    .err-text { font-size: 11.5px; color: var(--red); margin-top: 5px; display: block; }

    /* Remember me */
    .remember-row {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
      color: var(--text-muted);
      cursor: pointer;
      margin-bottom: 20px;
      user-select: none;
    }
    .remember-row input { accent-color: #1e3a5f; width: 15px; height: 15px; cursor: pointer; }

    /* Error banner */
    .error-banner {
      display: flex;
      align-items: center;
      gap: 8px;
      background: var(--red-soft);
      border: 1px solid var(--red);
      color: var(--red);
      border-radius: 10px;
      padding: 10px 14px;
      font-size: 13px;
      margin-bottom: 16px;
    }

    /* Submit button */
    .submit-btn {
      width: 100%;
      padding: 13px;
      border: none;
      border-radius: 10px;
      background: linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0d4f47 100%);
      color: #fff;
      font-size: 14px;
      font-weight: 600;
      font-family: 'Inter', sans-serif;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 9px;
      transition: opacity 0.2s, transform 0.15s;
      letter-spacing: 0.01em;
    }
    .submit-btn:hover:not(:disabled) { opacity: 0.88; transform: translateY(-1px); }
    .submit-btn:disabled { opacity: 0.6; cursor: not-allowed; }

    /* Spinner */
    .spin {
      width: 16px;
      height: 16px;
      border-radius: 50%;
      border: 2px solid rgba(255,255,255,0.3);
      border-top-color: #fff;
      animation: spin 0.7s linear infinite;
      flex-shrink: 0;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* Card footer */
    .card-footer {
      margin-top: 22px;
      text-align: center;
      font-size: 11px;
      color: var(--text-faint);
    }
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
