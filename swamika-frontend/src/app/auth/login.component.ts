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
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
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
