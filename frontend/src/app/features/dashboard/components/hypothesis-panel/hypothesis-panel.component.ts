import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HypothesisResult } from '../../../../core/models/query.model';

@Component({
  selector: 'app-hypothesis-panel',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="hypothesis-panel">
      <h4>Hypotheses</h4>
      <ul class="hypothesis-list">
        @for (h of hypotheses; track $index) {
          <li>{{ h }}</li>
        }
      </ul>

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
        </div>
      }
    </div>
  `,
  styles: [
    `
      .hypothesis-panel {
        background: white;
        border-radius: 12px;
        padding: 20px;
        box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
      }
      h4 { color: #1a1a2e; margin: 0 0 12px; }
      .hypothesis-list { padding-left: 20px; color: #444; }
      .hypothesis-list li { margin-bottom: 6px; line-height: 1.5; }
      .best-hypothesis { margin-top: 16px; padding: 16px; background: #f8f9fa; border-radius: 8px; border-left: 4px solid #e94560; }
      .hypothesis-text { font-weight: 500; margin-bottom: 8px; }
      .stats { display: flex; gap: 12px; flex-wrap: wrap; align-items: center; font-size: 0.85rem; }
      .stat { padding: 4px 10px; background: #e9ecef; border-radius: 4px; }
      .positive { color: #155724; background: #d4edda; }
      .negative { color: #721c24; background: #f8d7da; }
      .badge { padding: 4px 12px; border-radius: 12px; font-weight: 600; font-size: 0.8rem; }
      .badge.supported { background: #d4edda; color: #155724; }
      .badge.rejected { background: #f8d7da; color: #721c24; }
    `,
  ],
})
export class HypothesisPanelComponent {
  @Input() hypotheses: string[] = [];
  @Input() bestHypothesis: HypothesisResult | null = null;

  get changePctValue(): number {
    return this.bestHypothesis?.change_pct ?? 0;
  }
}
