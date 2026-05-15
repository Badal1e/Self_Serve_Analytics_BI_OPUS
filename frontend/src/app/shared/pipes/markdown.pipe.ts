import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Pipe({
  name: 'markdown',
  standalone: true
})
export class MarkdownPipe implements PipeTransform {
  constructor(private sanitizer: DomSanitizer) {}

  transform(value: string | undefined | null): SafeHtml {
    if (!value) return '';

    let html = value;

    // Bold: **text**
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    // Italic: *text* (not inside bold)
    html = html.replace(/(?<!\*)\*(?!\*)(.*?)(?<!\*)\*(?!\*)/g, '<em>$1</em>');

    // Highlight currency values: $1,234 / $1.2M / $194,607.50
    html = html.replace(
      /(\$[\d,]+(?:\.\d+)?(?:[KMB])?)/g,
      '<mark class="hl-number">$1</mark>'
    );

    // Highlight standalone percentages: 12.5%
    html = html.replace(
      /\b([\d,]+(?:\.\d+)?%)/g,
      '<mark class="hl-number">$1</mark>'
    );

    // Highlight large plain numbers (>999, not inside marks): 194,607
    html = html.replace(
      /(?<![\$\d,])\b(\d{1,3}(?:,\d{3})+(?:\.\d+)?)\b/g,
      (match, p1) => {
        // Don't double-wrap already highlighted content
        if (html.includes(`<mark class="hl-number">${p1}</mark>`)) return match;
        return `<mark class="hl-number">${p1}</mark>`;
      }
    );

    // Highlight business keywords
    const keywords = [
      'Revenue', 'Growth', 'Decline', 'Total', 'Average', 'Count',
      'Failed', 'Successful', 'Success', 'Transactions', 'Conversion',
      'Chargeback', 'Refund', 'Profit', 'Loss', 'Increase', 'Decrease',
      'YoY', 'MoM', 'QoQ', 'MTD', 'YTD', 'KPI', 'Trend', 'Peak', 'Drop',
    ];
    const kwPattern = new RegExp(`\\b(${keywords.join('|')})\\b`, 'g');
    html = html.replace(kwPattern, '<mark class="hl-keyword">$1</mark>');

    // Format paragraphs
    const paragraphs = html
      .split(/\n\s*\n/)
      .map(p => p.trim())
      .filter(p => p.length > 0)
      .map(p => `<p>${p}</p>`)
      .join('');

    html = html.includes('\n') ? paragraphs : `<p>${html}</p>`;

    return this.sanitizer.bypassSecurityTrustHtml(html);
  }
}
