import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-result-panel',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="result-panel card">
      <div class="insight-header">
        <div class="icon-badge">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
          </svg>
        </div>
        <h3>Business Insight</h3>
      </div>
      <p class="answer-text">{{ answer }}</p>

      @if (data && data.length > 0) {
        <div class="data-table-wrapper">
          <h4 class="table-title">Raw Data Snapshot</h4>
          <div class="table-scroll">
            <table>
              <thead>
                <tr>
                  @for (col of dataColumns; track col) {
                    <th>{{ col }}</th>
                  }
                </tr>
              </thead>
              <tbody>
                @for (row of data | slice : 0 : 20; track $index) {
                  <tr>
                    @for (col of dataColumns; track col) {
                      <td>{{ row[col] }}</td>
                    }
                  </tr>
                }
              </tbody>
            </table>
          </div>
          @if (data.length > 20) {
            <p class="truncation-note">Showing 20 of {{ data.length }} rows</p>
          }
        </div>
      }
    </div>
  `,
  styles: [
    `
      .result-panel {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }
      .card {
        background: var(--bg-card, #ffffff);
        border: 1px solid var(--border-light, #e5e7eb);
        border-radius: 12px;
        padding: 20px;
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      }
      .insight-header {
        display: flex;
        align-items: center;
        gap: 12px;
      }
      .icon-badge {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        background: var(--accent-light);
        color: var(--accent-primary);
        border-radius: var(--radius-md);
      }
      .icon-badge svg {
        width: 18px;
        height: 18px;
      }
      h3 {
        margin: 0;
        font-size: 1.25rem;
      }
      .answer-text {
        font-size: 1.125rem;
        color: var(--text-secondary);
        line-height: 1.7;
      }
      
      .data-table-wrapper {
        margin-top: 16px;
        border: 1px solid var(--border-light);
        border-radius: var(--radius-md);
        overflow: hidden;
      }
      .table-title {
        margin: 0;
        padding: 12px 16px;
        background: var(--bg-primary);
        border-bottom: 1px solid var(--border-light);
        font-size: 0.875rem;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: var(--text-tertiary);
      }
      .table-scroll {
        overflow-x: auto;
      }
      table {
        width: 100%;
        border-collapse: collapse;
        font-size: 0.875rem;
      }
      th {
        background: var(--bg-primary);
        color: var(--text-secondary);
        font-weight: 500;
        padding: 10px 16px;
        text-align: left;
        white-space: nowrap;
        border-bottom: 1px solid var(--border-light);
      }
      td {
        padding: 12px 16px;
        color: var(--text-primary);
        border-bottom: 1px solid var(--border-light);
        white-space: nowrap;
      }
      tr:last-child td {
        border-bottom: none;
      }
      tr:hover td {
        background: var(--bg-primary);
      }
      .truncation-note {
        font-size: 0.8rem;
        color: var(--text-tertiary);
        padding: 8px 16px;
        background: var(--bg-primary);
        border-top: 1px solid var(--border-light);
        margin: 0;
      }
    `,
  ],
})
export class ResultPanelComponent {
  @Input() answer = '';
  @Input() data: any[] = [];

  get dataColumns(): string[] {
    if (!this.data || this.data.length === 0) return [];
    return Object.keys(this.data[0]);
  }
}
