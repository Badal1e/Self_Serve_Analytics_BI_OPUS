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
    <div class="dashboard">
      <div class="header">
        <h1>AI Analytics Assistant</h1>
        <p class="tagline">Ask business questions and get instant insights</p>
      </div>

      <app-query-input [loading]="loading" (submitQuery)="onSubmit($event)" />

      @if (loading) {
        <app-loading-spinner message="Analyzing your query..." />
      }

      @if (error) {
        <div class="error-banner">{{ error }}</div>
      }

      @if (result) {
        <div class="results-grid">
          <div class="results-main">
            <app-result-panel [answer]="result.answer" [data]="result.data" />

            @if (result.chart) {
              <app-chart-display [spec]="result.chart" />
            }

            @if (result.sql) {
              <app-sql-viewer [sql]="result.sql" />
            }
          </div>

          <div class="results-sidebar">
            <app-confidence-badge
              [score]="result.confidence"
              [reason]="result.confidence_reason || ''"
            />

            @if (result.latency_ms) {
              <div class="latency">Response time: {{ result.latency_ms | number: '1.0-0' }}ms</div>
            }

            @if (result.hypotheses.length > 0) {
              <app-hypothesis-panel
                [hypotheses]="result.hypotheses"
                [bestHypothesis]="result.best_hypothesis || null"
              />
            }

            <app-feedback-widget [queryId]="result.id" />
          </div>
        </div>

        <app-followup-panel
          [suggestions]="result.follow_up_suggestions"
          (onSelect)="onFollowup($event)"
        />
      }
    </div>
  `,
  styles: [
    `
      .dashboard {
        max-width: 1200px;
        margin: 0 auto;
      }
      .header {
        margin-bottom: 24px;
      }
      h1 {
        color: #1a1a2e;
        margin: 0;
        font-size: 1.8rem;
      }
      .tagline {
        color: #888;
        margin: 4px 0 0;
      }
      .error-banner {
        background: #f8d7da;
        color: #721c24;
        padding: 12px 16px;
        border-radius: 8px;
        margin-bottom: 16px;
      }
      .results-grid {
        display: grid;
        grid-template-columns: 1fr 360px;
        gap: 24px;
        margin-bottom: 24px;
      }
      .results-main {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }
      .results-sidebar {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }
      .latency {
        font-size: 0.8rem;
        color: #888;
        text-align: center;
      }
      @media (max-width: 900px) {
        .results-grid {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
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
