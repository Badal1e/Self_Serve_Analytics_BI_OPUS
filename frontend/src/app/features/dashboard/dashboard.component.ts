import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../core/services/api.service';
import { QueryResponse } from '../../core/models/query.model';

import { QueryInputComponent } from './components/query-input/query-input.component';
import { ResultPanelComponent } from './components/result-panel/result-panel.component';
import { HypothesisPanelComponent } from './components/hypothesis-panel/hypothesis-panel.component';
import { FollowupPanelComponent } from './components/followup-panel/followup-panel.component';
import { FeedbackWidgetComponent } from './components/feedback-widget/feedback-widget.component';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { ConfidenceBadgeComponent } from '../../shared/components/confidence-badge/confidence-badge.component';
import { SqlViewerComponent } from '../../shared/components/sql-viewer/sql-viewer.component';
import { ChartDisplayComponent } from '../../shared/components/chart-display/chart-display.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    QueryInputComponent,
    ResultPanelComponent,
    HypothesisPanelComponent,
    FollowupPanelComponent,
    FeedbackWidgetComponent,
    LoadingSpinnerComponent,
    ConfidenceBadgeComponent,
    SqlViewerComponent,
    ChartDisplayComponent,
  ],
  template: `
    <div class="dashboard-container">
      <div class="header-section animate-enter">
        <div class="logo-mark">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 3v18h18"></path><path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3"></path>
          </svg>
        </div>
        <h1>Analytics Intelligence</h1>
        <p class="tagline">Natural language data exploration powered by AI.</p>
      </div>

      <div class="search-section animate-enter" style="animation-delay: 0.1s;">
        <app-query-input [loading]="loading" (submitQuery)="onSubmit($event)" />
      </div>

      @if (loading) {
        <app-loading-spinner message="Analyzing millions of rows..." />
      }

      @if (error) {
        <div class="error-banner animate-enter">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
          <span>{{ error }}</span>
        </div>
      }

      @if (result && !loading) {
        <div class="results-layout animate-enter" style="animation-delay: 0.2s;">
          <div class="results-main">
            <app-result-panel [answer]="result.answer" [data]="result.data" />

            @if (result.chart) {
              <div class="card chart-card">
                <app-chart-display [spec]="result.chart" />
              </div>
            }

            @if (result.sql) {
              <app-sql-viewer [sql]="result.sql" />
            }
          </div>

          <aside class="results-sidebar">
            <div class="meta-card">
              <app-confidence-badge
                [score]="result.confidence"
                [reason]="result.confidence_reason || ''"
              />
              @if (result.latency_ms) {
                <div class="latency-stat">
                  <span class="label">Query Latency</span>
                  <span class="value">{{ result.latency_ms | number: '1.0-0' }}ms</span>
                </div>
              }
            </div>

            @if (result.hypotheses.length > 0) {
              <app-hypothesis-panel
                [hypotheses]="result.hypotheses"
                [bestHypothesis]="result.best_hypothesis || null"
              />
            }

            <app-followup-panel
              [suggestions]="result.follow_up_suggestions"
              (onSelect)="onFollowup($event)"
            />

            <app-feedback-widget [queryId]="result.id" />
          </aside>
        </div>
      }
    </div>
  `,
  styles: [
    `
      .dashboard-container {
        max-width: 1280px;
        margin: 0 auto;
        padding: 40px 24px 80px;
      }
      .header-section {
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        margin-bottom: 40px;
      }
      .logo-mark {
        width: 48px;
        height: 48px;
        background: var(--bg-secondary);
        border: 1px solid var(--border-light);
        border-radius: var(--radius-lg);
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 16px;
        box-shadow: var(--shadow-sm);
        color: var(--accent-primary);
      }
      .logo-mark svg {
        width: 24px;
        height: 24px;
      }
      h1 {
        font-size: 2.5rem;
        font-weight: 700;
        letter-spacing: -0.04em;
        margin-bottom: 8px;
      }
      .tagline {
        font-size: 1.125rem;
        color: var(--text-secondary);
      }
      
      .search-section {
        margin-bottom: 32px;
      }

      .error-banner {
        display: flex;
        align-items: center;
        gap: 12px;
        background: var(--error-bg);
        border: 1px solid rgba(239, 68, 68, 0.2);
        color: var(--error);
        padding: 16px;
        border-radius: var(--radius-lg);
        margin-bottom: 24px;
        font-weight: 500;
      }
      .error-banner svg {
        width: 20px;
        height: 20px;
      }

      .results-layout {
        display: grid;
        grid-template-columns: minmax(0, 1fr) 380px;
        gap: 32px;
        align-items: start;
      }
      .results-main {
        display: flex;
        flex-direction: column;
        gap: 24px;
      }
      .results-sidebar {
        display: flex;
        flex-direction: column;
        gap: 24px;
      }
      
      .chart-card {
        padding: 0;
        overflow: hidden;
      }

      .meta-card {
        background: var(--bg-secondary);
        border: 1px solid var(--border-light);
        border-radius: var(--radius-lg);
        padding: 20px;
        box-shadow: var(--shadow-sm);
        display: flex;
        flex-direction: column;
        gap: 16px;
      }
      
      .latency-stat {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding-top: 16px;
        border-top: 1px solid var(--border-light);
        font-size: 0.875rem;
      }
      .latency-stat .label {
        color: var(--text-secondary);
      }
      .latency-stat .value {
        font-family: monospace;
        color: var(--text-tertiary);
      }

      @media (max-width: 1024px) {
        .results-layout {
          grid-template-columns: 1fr;
        }
      }
    `
  ]
})
export class DashboardComponent {
  private api = inject(ApiService);

  loading = false;
  error = '';
  result: QueryResponse | null = null;

  onSubmit(query: string): void {
    this.loading = true;
    this.error = '';
    this.result = null;

    this.api.post<QueryResponse>('/queries', { query }).subscribe({
      next: (res) => {
        this.result = res;
        this.loading = false;
      },
      error: (err) => {
        this.error = err.message || 'Failed to process query';
        this.loading = false;
      },
    });
  }

  onFollowup(query: string): void {
    this.onSubmit(query);
  }
}
