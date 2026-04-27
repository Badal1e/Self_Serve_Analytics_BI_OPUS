import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/auth/auth.service';
import { CatalogEntry } from '../../core/models/feedback.model';

@Component({
  selector: 'app-catalog',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="catalog-page">
      <div class="page-header">
        <h2>Data Catalog</h2>
        @if (auth.isAdmin()) {
          <button class="btn-primary" (click)="syncCatalog()">
            {{ syncing ? 'Syncing...' : 'Sync from Database' }}
          </button>
        }
      </div>

      @if (syncMessage) {
        <div class="info-banner">{{ syncMessage }}</div>
      }

      @for (table of tableNames; track table) {
        <div class="table-section">
          <h3>{{ table }}</h3>
          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th>Column</th>
                  <th>Type</th>
                  <th>Description</th>
                  <th>PII</th>
                  <th>Samples</th>
                </tr>
              </thead>
              <tbody>
                @for (col of getColumnsForTable(table); track col.id) {
                  <tr>
                    <td class="col-name">{{ col.column_name }}</td>
                    <td><code>{{ col.data_type }}</code></td>
                    <td>{{ col.description }}</td>
                    <td>
                      <span [class]="col.is_pii ? 'badge-pii' : 'badge-safe'">
                        {{ col.is_pii ? 'PII' : 'Safe' }}
                      </span>
                    </td>
                    <td class="samples">{{ col.sample_values?.join(', ') || '-' }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }
    </div>
  `,
  styles: [
    `
      .catalog-page { max-width: 1100px; margin: 0 auto; }
      .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
      h2 { color: #1a1a2e; margin: 0; }
      h3 { color: #16213e; margin: 20px 0 8px; }
      .info-banner { background: #d1ecf1; color: #0c5460; padding: 10px 16px; border-radius: 6px; margin-bottom: 16px; }
      .btn-primary { padding: 10px 20px; background: #e94560; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; }
      .table-container { background: white; border-radius: 12px; box-shadow: 0 2px 12px rgba(0,0,0,0.06); overflow-x: auto; }
      table { width: 100%; border-collapse: collapse; }
      th { background: #16213e; color: white; padding: 10px 14px; text-align: left; font-size: 0.85rem; }
      td { padding: 10px 14px; border-bottom: 1px solid #eee; font-size: 0.85rem; }
      .col-name { font-weight: 600; font-family: 'Fira Code', monospace; }
      code { background: #f0f0f5; padding: 2px 6px; border-radius: 4px; font-size: 0.8rem; }
      .badge-pii { background: #f8d7da; color: #721c24; padding: 2px 8px; border-radius: 10px; font-size: 0.75rem; font-weight: 600; }
      .badge-safe { background: #d4edda; color: #155724; padding: 2px 8px; border-radius: 10px; font-size: 0.75rem; }
      .samples { color: #888; font-size: 0.8rem; max-width: 200px; overflow: hidden; text-overflow: ellipsis; }
    `,
  ],
})
export class CatalogComponent implements OnInit {
  private api = inject(ApiService);
  auth = inject(AuthService);

  entries: CatalogEntry[] = [];
  syncing = false;
  syncMessage = '';

  ngOnInit(): void {
    this.loadCatalog();
  }

  get tableNames(): string[] {
    return [...new Set(this.entries.map((e) => e.table_name))];
  }

  getColumnsForTable(table: string): CatalogEntry[] {
    return this.entries.filter((e) => e.table_name === table);
  }

  loadCatalog(): void {
    this.api.get<CatalogEntry[]>('/catalog').subscribe((data) => (this.entries = data));
  }

  syncCatalog(): void {
    this.syncing = true;
    this.syncMessage = '';
    this.api.post<{ message: string }>('/catalog/sync', {}).subscribe({
      next: (res) => {
        this.syncMessage = res.message;
        this.syncing = false;
        this.loadCatalog();
      },
      error: () => {
        this.syncMessage = 'Sync failed.';
        this.syncing = false;
      },
    });
  }
}
