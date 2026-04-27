import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../../core/services/api.service';

@Component({
  selector: 'app-feedback-widget',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="feedback-widget">
      @if (!submitted) {
        <span class="label">Was this helpful?</span>
        <div class="feedback-buttons">
          <button
            class="fb-btn"
            [class.selected]="rating === 'up'"
            (click)="rate('up')"
          >
            👍
          </button>
          <button
            class="fb-btn"
            [class.selected]="rating === 'down'"
            (click)="rate('down')"
          >
            👎
          </button>
        </div>

        @if (rating === 'down') {
          <div class="correction-form">
            <textarea
              [(ngModel)]="correctedSql"
              placeholder="Correct SQL (optional)"
              rows="2"
            ></textarea>
            <textarea
              [(ngModel)]="comment"
              placeholder="What went wrong? (optional)"
              rows="2"
            ></textarea>
          </div>
        }

        @if (rating) {
          <button class="btn-submit" (click)="submit()" [disabled]="submitting">
            {{ submitting ? 'Submitting...' : 'Submit Feedback' }}
          </button>
        }
      } @else {
        <div class="thanks">Thank you for your feedback!</div>
      }
    </div>
  `,
  styles: [
    `
      .feedback-widget {
        background: #f8f9fa;
        border-radius: 12px;
        padding: 16px;
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
      .label { font-size: 0.9rem; color: #555; }
      .feedback-buttons { display: flex; gap: 8px; }
      .fb-btn {
        font-size: 1.4rem;
        padding: 6px 14px;
        background: white;
        border: 2px solid #ddd;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.2s;
      }
      .fb-btn:hover { border-color: #e94560; }
      .fb-btn.selected { border-color: #e94560; background: #fff5f7; }
      .correction-form { display: flex; flex-direction: column; gap: 8px; }
      textarea {
        padding: 10px;
        border: 1px solid #ddd;
        border-radius: 8px;
        font-family: inherit;
        font-size: 0.9rem;
        resize: none;
      }
      .btn-submit {
        align-self: flex-start;
        padding: 8px 20px;
        background: #1a1a2e;
        color: white;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        font-size: 0.85rem;
      }
      .btn-submit:disabled { opacity: 0.5; }
      .thanks { color: #155724; font-weight: 500; }
    `,
  ],
})
export class FeedbackWidgetComponent {
  @Input() queryId!: number;

  private api = inject(ApiService);

  rating: 'up' | 'down' | null = null;
  correctedSql = '';
  comment = '';
  submitted = false;
  submitting = false;

  rate(value: 'up' | 'down'): void {
    this.rating = value;
  }

  submit(): void {
    if (!this.rating) return;
    this.submitting = true;

    const body: any = { rating: this.rating };
    if (this.correctedSql.trim()) body.corrected_sql = this.correctedSql;
    if (this.comment.trim()) body.comment = this.comment;

    this.api.post(`/queries/${this.queryId}/feedback`, body).subscribe({
      next: () => {
        this.submitted = true;
        this.submitting = false;
      },
      error: () => {
        this.submitting = false;
      },
    });
  }
}
