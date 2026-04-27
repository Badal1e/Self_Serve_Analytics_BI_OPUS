import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { GovernanceRule } from '../../core/models/feedback.model';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="admin-page">
      <h2>Governance Rules</h2>

      <div class="form-card">
        <h4>{{ editingId ? 'Edit Rule' : 'Create Rule' }}</h4>
        <div class="form-grid">
          <select [(ngModel)]="form.rule_type">
            <option value="rbac">RBAC</option>
            <option value="pii_mask">PII Mask</option>
            <option value="row_filter">Row Filter</option>
          </select>
          <input [(ngModel)]="form.role" placeholder="Role (e.g., viewer)" />
          <input [(ngModel)]="form.table_name" placeholder="Table name" />
          <input [(ngModel)]="form.column_name" placeholder="Column name (optional)" />
          <input [(ngModel)]="form.condition" placeholder="SQL condition (optional)" />
        </div>
        <div class="form-actions">
          <button class="btn-primary" (click)="saveRule()">
            {{ editingId ? 'Update' : 'Create' }}
          </button>
          @if (editingId) {
            <button class="btn-secondary" (click)="cancelEdit()">Cancel</button>
          }
        </div>
      </div>

      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>Type</th>
              <th>Role</th>
              <th>Table</th>
              <th>Column</th>
              <th>Condition</th>
              <th>Active</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            @for (rule of rules; track rule.id) {
              <tr>
                <td>
                  <span class="badge" [class]="'badge-' + rule.rule_type">{{ rule.rule_type }}</span>
                </td>
                <td>{{ rule.role || 'All' }}</td>
                <td>{{ rule.table_name }}</td>
                <td>{{ rule.column_name || '-' }}</td>
                <td><code>{{ rule.condition || '-' }}</code></td>
                <td>{{ rule.is_active ? 'Yes' : 'No' }}</td>
                <td>
                  <button class="btn-sm" (click)="startEdit(rule)">Edit</button>
                  <button class="btn-sm btn-danger" (click)="deleteRule(rule.id)">Delete</button>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: [
    `
      .admin-page { max-width: 1100px; margin: 0 auto; }
      h2 { color: #1a1a2e; }
      h4 { margin: 0 0 12px; color: #333; }
      .form-card {
        background: white; padding: 20px; border-radius: 12px;
        box-shadow: 0 2px 12px rgba(0,0,0,0.06); margin-bottom: 24px;
      }
      .form-grid {
        display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 10px; margin-bottom: 12px;
      }
      select, input {
        padding: 10px 14px; border: 1px solid #ddd; border-radius: 8px; font-size: 0.9rem;
      }
      .form-actions { display: flex; gap: 8px; }
      .btn-primary { padding: 10px 20px; background: #e94560; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; }
      .btn-secondary { padding: 10px 20px; background: #6c757d; color: white; border: none; border-radius: 8px; cursor: pointer; }
      .table-container { background: white; border-radius: 12px; box-shadow: 0 2px 12px rgba(0,0,0,0.06); overflow-x: auto; }
      table { width: 100%; border-collapse: collapse; }
      th { background: #16213e; color: white; padding: 10px 14px; text-align: left; font-size: 0.85rem; }
      td { padding: 10px 14px; border-bottom: 1px solid #eee; font-size: 0.85rem; }
      code { background: #f0f0f5; padding: 2px 6px; border-radius: 4px; }
      .badge { padding: 2px 10px; border-radius: 10px; font-size: 0.75rem; font-weight: 600; }
      .badge-rbac { background: #cce5ff; color: #004085; }
      .badge-pii_mask { background: #f8d7da; color: #721c24; }
      .badge-row_filter { background: #fff3cd; color: #856404; }
      .btn-sm { padding: 4px 10px; border: 1px solid #ddd; background: white; border-radius: 4px; cursor: pointer; margin-right: 4px; font-size: 0.75rem; }
      .btn-danger { color: #dc3545; border-color: #dc3545; }
      .btn-danger:hover { background: #dc3545; color: white; }
    `,
  ],
})
export class AdminComponent implements OnInit {
  private api = inject(ApiService);

  rules: GovernanceRule[] = [];
  editingId: number | null = null;
  form = { rule_type: 'rbac', role: '', table_name: '', column_name: '', condition: '' };

  ngOnInit(): void {
    this.loadRules();
  }

  loadRules(): void {
    this.api.get<GovernanceRule[]>('/governance/rules').subscribe((data) => (this.rules = data));
  }

  saveRule(): void {
    const body = { ...this.form };
    if (!body.role) delete (body as any).role;
    if (!body.column_name) delete (body as any).column_name;
    if (!body.condition) delete (body as any).condition;

    if (this.editingId) {
      this.api.put(`/governance/rules/${this.editingId}`, body).subscribe(() => {
        this.cancelEdit();
        this.loadRules();
      });
    } else {
      this.api.post('/governance/rules', body).subscribe(() => {
        this.resetForm();
        this.loadRules();
      });
    }
  }

  startEdit(rule: GovernanceRule): void {
    this.editingId = rule.id;
    this.form = {
      rule_type: rule.rule_type,
      role: rule.role || '',
      table_name: rule.table_name,
      column_name: rule.column_name || '',
      condition: rule.condition || '',
    };
  }

  deleteRule(id: number): void {
    if (confirm('Delete this governance rule?')) {
      this.api.delete(`/governance/rules/${id}`).subscribe(() => this.loadRules());
    }
  }

  cancelEdit(): void {
    this.editingId = null;
    this.resetForm();
  }

  private resetForm(): void {
    this.form = { rule_type: 'rbac', role: '', table_name: '', column_name: '', condition: '' };
  }
}
