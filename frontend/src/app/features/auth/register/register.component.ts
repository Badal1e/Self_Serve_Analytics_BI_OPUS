import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="auth-container">
      <div class="auth-card">
        <h2>Create Account</h2>
        <p class="subtitle">Join the analytics platform</p>

        @if (error) {
          <div class="error-banner">{{ error }}</div>
        }
        @if (success) {
          <div class="success-banner">Account created! <a routerLink="/auth/login">Sign in</a></div>
        }

        <form (ngSubmit)="onSubmit()">
          <div class="form-group">
            <label for="name">Full Name</label>
            <input id="name" type="text" [(ngModel)]="fullName" name="fullName" required />
          </div>

          <div class="form-group">
            <label for="email">Email</label>
            <input id="email" type="email" [(ngModel)]="email" name="email" required />
          </div>

          <div class="form-group">
            <label for="password">Password (min 8 characters)</label>
            <input id="password" type="password" [(ngModel)]="password" name="password" required />
          </div>

          <button type="submit" class="btn-primary" [disabled]="loading">
            {{ loading ? 'Creating...' : 'Create Account' }}
          </button>
        </form>

        <p class="auth-footer">
          Already have an account? <a routerLink="/auth/login">Sign in</a>
        </p>
      </div>
    </div>
  `,
  styles: [
    `
      .auth-container {
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 80vh;
      }
      .auth-card {
        width: 100%;
        max-width: 420px;
        padding: 40px;
        background: white;
        border-radius: 12px;
        box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
      }
      h2 { margin: 0 0 4px; color: #1a1a2e; }
      .subtitle { color: #888; margin-bottom: 24px; }
      .error-banner { background: #f8d7da; color: #721c24; padding: 10px 16px; border-radius: 6px; margin-bottom: 16px; font-size: 0.9rem; }
      .success-banner { background: #d4edda; color: #155724; padding: 10px 16px; border-radius: 6px; margin-bottom: 16px; font-size: 0.9rem; }
      .success-banner a { color: #155724; font-weight: 600; }
      .form-group { margin-bottom: 16px; }
      label { display: block; margin-bottom: 4px; font-weight: 500; font-size: 0.9rem; color: #444; }
      input { width: 100%; padding: 10px 14px; border: 1px solid #ddd; border-radius: 8px; font-size: 1rem; box-sizing: border-box; }
      input:focus { outline: none; border-color: #e94560; }
      .btn-primary { width: 100%; padding: 12px; background: #e94560; color: white; border: none; border-radius: 8px; font-size: 1rem; font-weight: 600; cursor: pointer; }
      .btn-primary:hover:not(:disabled) { background: #d63851; }
      .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
      .auth-footer { text-align: center; margin-top: 16px; color: #888; font-size: 0.9rem; }
      .auth-footer a { color: #e94560; text-decoration: none; font-weight: 500; }
    `,
  ],
})
export class RegisterComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  fullName = '';
  email = '';
  password = '';
  error = '';
  success = false;
  loading = false;

  onSubmit(): void {
    this.error = '';
    this.success = false;
    this.loading = true;

    this.auth
      .register({ email: this.email, password: this.password, full_name: this.fullName })
      .subscribe({
        next: () => {
          this.success = true;
          this.loading = false;
        },
        error: (err) => {
          this.error = err.message || 'Registration failed';
          this.loading = false;
        },
      });
  }
}
