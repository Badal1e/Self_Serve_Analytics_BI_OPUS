import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../core/services/api.service';
import {
  QueryHistoryItem,
  PaginatedResponse,
} from '../../core/models/query.model';

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="history-page">
      <h2>Query History</h2>

      @if (loading) {
        <p class="loading">Loading...</p>
      }

      @if (items.length > 0) {
        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>User</th>
                <th>Query</th>
                <th>Answer</th>
                <th>Confidence</th>
                <th>Date</th>
                <th>Export</th>
              </tr>
            </thead>
            <tbody>
              @for (item of items; track item.id) {
                <tr>
                  <td>{{ item.id }}</td>
                  <td>{{ item.user_email || 'You' }}</td>
                  <td class="query-cell">{{ item.natural_language_query }}</td>
                  <td class="answer-cell">{{ item.answer_text || 'N/A' }}</td>
                  <td>
                    @if (item.confidence_score !== null && item.confidence_score !== undefined) {
                      {{ (item.confidence_score * 100).toFixed(0) }}%
                    }
                  </td>
                  <td>{{ item.created_at | date: 'medium' }}</td>
                  <td>
                    <div class="export-buttons">
                      <button class="btn-sm" (click)="exportQuery(item.id, 'pdf')">PDF</button>
                      <button class="btn-sm" (click)="exportQuery(item.id, 'excel')">Excel</button>
                      <button class="btn-sm" (click)="exportQuery(item.id, 'html')">HTML</button>
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <div class="pagination">
          <button [disabled]="page <= 1" (click)="goPage(page - 1)">Previous</button>
          <span>Page {{ page }} of {{ totalPages }}</span>
          <button [disabled]="page >= totalPages" (click)="goPage(page + 1)">Next</button>
        </div>
      } @else if (!loading) {
        <p class="empty">No queries yet. Go to the Dashboard to ask your first question.</p>
      }
    </div>
  `,
  styles: [
    `
      .history-page { max-width: 1100px; margin: 0 auto; }
      h2 { color: #1a1a2e; }
      .loading { color: #888; }
      .table-container { overflow-x: auto; background: white; border-radius: 12px; box-shadow: 0 2px 12px rgba(0,0,0,0.06); }
      table { width: 100%; border-collapse: collapse; }
      th { background: #16213e; color: white; padding: 10px 14px; text-align: left; font-size: 0.85rem; }
      td { padding: 10px 14px; border-bottom: 1px solid #eee; font-size: 0.85rem; }
      .query-cell, .answer-cell { max-width: 250px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      tr:hover td { background: #f8f9fa; }
      .export-buttons { display: flex; gap: 4px; }
      .btn-sm {
        padding: 4px 8px; font-size: 0.75rem; border: 1px solid #ddd; background: white;
        border-radius: 4px; cursor: pointer;
      }
      .btn-sm:hover { background: #e94560; color: white; border-color: #e94560; }
      .pagination {
        display: flex; justify-content: center; align-items: center; gap: 16px;
        margin-top: 16px;
      }
      .pagination button {
        padding: 8px 16px; border: 1px solid #ddd; background: white; border-radius: 6px; cursor: pointer;
      }
      .pagination button:disabled { opacity: 0.4; cursor: not-allowed; }
      .empty { color: #888; text-align: center; margin-top: 40px; }
    `,
  ],
})
export class HistoryComponent implements OnInit {
  private api = inject(ApiService);

  items: QueryHistoryItem[] = [];
  page = 1;
  totalPages = 1;
  loading = true;

  ngOnInit(): void {
    this.loadPage();
  }

  loadPage(): void {
    this.loading = true;
    this.api
      .get<PaginatedResponse<QueryHistoryItem>>('/queries', {
        page: this.page,
        page_size: 15,
      })
      .subscribe({
        next: (res) => {
          this.items = res.items;
          this.totalPages = res.total_pages;
          this.loading = false;
        },
        error: () => (this.loading = false),
      });
  }

  goPage(p: number): void {
    this.page = p;
    this.loadPage();
  }

  exportQuery(id: number, format: string): void {
    this.api.getBlob(`/queries/${id}/export`, { format }).subscribe({
      next: (blob) => {
        const ext = format === 'excel' ? 'xlsx' : format;
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `query_${id}.${ext}`;
        a.click();
        URL.revokeObjectURL(url);
      },
    });
  }
}
