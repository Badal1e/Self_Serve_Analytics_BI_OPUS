import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-result-panel',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="result-panel">
      <h3>Business Insight</h3>
      <p class="answer-text">{{ answer }}</p>

      @if (data && data.length > 0) {
        <div class="data-table-wrapper">
          <h4>Data</h4>
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
        background: white;
        border-radius: 12px;
        padding: 24px;
        box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
      }
      h3 {
        color: #1a1a2e;
        margin: 0 0 12px;
      }
      .answer-text {
        font-size: 1.05rem;
        color: #333;
        line-height: 1.6;
      }
      h4 {
        margin: 20px 0 8px;
        color: #555;
      }
      .table-scroll {
        overflow-x: auto;
      }
      table {
        width: 100%;
        border-collapse: collapse;
        font-size: 0.85rem;
      }
      th {
        background: #16213e;
        color: white;
        padding: 8px 12px;
        text-align: left;
        white-space: nowrap;
      }
      td {
        padding: 8px 12px;
        border-bottom: 1px solid #eee;
      }
      tr:hover td {
        background: #f8f9fa;
      }
      .truncation-note {
        font-size: 0.8rem;
        color: #888;
        margin-top: 8px;
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
