import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-sql-viewer',
  standalone: true,
  template: `
    <div class="sql-viewer">
      <div class="sql-header">
        <span>Generated SQL</span>
        <button class="copy-btn" (click)="copyToClipboard()">{{ copied ? 'Copied!' : 'Copy' }}</button>
      </div>
      <pre class="sql-code"><code>{{ sql }}</code></pre>
    </div>
  `,
  styles: [
    `
      .sql-viewer {
        border: 1px solid #e0e0e0;
        border-radius: 8px;
        overflow: hidden;
      }
      .sql-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 8px 16px;
        background: #2d2d3f;
        color: #ccc;
        font-size: 0.85rem;
      }
      .copy-btn {
        background: transparent;
        border: 1px solid #666;
        color: #ccc;
        padding: 4px 10px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 0.75rem;
      }
      .copy-btn:hover {
        background: #444;
      }
      .sql-code {
        margin: 0;
        padding: 16px;
        background: #1e1e2f;
        color: #a9dc76;
        font-family: 'Fira Code', 'Consolas', monospace;
        font-size: 0.85rem;
        overflow-x: auto;
        white-space: pre-wrap;
        word-break: break-word;
      }
    `,
  ],
})
export class SqlViewerComponent {
  @Input() sql = '';
  copied = false;

  copyToClipboard(): void {
    navigator.clipboard.writeText(this.sql);
    this.copied = true;
    setTimeout(() => (this.copied = false), 2000);
  }
}
