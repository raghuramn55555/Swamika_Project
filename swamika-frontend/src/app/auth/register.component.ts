// admin@swamika.be	demo123	Administrator
// recruiter@swamika.be	demo123	Recruiter
// reviewer@swamika.be	demo123	Reviewer
// auditor@swamika.be	demo123	Auditor
// role descriptions for login
import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatDividerModule } from '@angular/material/divider';
import { MatStepperModule } from '@angular/material/stepper';

import { AuthService } from '../core/services/auth.service';
import { ThemeService } from '../core/services/theme.service';
import { UserRole, ROLE_DESCRIPTIONS } from '../core/models/user.models';

function passwordMatchValidator(group: AbstractControl): ValidationErrors | null {
  const pw  = group.get('password')?.value;
  const cpw = group.get('confirmPassword')?.value;
  return pw && cpw && pw !== cpw ? { passwordMismatch: true } : null;
}

@Component({
  selector: 'sw-register',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, RouterLink,
    MatFormFieldModule, MatInputModule, MatButtonModule,
    MatIconModule, MatProgressSpinnerModule, MatSelectModule,
    MatDividerModule, MatStepperModule,
  ],
  template: `
    <div class="auth-root">

      <!-- ── Left brand panel ──────────────────────────────────────────────── -->
      <aside class="brand-panel" aria-hidden="true">
        <div class="brand-inner">
          <div class="brand-logo">
            <mat-icon>manage_search</mat-icon>
          </div>
          <h1 class="brand-name">Swamika</h1>
          <p class="brand-tagline">AI-Driven CV Search Engine</p>
          <mat-divider class="brand-divider"></mat-divider>

          <!-- Role cards -->
          <p class="brand-section-label">Available roles</p>
          <div class="role-cards">
            @for (r of roles; track r.value) {
              <div class="role-card" [class.active]="selectedRole() === r.value">
                <mat-icon>{{ r.icon }}</mat-icon>
                <div>
                  <strong>{{ r.label }}</strong>
                  <span>{{ r.desc }}</span>
                </div>
              </div>
            }
          </div>
        </div>
        <div class="deco deco-1"></div>
        <div class="deco deco-2"></div>
      </aside>

      <!-- ── Right form panel ──────────────────────────────────────────────── -->
      <main class="form-panel">

        <div class="form-topbar">
          <div class="mobile-logo">
            <mat-icon>manage_search</mat-icon>
            <span>Swamika</span>
          </div>
          <button mat-icon-button (click)="theme.toggle()" class="theme-btn"
                  [attr.aria-label]="theme.isDark() ? 'Switch to light mode' : 'Switch to dark mode'">
            <mat-icon>{{ theme.isDark() ? 'light_mode' : 'dark_mode' }}</mat-icon>
          </button>
        </div>

        <div class="form-card">

          <div class="form-header">
            <h2>Create account</h2>
            <p>Register to access the Swamika recruitment workspace.</p>
          </div>

          <form [formGroup]="form" (ngSubmit)="submit()" novalidate autocomplete="on">

            <!-- Full name -->
            <mat-form-field appearance="outline" class="field-full">
              <mat-label>Full name</mat-label>
              <mat-icon matPrefix>person</mat-icon>
              <input matInput formControlName="fullName"
                     placeholder="e.g. Jane Smith"
                     autocomplete="name" />
              @if (fc('fullName').touched && fc('fullName').hasError('required')) {
                <mat-error>Full name is required</mat-error>
              } @else if (fc('fullName').touched && fc('fullName').hasError('minlength')) {
                <mat-error>At least 2 characters required</mat-error>
              }
            </mat-form-field>

            <!-- Email -->
            <mat-form-field appearance="outline" class="field-full">
              <mat-label>Work email address</mat-label>
              <mat-icon matPrefix>email</mat-icon>
              <input matInput type="email" formControlName="email"
                     placeholder="you@organisation.com"
                     autocomplete="email" />
              @if (fc('email').touched && fc('email').hasError('required')) {
                <mat-error>Email is required</mat-error>
              } @else if (fc('email').touched && fc('email').hasError('email')) {
                <mat-error>Enter a valid email address</mat-error>
              }
            </mat-form-field>

            <!-- Organisation -->
            <mat-form-field appearance="outline" class="field-full">
              <mat-label>Organisation <span class="optional">(optional)</span></mat-label>
              <mat-icon matPrefix>business</mat-icon>
              <input matInput formControlName="organisation"
                     placeholder="e.g. Swamika BV"
                     autocomplete="organization" />
            </mat-form-field>

            <!-- Role -->
            <mat-form-field appearance="outline" class="field-full">
              <mat-label>Role</mat-label>
              <mat-icon matPrefix>badge</mat-icon>
              <mat-select formControlName="role"
                          (selectionChange)="selectedRole.set($event.value)">
                @for (r of roles; track r.value) {
                  <mat-option [value]="r.value">
                    <div class="role-option">
                      <mat-icon>{{ r.icon }}</mat-icon>
                      <div>
                        <span class="role-opt-label">{{ r.label }}</span>
                        <span class="role-opt-desc">{{ r.shortDesc }}</span>
                      </div>
                    </div>
                  </mat-option>
                }
              </mat-select>
              @if (fc('role').touched && fc('role').hasError('required')) {
                <mat-error>Please select a role</mat-error>
              }
            </mat-form-field>

            <!-- Role description hint -->
            @if (selectedRole()) {
              <div class="role-hint">
                <mat-icon>info</mat-icon>
                <span>{{ roleDesc() }}</span>
              </div>
            }

            <!-- Password -->
            <mat-form-field appearance="outline" class="field-full">
              <mat-label>Password</mat-label>
              <mat-icon matPrefix>lock</mat-icon>
              <input matInput
                     [type]="showPwd() ? 'text' : 'password'"
                     formControlName="password"
                     autocomplete="new-password" />
              <button mat-icon-button matSuffix type="button"
                      (click)="showPwd.update(v => !v)"
                      [attr.aria-label]="showPwd() ? 'Hide password' : 'Show password'">
                <mat-icon>{{ showPwd() ? 'visibility_off' : 'visibility' }}</mat-icon>
              </button>
              @if (fc('password').touched && fc('password').hasError('required')) {
                <mat-error>Password is required</mat-error>
              } @else if (fc('password').touched && fc('password').hasError('minlength')) {
                <mat-error>Minimum 8 characters required</mat-error>
              }
            </mat-form-field>

            <!-- Password strength bar -->
            @if (fc('password').value) {
              <div class="strength-wrap">
                <div class="strength-bar">
                  @for (i of [0,1,2,3]; track i) {
                    <div class="strength-seg"
                         [class.active]="pwStrength() > i"
                         [class]="'strength-seg s-' + pwStrength()"></div>
                  }
                </div>
                <span class="strength-label" [class]="'sl-' + pwStrength()">
                  {{ ['', 'Weak', 'Fair', 'Good', 'Strong'][pwStrength()] }}
                </span>
              </div>
            }

            <!-- Confirm password -->
            <mat-form-field appearance="outline" class="field-full">
              <mat-label>Confirm password</mat-label>
              <mat-icon matPrefix>lock_reset</mat-icon>
              <input matInput
                     [type]="showCpwd() ? 'text' : 'password'"
                     formControlName="confirmPassword"
                     autocomplete="new-password" />
              <button mat-icon-button matSuffix type="button"
                      (click)="showCpwd.update(v => !v)"
                      [attr.aria-label]="showCpwd() ? 'Hide confirm password' : 'Show confirm password'">
                <mat-icon>{{ showCpwd() ? 'visibility_off' : 'visibility' }}</mat-icon>
              </button>
              @if (fc('confirmPassword').touched && form.hasError('passwordMismatch')) {
                <mat-error>Passwords do not match</mat-error>
              }
            </mat-form-field>

            <!-- Error banner -->
            @if (errorMsg()) {
              <div class="alert-error" role="alert">
                <mat-icon>error_outline</mat-icon>
                <span>{{ errorMsg() }}</span>
              </div>
            }

            <!-- Submit -->
            <button mat-raised-button color="primary"
                    type="submit" class="btn-submit"
                    [disabled]="loading()">
              @if (loading()) {
                <mat-spinner diameter="18"></mat-spinner>
                <span>Creating account…</span>
              } @else {
                <ng-container>
                  <mat-icon>person_add</mat-icon>
                  <span>Create account</span>
                </ng-container>
              }
            </button>

          </form>

          <mat-divider class="section-divider"></mat-divider>
          <p class="switch-auth">
            Already have an account?
            <a routerLink="/login" class="link-primary">Sign in</a>
          </p>

        </div>
      </main>
    </div>
  `,
  styles: [`
    .auth-root {
      min-height: 100vh; display: flex;
      background: var(--sw-bg); color: var(--sw-text);
    }

    // ── Brand panel ───────────────────────────────────────────────────────────
    .brand-panel {
      flex: 1; position: relative; overflow: hidden;
      background: linear-gradient(160deg, #283593 0%, #1a237e 45%, #00695c 100%);
      display: flex; align-items: center; justify-content: center;
      padding: 48px 40px;
      @media (max-width: 860px) { display: none; }
    }
    .brand-inner { position: relative; z-index: 2; max-width: 400px; color: #fff; }
    .brand-logo {
      width: 64px; height: 64px; background: rgba(255,255,255,0.15);
      border-radius: 18px; display: flex; align-items: center; justify-content: center;
      backdrop-filter: blur(8px); margin-bottom: 20px;
      mat-icon { font-size: 34px; width: 34px; height: 34px; color: #fff; }
    }
    .brand-name { font-size: 2.2rem; font-weight: 700; color: #fff; margin-bottom: 6px; }
    .brand-tagline { font-size: 0.95rem; color: rgba(255,255,255,0.7); margin-bottom: 24px; }
    .brand-divider { border-color: rgba(255,255,255,0.2) !important; margin-bottom: 20px; }
    .brand-section-label {
      font-size: 0.72rem; font-weight: 700; text-transform: uppercase;
      letter-spacing: 0.08em; color: rgba(255,255,255,0.5); margin-bottom: 12px;
    }
    .role-cards { display: flex; flex-direction: column; gap: 10px; }
    .role-card {
      display: flex; align-items: flex-start; gap: 12px;
      padding: 12px 14px; border-radius: 10px;
      border: 1px solid rgba(255,255,255,0.1);
      background: rgba(255,255,255,0.05);
      transition: background 0.2s, border-color 0.2s;

      &.active {
        background: rgba(255,255,255,0.15);
        border-color: rgba(255,255,255,0.4);
      }
      mat-icon { font-size: 20px; width: 20px; height: 20px; color: #80cbc4; flex-shrink: 0; margin-top: 2px; }
      strong { display: block; font-size: 0.85rem; color: #fff; margin-bottom: 2px; }
      span { font-size: 0.73rem; color: rgba(255,255,255,0.6); line-height: 1.4; }
    }
    .deco { position: absolute; border-radius: 50%; background: rgba(255,255,255,0.05); z-index: 1; }
    .deco-1 { width: 380px; height: 380px; top: -100px; right: -120px; }
    .deco-2 { width: 260px; height: 260px; bottom: -80px; left: -60px; }

    // ── Form panel ────────────────────────────────────────────────────────────
    .form-panel {
      flex: 0 0 520px; display: flex; flex-direction: column;
      background: var(--sw-bg); overflow-y: auto;
      @media (max-width: 860px) { flex: 1; }
    }
    .form-topbar {
      display: flex; align-items: center; justify-content: space-between;
      padding: 16px 40px 0;
    }
    .mobile-logo {
      display: none; align-items: center; gap: 8px;
      font-size: 1.1rem; font-weight: 700; color: var(--sw-primary);
      mat-icon { font-size: 24px; width: 24px; height: 24px; }
      @media (max-width: 860px) { display: flex; }
    }
    .theme-btn { color: var(--sw-text-muted); margin-left: auto; }
    .form-card {
      flex: 1; display: flex; flex-direction: column; justify-content: center;
      padding: 28px 40px 40px; max-width: 440px; width: 100%; margin: 0 auto;
      @media (max-width: 480px) { padding: 20px 20px; }
    }
    .form-header {
      margin-bottom: 24px;
      h2 { font-size: 1.75rem; font-weight: 700; color: var(--sw-text); margin-bottom: 6px; }
      p  { font-size: 0.875rem; color: var(--sw-text-muted); line-height: 1.5; }
    }
    .field-full { width: 100%; margin-bottom: 2px; }
    .optional { font-size: 0.78rem; color: var(--sw-text-muted); font-style: italic; }

    // ── Role option in dropdown ───────────────────────────────────────────────
    .role-option { display: flex; align-items: center; gap: 10px;
      mat-icon { font-size: 18px; width: 18px; height: 18px; color: var(--sw-primary); } }
    .role-opt-label { display: block; font-size: 0.875rem; font-weight: 500; }
    .role-opt-desc  { display: block; font-size: 0.72rem; color: var(--sw-text-muted); }

    // ── Role hint ─────────────────────────────────────────────────────────────
    .role-hint {
      display: flex; align-items: flex-start; gap: 8px;
      padding: 10px 12px; margin-bottom: 8px;
      background: rgba(57,73,171,0.08); border-radius: 8px;
      border-left: 3px solid var(--sw-primary);
      font-size: 0.8rem; color: var(--sw-text-muted); line-height: 1.4;
      mat-icon { font-size: 16px; width: 16px; height: 16px; color: var(--sw-primary); flex-shrink: 0; margin-top: 1px; }
    }

    // ── Password strength ─────────────────────────────────────────────────────
    .strength-wrap {
      display: flex; align-items: center; gap: 10px;
      margin: -4px 0 10px;
    }
    .strength-bar { display: flex; gap: 4px; flex: 1; }
    .strength-seg {
      height: 4px; flex: 1; border-radius: 4px;
      background: var(--sw-border); transition: background 0.2s;
      &.active.s-1 { background: #e53935; }
      &.active.s-2 { background: #fb8c00; }
      &.active.s-3 { background: #43a047; }
      &.active.s-4 { background: #1b5e20; }
    }
    .strength-label { font-size: 0.72rem; font-weight: 600; min-width: 44px; text-align: right;
      &.sl-1 { color: #e53935; } &.sl-2 { color: #fb8c00; }
      &.sl-3 { color: #43a047; } &.sl-4 { color: #1b5e20; } }

    // ── Alert / buttons / divider ─────────────────────────────────────────────
    .alert-error {
      display: flex; align-items: center; gap: 10px;
      padding: 10px 14px; margin-bottom: 16px;
      background: #fff0f0; border: 1px solid #ffcdd2;
      border-radius: 8px; color: #c62828; font-size: 0.84rem;
      mat-icon { font-size: 18px; width: 18px; height: 18px; flex-shrink: 0; }
      .dark-theme & { background: #2d1010; border-color: #b71c1c; color: #ef9a9a; }
    }
    .btn-submit {
      width: 100%; height: 48px; font-size: 0.95rem; font-weight: 600;
      border-radius: 10px;
      display: flex; align-items: center; justify-content: center; gap: 8px;
      margin-top: 4px;
    }
    .section-divider { margin: 24px 0 16px; }
    .switch-auth { text-align: center; font-size: 0.875rem; color: var(--sw-text-muted); }
    .link-primary {
      color: var(--sw-primary); font-weight: 600; text-decoration: none;
      &:hover { text-decoration: underline; }
    }
  `],
})
export class RegisterComponent {
  private fb     = inject(FormBuilder);
  private auth   = inject(AuthService);
  private router = inject(Router);
  public  theme  = inject(ThemeService);

