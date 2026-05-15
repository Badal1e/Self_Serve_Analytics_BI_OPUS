import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HypothesisResult } from '../../../../core/models/query.model';

@Component({
  selector: 'app-hypothesis-panel',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="hypothesis-panel">
      <h4>Analytical Hypotheses</h4>
      <div class="hypothesis-list">
        @for (h of hypotheses; track $index) {
          <div class="hypothesis-item">
            <p class="hypothesis-text">{{ h.hypothesis }}</p>
            @if (h.sql) {
              <details class="sql-details">
                <summary>View SQL used</summary>
                <pre class="sql-block">{{ h.sql }}</pre>
              </details>
            }
          </div>
        }
      </div>

      @if (bestHypothesis) {
        <div class="best-hypothesis">
          <h4>Strongest Hypothesis</h4>
          <p class="hypothesis-text">{{ bestHypothesis.hypothesis }}</p>
          <div class="stats">
            @if (bestHypothesis.current !== undefined) {
              <span class="stat">Current: {{ bestHypothesis.current | number: '1.0-2' }}</span>
            }
            @if (bestHypothesis.previous !== undefined) {
              <span class="stat">Previous: {{ bestHypothesis.previous | number: '1.0-2' }}</span>
            }
            @if (bestHypothesis.change_pct !== undefined) {
              <span class="stat" [class.positive]="changePctValue > 0" [class.negative]="changePctValue < 0">
                Change: {{ bestHypothesis.change_pct }}%
              </span>
            }
            <span class="badge" [class.supported]="bestHypothesis.supported" [class.rejected]="!bestHypothesis.supported">
              {{ bestHypothesis.supported ? 'Supported' : 'Not Supported' }}
            </span>
          </div>

          @if (bestHypothesis.sql) {
            <details class="sql-details">
              <summary>View SQL used</summary>
              <pre class="sql-block">{{ bestHypothesis.sql }}</pre>
            </details>
          }
        </div>
      }
    </div>
  `,
  styles: [
    `
      .hypothesis-panel {
        background: var(--bg-secondary);
        border: 1px solid var(--border-light);
        border-radius: var(--radius-lg);
        padding: 20px;
        box-shadow: var(--shadow-sm);
      }
      h4 { color: var(--text-primary); margin: 0 0 12px; font-size: 0.875rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; }
      .hypothesis-list { display: flex; flex-direction: column; gap: 12px; margin: 0 0 16px 0; }
      .hypothesis-item { background: var(--bg-card, #fff); border: 1px solid var(--border-light); border-radius: var(--radius-md); padding: 12px; }
      .hypothesis-item p { margin: 0; line-height: 1.5; font-size: 0.9rem; color: var(--text-secondary); }
      .best-hypothesis { margin-top: 16px; padding: 16px; background: var(--bg-card, #fff); border-radius: var(--radius-md); border-left: 3px solid var(--accent-primary); }
      .hypothesis-text { font-weight: 500; margin-bottom: 8px; font-size: 0.95rem; }
      .stats { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; font-size: 0.8rem; margin-bottom: 12px; }
      .stat { padding: 3px 8px; background: var(--bg-secondary); border-radius: 4px; border: 1px solid var(--border-light); }
      .positive { color: #155724; background: #d4edda; border-color: #c3e6cb; }
      .negative { color: #721c24; background: #f8d7da; border-color: #f5c6cb; }
      .badge { padding: 3px 10px; border-radius: 12px; font-weight: 600; font-size: 0.8rem; }
      .badge.supported { background: #d4edda; color: #155724; }
      .badge.rejected { background: #f8d7da; color: #721c24; }
      .sql-details { margin-top: 8px; }
      .sql-details summary { cursor: pointer; font-size: 0.8rem; color: var(--text-tertiary); font-weight: 500; outline: none; user-select: none; }
      .sql-details summary:hover { color: var(--accent-primary); }
      .sql-block {
        margin-top: 8px;
        background: var(--bg-primary);
        border: 1px solid var(--border-light);
        border-radius: var(--radius-sm);
        padding: 12px;
        font-size: 0.8rem;
        font-family: monospace;
        white-space: pre-wrap;
        word-break: break-all;
        color: var(--text-secondary);
        line-height: 1.5;
      }
    `,
  ],
})
export class HypothesisPanelComponent {
  @Input() hypotheses: HypothesisResult[] = [];
  @Input() bestHypothesis: HypothesisResult | null = null;

  get changePctValue(): number {
    return this.bestHypothesis?.change_pct ?? 0;
  }
}
