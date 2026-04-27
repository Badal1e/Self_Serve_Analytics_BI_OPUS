import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/auth/auth.service';
import { GlossaryEntry } from '../../core/models/feedback.model';

@Component({
  selector: 'app-glossary',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="glossary-page">
      <div class="page-header">
        <h2>Business Glossary</h2>
        @if (auth.isAdmin()) {
          <button class="btn-primary" (click)="showForm = !showForm">
            {{ showForm ? 'Cancel' : '+ New Term' }}
          </button>
        }
      </div>

      @if (showForm) {
        <div class="form-card">
          <div class="form-row">
            <input [(ngModel)]="form.term" placeholder="Term (e.g., Revenue)" />
            <input [(ngModel)]="form.category" placeholder="Category (optional)" />
          </div>
          <input [(ngModel)]="form.definition" placeholder="Definition" />
          <input [(ngModel)]="form.sql_expression" placeholder="SQL Expression (e.g., SUM(amount) WHERE status='SUCCESS')" />
          <button class="btn-primary" (click)="saveEntry()">
            {{ editingId ? 'Update' : 'Create' }}
          </button>
        </div>
      }

      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>Term</th>
              <th>Definition</th>
              <th>SQL Expression</th>
              <th>Category</th>
              @if (auth.isAdmin()) {
                <th>Actions</th>
              }
            </tr>
          </thead>
          <tbody>
            @for (entry of entries; track entry.id) {
              <tr>
                <td class="term-cell">{{ entry.term }}</td>
                <td>{{ entry.definition }}</td>
                <td><code>{{ entry.sql_expression }}</code></td>
                <td>{{ entry.category || '-' }}</td>
                @if (auth.isAdmin()) {
                  <td>
                    <button class="btn-sm" (click)="startEdit(entry)">Edit</button>
                    <button class="btn-sm btn-danger" (click)="deleteEntry(entry.id)">Delete</button>
                  </td>
                }
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: [
    `
      .glossary-page { max-width: 1100px; margin: 0 auto; }
      .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
      h2 { color: #1a1a2e; margin: 0; }
      .form-card {
        background: white; padding: 20px; border-radius: 12px; box-shadow: 0 2px 12px rgba(0,0,0,0.06);
        display: flex; flex-direction: column; gap: 10px; margin-bottom: 20px;
      }
      .form-row { display: flex; gap: 10px; }
      .form-row input { flex: 1; }
      input {
        padding: 10px 14px; border: 1px solid #ddd; border-radius: 8px; font-size: 0.9rem;
        width: 100%; box-sizing: border-box;
      }
      input:focus { outline: none; border-color: #e94560; }
      .btn-primary {
        padding: 10px 20px; background: #e94560; color: white; border: none; border-radius: 8px;
        cursor: pointer; font-weight: 600; align-self: flex-start;
      }
      .table-container { background: white; border-radius: 12px; box-shadow: 0 2px 12px rgba(0,0,0,0.06); overflow-x: auto; }
      table { width: 100%; border-collapse: collapse; }
      th { background: #16213e; color: white; padding: 10px 14px; text-align: left; font-size: 0.85rem; }
      td { padding: 10px 14px; border-bottom: 1px solid #eee; font-size: 0.85rem; }
      .term-cell { font-weight: 600; color: #1a1a2e; }
      code { background: #f0f0f5; padding: 2px 6px; border-radius: 4px; font-size: 0.8rem; }
      .btn-sm { padding: 4px 10px; border: 1px solid #ddd; background: white; border-radius: 4px; cursor: pointer; margin-right: 4px; font-size: 0.75rem; }
      .btn-danger { color: #dc3545; border-color: #dc3545; }
      .btn-danger:hover { background: #dc3545; color: white; }
    `,
  ],
})
export class GlossaryComponent implements OnInit {
  private api = inject(ApiService);
  auth = inject(AuthService);

  entries: GlossaryEntry[] = [];
  showForm = false;
  editingId: number | null = null;
  form = { term: '', definition: '', sql_expression: '', category: '' };

  ngOnInit(): void {
    this.loadEntries();
  }

  loadEntries(): void {
    this.api.get<GlossaryEntry[]>('/glossary').subscribe((data) => (this.entries = data));
  }

  saveEntry(): void {
    if (this.editingId) {
      this.api.put<GlossaryEntry>(`/glossary/${this.editingId}`, this.form).subscribe(() => {
        this.resetForm();
        this.loadEntries();
      });
    } else {
      this.api.post<GlossaryEntry>('/glossary', this.form).subscribe(() => {
        this.resetForm();
        this.loadEntries();
      });
    }
  }

  startEdit(entry: GlossaryEntry): void {
    this.editingId = entry.id;
    this.form = {
      term: entry.term,
      definition: entry.definition,
      sql_expression: entry.sql_expression,
      category: entry.category || '',
    };
    this.showForm = true;
  }

  deleteEntry(id: number): void {
    if (confirm('Delete this glossary entry?')) {
      this.api.delete(`/glossary/${id}`).subscribe(() => this.loadEntries());
    }
  }

  private resetForm(): void {
    this.form = { term: '', definition: '', sql_expression: '', category: '' };
    this.editingId = null;
    this.showForm = false;
  }
}