  loading      = signal(false);
  errorMsg     = signal('');
  showPwd      = signal(false);
  showCpwd     = signal(false);
  selectedRole = signal<UserRole | ''>('');

  roles: { value: UserRole; label: string; icon: string; desc: string; shortDesc: string }[] = [
    {
      value: 'RECRUITER',
      label: 'Recruiter',
      icon: 'person_search',
      desc:  ROLE_DESCRIPTIONS.RECRUITER,
      shortDesc: 'Upload CVs, run searches, manage shortlists',
    },
    {
      value: 'REVIEWER',
      label: 'Reviewer / Hiring Manager',
      icon: 'rate_review',
      desc:  ROLE_DESCRIPTIONS.REVIEWER,
      shortDesc: 'View results and provide relevance feedback',
    },
    {
      value: 'ADMINISTRATOR',
      label: 'Administrator',
      icon: 'admin_panel_settings',
      desc:  ROLE_DESCRIPTIONS.ADMINISTRATOR,
      shortDesc: 'Configure users, models and settings',
    },
    {
      value: 'AUDITOR',
      label: 'Auditor',
      icon: 'policy',
      desc:  ROLE_DESCRIPTIONS.AUDITOR,
      shortDesc: 'Read audit events and search configurations',
    },
  ];

  form = this.fb.nonNullable.group(
    {
      fullName:        ['', [Validators.required, Validators.minLength(2)]],
      email:           ['', [Validators.required, Validators.email]],
      organisation:    [''],
      role:            ['' as UserRole, [Validators.required]],
      password:        ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]],
    },
    { validators: passwordMatchValidator }
  );

  fc(name: string) { return this.form.get(name)!; }

  roleDesc(): string {
    const r = this.selectedRole() as UserRole;
    return r ? ROLE_DESCRIPTIONS[r] : '';
  }

  pwStrength(): number {
    const pw = this.fc('password').value as string;
    if (!pw || pw.length < 6) return 1;
    let score = 0;
    if (pw.length >= 8)  score++;
    if (pw.length >= 12) score++;
    if (/[A-Z]/.test(pw) && /[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    return Math.min(4, Math.max(1, score));
  }

  async submit(): Promise<void> {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    this.loading.set(true);
    this.errorMsg.set('');

    const { fullName, email, password, role, organisation } = this.form.getRawValue();
    const result = await this.auth.register({ fullName, email, password, role: role as UserRole, organisation });

    this.loading.set(false);
    if (result.ok) {
      this.router.navigate(['/dashboard']);
    } else {
      this.errorMsg.set(result.error ?? 'Registration failed. Please try again.');
    }
  }
}