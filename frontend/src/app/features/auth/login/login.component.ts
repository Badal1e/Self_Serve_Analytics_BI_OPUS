import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="auth-container">
      <div class="auth-card">
        <h2>Sign In</h2>
        <p class="subtitle">Access your analytics dashboard</p>

        @if (error) {
          <div class="error-banner">{{ error }}</div>
        }

        <form (ngSubmit)="onSubmit()">
          <div class="form-group">
            <label for="email">Email</label>
            <input
              id="email"
              type="email"
              [(ngModel)]="email"
              name="email"
              placeholder="your@email.com"
              required
            />
          </div>

          <div class="form-group">
            <label for="password">Password</label>
            <input
              id="password"
              type="password"
              [(ngModel)]="password"
              name="password"
              placeholder="Enter password"
              required
            />
          </div>

          <button type="submit" class="btn-primary" [disabled]="loading">
            {{ loading ? 'Signing in...' : 'Sign In' }}
          </button>
        </form>

        <p class="auth-footer">
          Don't have an account? <a routerLink="/auth/register">Register</a>
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
      h2 {
        margin: 0 0 4px;
        color: #1a1a2e;
      }
      .subtitle {
        color: #888;
        margin-bottom: 24px;
      }
      .error-banner {
        background: #f8d7da;
        color: #721c24;
        padding: 10px 16px;
        border-radius: 6px;
        margin-bottom: 16px;
        font-size: 0.9rem;
      }
      .form-group {
        margin-bottom: 16px;
      }
      label {
        display: block;
        margin-bottom: 4px;
        font-weight: 500;
        font-size: 0.9rem;
        color: #444;
      }
      input {
        width: 100%;
        padding: 10px 14px;
        border: 1px solid #ddd;
        border-radius: 8px;
        font-size: 1rem;
        box-sizing: border-box;
        transition: border-color 0.2s;
      }
      input:focus {
        outline: none;
        border-color: #e94560;
      }
      .btn-primary {
        width: 100%;
        padding: 12px;
        background: #e94560;
        color: white;
        border: none;
        border-radius: 8px;
        font-size: 1rem;
        font-weight: 600;
        cursor: pointer;
        transition: background 0.2s;
      }
      .btn-primary:hover:not(:disabled) {
        background: #d63851;
      }
      .btn-primary:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
      .auth-footer {
        text-align: center;
        margin-top: 16px;
        color: #888;
        font-size: 0.9rem;
      }
      .auth-footer a {
        color: #e94560;
        text-decoration: none;
        font-weight: 500;
      }
    `,
  ],
})
export class LoginComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  email = '';
  password = '';
  error = '';
  loading = false;

  onSubmit(): void {
    this.error = '';
    this.loading = true;

    this.auth.login({ email: this.email, password: this.password }).subscribe({
      next: () => {
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.error = err.message || 'Login failed';
        this.loading = false;
      },
    });
  }
}
