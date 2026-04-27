import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <nav class="navbar">
      <div class="navbar-brand">
        <a routerLink="/dashboard" class="logo">Opus BI</a>
      </div>

      @if (auth.isAuthenticated()) {
        <div class="navbar-links">
          <a routerLink="/dashboard" routerLinkActive="active">Dashboard</a>
          <a routerLink="/history" routerLinkActive="active">History</a>
          <a routerLink="/glossary" routerLinkActive="active">Glossary</a>
          <a routerLink="/catalog" routerLinkActive="active">Catalog</a>
          @if (auth.isAdmin()) {
            <a routerLink="/admin" routerLinkActive="active">Admin</a>
          }
        </div>
        <div class="navbar-user">
          <span class="user-info">{{ auth.user()?.full_name }} ({{ auth.user()?.role }})</span>
          <button class="btn-logout" (click)="auth.logout()">Logout</button>
        </div>
      }
    </nav>
  `,
  styles: [
    `
      .navbar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 24px;
        height: 60px;
        background: #1a1a2e;
        color: white;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
      }
      .logo {
        font-size: 1.25rem;
        font-weight: 700;
        color: #e94560;
        text-decoration: none;
      }
      .navbar-links {
        display: flex;
        gap: 8px;
      }
      .navbar-links a {
        color: #ccc;
        text-decoration: none;
        padding: 8px 16px;
        border-radius: 6px;
        font-size: 0.9rem;
        transition: all 0.2s;
      }
      .navbar-links a:hover,
      .navbar-links a.active {
        background: rgba(233, 69, 96, 0.15);
        color: #e94560;
      }
      .navbar-user {
        display: flex;
        align-items: center;
        gap: 12px;
      }
      .user-info {
        font-size: 0.85rem;
        color: #aaa;
      }
      .btn-logout {
        background: transparent;
        border: 1px solid #e94560;
        color: #e94560;
        padding: 6px 14px;
        border-radius: 6px;
        cursor: pointer;
        font-size: 0.85rem;
        transition: all 0.2s;
      }
      .btn-logout:hover {
        background: #e94560;
        color: white;
      }
    `,
  ],
})
export class NavbarComponent {
  auth = inject(AuthService);
}
