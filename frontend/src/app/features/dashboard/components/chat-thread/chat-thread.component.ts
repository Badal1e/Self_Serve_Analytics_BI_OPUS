import {
  Component, Input, Output, EventEmitter,
  ViewChild, ElementRef, AfterViewChecked
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChatMessage } from '../../../../core/models/query.model';
import { ChartDisplayComponent } from '../../../../shared/components/chart-display/chart-display.component';
import { SqlViewerComponent } from '../../../../shared/components/sql-viewer/sql-viewer.component';
import { HypothesisPanelComponent } from '../hypothesis-panel/hypothesis-panel.component';
import { FeedbackWidgetComponent } from '../feedback-widget/feedback-widget.component';
import { MarkdownPipe } from '../../../../shared/pipes/markdown.pipe';

@Component({
  selector: 'app-chat-thread',
  standalone: true,
  imports: [
    CommonModule,
    ChartDisplayComponent,
    SqlViewerComponent,
    HypothesisPanelComponent,
    FeedbackWidgetComponent,
    MarkdownPipe,
  ],
  template: `
    <div class="chat-thread" #threadContainer>
      @if (messages.length === 0) {
        <div class="empty-thread">
          <div class="welcome-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
          </div>
          <h3>How can I help you today?</h3>
          <p>Ask a question about your payments data to get started.</p>
          <div class="example-queries">
            <span class="example-chip" (click)="followupSelected.emit('What is total revenue this month?')">Total revenue this month?</span>
            <span class="example-chip" (click)="followupSelected.emit('Show failed transactions by country')">Failed transactions by country</span>
            <span class="example-chip" (click)="followupSelected.emit('Revenue trend last 6 months')">Revenue trend last 6 months</span>
          </div>
        </div>
      }

      @for (msg of messages; track msg.id) {
        <!-- User Query Bubble -->
        <div class="message-row user-row">
          <div class="bubble user-bubble">
            {{ msg.query }}
          </div>
        </div>

        <!-- AI Answer Bubble -->
        @if (msg.answer) {
          <div class="message-row ai-row">
            <div class="bubble ai-bubble" [class.error-bubble]="msg.isError">
              <div class="ai-header">
                <div class="ai-avatar" [class.error-avatar]="msg.isError">
                  {{ msg.isError ? '!' : 'Opus' }}
                </div>
                @if (msg.confidence && !msg.isError) {
                  <span class="confidence-badge"
                    [class.high]="msg.confidence > 0.8"
                    [class.med]="msg.confidence > 0.5 && msg.confidence <= 0.8"
                    [class.low]="msg.confidence <= 0.5">
                    {{ (msg.confidence * 100).toFixed(0) }}% Confidence
                  </span>
                }
                @if (msg.isError) {
                  <span class="error-label">Analysis Failed</span>
                }
              </div>

              <div class="answer-text markdown-content" [innerHTML]="msg.answer | markdown"></div>

              <!-- Regenerate button — only on error messages -->
              @if (msg.isError) {
                <div class="regenerate-section">
                  <button class="btn-regenerate" (click)="regenerateQuery.emit(msg.query)" [disabled]="loading">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <polyline points="23 4 23 10 17 10"></polyline>
                      <polyline points="1 20 1 14 7 14"></polyline>
                      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
                    </svg>
                    Regenerate Response
                  </button>
                </div>
              }

              @if (!msg.isError) {
                @if (msg.chart) {
                  <div class="chart-wrapper">
                    <app-chart-display [spec]="msg.chart"></app-chart-display>
                  </div>
                }

                @if (msg.hypotheses && msg.hypotheses.length > 0) {
                  <div class="hypotheses-wrapper">
                    <app-hypothesis-panel
                      [hypotheses]="msg.hypotheses"
                      [bestHypothesis]="msg.best_hypothesis || null">
                    </app-hypothesis-panel>
                  </div>
                }

                @if (msg.sql) {
                  <details class="sql-details">
                    <summary>
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <ellipse cx="12" cy="5" rx="9" ry="3"></ellipse>
                        <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path>
                        <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path>
                      </svg>
                      View SQL
                    </summary>
                    <app-sql-viewer [sql]="msg.sql"></app-sql-viewer>
                  </details>
                }

                <!-- Follow-up suggestions -->
                @if (msg.follow_up_suggestions && msg.follow_up_suggestions.length > 0) {
                  <div class="followup-section">
                    <div class="followup-label">
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="8" x2="12" y2="12"></line>
                        <line x1="12" y1="16" x2="12.01" y2="16"></line>
                      </svg>
                      Follow-up questions
                    </div>
                    <div class="followup-chips">
                      @for (s of msg.follow_up_suggestions; track $index) {
                        <button class="followup-chip" (click)="followupSelected.emit(s)" [disabled]="loading">
                          {{ s }}
                        </button>
                      }
                    </div>
                  </div>
                }

                <!-- Feedback + Export row -->
                <div class="action-bar">
                  <app-feedback-widget [queryId]="msg.id"></app-feedback-widget>
                  <div class="export-actions">
                    <button class="btn-export" (click)="exportQuery.emit({id: msg.id, format: 'pdf'})">
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
                      PDF
                    </button>
                    <button class="btn-export" (click)="exportQuery.emit({id: msg.id, format: 'excel'})">
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="3" y1="15" x2="21" y2="15"></line><line x1="9" y1="3" x2="9" y2="21"></line></svg>
                      Excel
                    </button>
                    <button class="btn-export" (click)="exportQuery.emit({id: msg.id, format: 'html'})">
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>
                      HTML
                    </button>
                  </div>
                </div>
              }
            </div>
          </div>
        }
      }

      @if (loading) {
        <div class="message-row ai-row">
          <div class="bubble ai-bubble loading-bubble">
            <div class="typing-indicator">
              <span></span><span></span><span></span>
            </div>
            <span class="loading-text">Opus is thinking...</span>
          </div>
        </div>
      }
    </div>
  `,
  styles: [
    `
      .chat-thread {
        display: flex;
        flex-direction: column;
        gap: 28px;
        padding: 32px 24px 16px;
        overflow-y: auto;
        height: 100%;
        scroll-behavior: smooth;
        background: #fdfdfd;
      }

      /* ── Empty State ─────────────────────────────────── */
      .empty-thread {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100%;
        color: #64748b;
        text-align: center;
        gap: 12px;
      }
      .welcome-icon {
        background: linear-gradient(135deg, #eff6ff 0%, #e0f2fe 100%);
        color: #3b82f6;
        width: 80px;
        height: 80px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 8px;
        box-shadow: 0 4px 20px rgba(59,130,246,0.15);
      }
      .empty-thread h3 {
        margin: 0;
        color: #0f172a;
        font-size: 1.6rem;
        font-weight: 700;
        letter-spacing: -0.02em;
      }
      .empty-thread p {
        margin: 0;
        font-size: 1rem;
        max-width: 380px;
        line-height: 1.6;
        color: #94a3b8;
      }
      .example-queries {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        justify-content: center;
        margin-top: 16px;
      }
      .example-chip {
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 20px;
        padding: 8px 16px;
        font-size: 0.85rem;
        cursor: pointer;
        color: #475569;
        transition: all 0.2s;
      }
      .example-chip:hover {
        background: #eff6ff;
        border-color: #bfdbfe;
        color: #2563eb;
      }

      /* ── Message Layout ──────────────────────────────── */
      .message-row {
        display: flex;
        width: 100%;
      }
      .user-row { justify-content: flex-end; }
      .ai-row { justify-content: flex-start; }

      .bubble {
        max-width: 85%;
        border-radius: 18px;
        padding: 18px 22px;
        line-height: 1.65;
      }
      .user-bubble {
        background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
        color: #f8fafc;
        border-bottom-right-radius: 4px;
        font-size: 1rem;
        box-shadow: 0 4px 12px rgba(15,23,42,0.15);
      }
      .ai-bubble {
        background: #ffffff;
        border: 1px solid #e2e8f0;
        border-bottom-left-radius: 4px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.06);
        width: 100%;
        max-width: 90%;
      }
      .error-bubble {
        border-color: #fecaca;
        background: #fff5f5;
      }

      /* ── AI Header ───────────────────────────────────── */
      .ai-header {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 14px;
      }
      .ai-avatar {
        background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
        color: white;
        font-weight: 700;
        font-size: 0.7rem;
        padding: 4px 10px;
        border-radius: 6px;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        box-shadow: 0 2px 6px rgba(59,130,246,0.3);
      }
      .error-avatar {
        background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
        box-shadow: 0 2px 6px rgba(239,68,68,0.3);
      }
      .confidence-badge {
        font-size: 0.72rem;
        padding: 3px 10px;
        border-radius: 12px;
        font-weight: 600;
        letter-spacing: 0.02em;
      }
      .confidence-badge.high { background: #dcfce7; color: #15803d; border: 1px solid #bbf7d0; }
      .confidence-badge.med  { background: #fef9c3; color: #a16207; border: 1px solid #fef08a; }
      .confidence-badge.low  { background: #fee2e2; color: #b91c1c; border: 1px solid #fecaca; }
      .error-label { font-size: 0.8rem; color: #dc2626; font-weight: 600; }

      /* ── Answer Text ─────────────────────────────────── */
      .answer-text {
        font-size: 1rem;
        color: #334155;
        line-height: 1.7;
      }

      /* ── Regenerate ──────────────────────────────────── */
      .regenerate-section {
        margin-top: 16px;
      }
      .btn-regenerate {
        display: inline-flex;
        align-items: center;
        gap: 7px;
        padding: 9px 18px;
        background: #fff;
        border: 1.5px solid #f87171;
        color: #dc2626;
        border-radius: 8px;
        font-size: 0.875rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
      }
      .btn-regenerate:hover:not(:disabled) {
        background: #fef2f2;
        border-color: #dc2626;
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(220,38,38,0.15);
      }
      .btn-regenerate:disabled { opacity: 0.4; cursor: not-allowed; }

      /* ── Chart / Hypotheses ──────────────────────────── */
      .chart-wrapper, .hypotheses-wrapper {
        margin-top: 20px;
        border-radius: 12px;
        overflow: hidden;
      }
      .chart-wrapper {
        border: 1px solid #e2e8f0;
        background: #f8fafc;
        padding: 16px;
      }

      /* ── SQL Details ─────────────────────────────────── */
      .sql-details {
        margin-top: 16px;
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        padding: 10px 14px;
      }
      .sql-details summary {
        cursor: pointer;
        font-size: 0.82rem;
        color: #64748b;
        font-weight: 600;
        outline: none;
        user-select: none;
        display: flex;
        align-items: center;
        gap: 6px;
      }
      .sql-details summary:hover { color: #3b82f6; }

      /* ── Follow-up Chips ─────────────────────────────── */
      .followup-section {
        margin-top: 20px;
        padding-top: 16px;
        border-top: 1px solid #f1f5f9;
      }
      .followup-label {
        display: flex;
        align-items: center;
        gap: 5px;
        font-size: 0.75rem;
        font-weight: 600;
        color: #94a3b8;
        text-transform: uppercase;
        letter-spacing: 0.07em;
        margin-bottom: 10px;
      }
      .followup-chips {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }
      .followup-chip {
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 20px;
        padding: 7px 14px;
        font-size: 0.82rem;
        cursor: pointer;
        color: #374151;
        transition: all 0.2s;
        text-align: left;
        line-height: 1.4;
      }
      .followup-chip:hover:not(:disabled) {
        background: #eff6ff;
        border-color: #93c5fd;
        color: #1d4ed8;
        transform: translateY(-1px);
        box-shadow: 0 3px 8px rgba(59,130,246,0.12);
      }
      .followup-chip:disabled { opacity: 0.5; cursor: not-allowed; }

      /* ── Action Bar (Feedback + Export) ──────────────── */
      .action-bar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        margin-top: 18px;
        padding-top: 14px;
        border-top: 1px solid #f1f5f9;
        flex-wrap: wrap;
      }
      .export-actions {
        display: flex;
        gap: 8px;
        flex-shrink: 0;
      }
      .btn-export {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        background: #ffffff;
        border: 1px solid #d1d5db;
        padding: 6px 12px;
        border-radius: 6px;
        font-size: 0.78rem;
        font-weight: 500;
        cursor: pointer;
        color: #6b7280;
        transition: all 0.2s;
      }
      .btn-export:hover {
        background: #f9fafb;
        border-color: #9ca3af;
        color: #111827;
        transform: translateY(-1px);
      }

      /* ── Loading Bubble ──────────────────────────────── */
      .loading-bubble {
        padding: 20px 24px;
        display: flex;
        align-items: center;
        gap: 12px;
        min-width: 160px;
      }
      .loading-text {
        font-size: 0.85rem;
        color: #94a3b8;
      }
      .typing-indicator {
        display: flex;
        gap: 4px;
      }
      .typing-indicator span {
        width: 8px;
        height: 8px;
        background: #94a3b8;
        border-radius: 50%;
        animation: bounce 1.4s infinite ease-in-out both;
      }
      .typing-indicator span:nth-child(1) { animation-delay: -0.32s; }
      .typing-indicator span:nth-child(2) { animation-delay: -0.16s; }

      @keyframes bounce {
        0%, 80%, 100% { transform: scale(0); }
        40% { transform: scale(1); }
      }
    `
  ]
})
export class ChatThreadComponent implements AfterViewChecked {
  @Input() messages: ChatMessage[] = [];
  @Input() loading = false;
  @Output() exportQuery = new EventEmitter<{ id: number, format: string }>();
  @Output() regenerateQuery = new EventEmitter<string>();
  @Output() followupSelected = new EventEmitter<string>();

  @ViewChild('threadContainer') private threadContainer!: ElementRef;

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  private scrollToBottom(): void {
    try {
      this.threadContainer.nativeElement.scrollTop = this.threadContainer.nativeElement.scrollHeight;
    } catch (err) { }
  }
}
