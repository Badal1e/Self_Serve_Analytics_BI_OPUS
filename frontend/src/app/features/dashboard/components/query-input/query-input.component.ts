import { Component, Output, EventEmitter, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-query-input',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="query-input-container">
      <div class="input-wrapper">
        <textarea
          [(ngModel)]="query"
          placeholder="Ask a business question... e.g., 'What is total revenue this month?'"
          rows="2"
          (keydown.enter)="onSubmit($event)"
          [disabled]="loading"
        ></textarea>
        <button class="btn-run" (click)="onSubmit($event)" [disabled]="loading || !query.trim()">
          {{ loading ? 'Analyzing...' : 'Run Analysis' }}
        </button>
      </div>
    </div>
  `,
  styles: [
    `
      .query-input-container {
        margin-bottom: 24px;
      }
      .input-wrapper {
        display: flex;
        gap: 12px;
        align-items: flex-start;
      }
      textarea {
        flex: 1;
        padding: 14px 18px;
        border: 2px solid #e0e0e0;
        border-radius: 12px;
        font-size: 1rem;
        font-family: inherit;
        resize: none;
        transition: border-color 0.2s;
      }
      textarea:focus {
        outline: none;
        border-color: #e94560;
      }
      textarea:disabled {
        background: #f8f8f8;
      }
      .btn-run {
        padding: 14px 28px;
        background: #e94560;
        color: white;
        border: none;
        border-radius: 12px;
        font-size: 1rem;
        font-weight: 600;
        cursor: pointer;
        white-space: nowrap;
        transition: background 0.2s;
      }
      .btn-run:hover:not(:disabled) {
        background: #d63851;
      }
      .btn-run:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    `,
  ],
})
export class QueryInputComponent {
  @Input() loading = false;
  @Output() submitQuery = new EventEmitter<string>();

  query = '';

  onSubmit(event: Event): void {
    event.preventDefault();
    if (this.query.trim() && !this.loading) {
      this.submitQuery.emit(this.query.trim());
    }
  }
}
