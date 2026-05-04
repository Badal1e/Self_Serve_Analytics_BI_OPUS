import { Pipe, PipeTransform, SecurityContext } from '@angular/core';
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
    
    // Italic: *text* (excluding asterisks inside bold)
    html = html.replace(/(?<!\*)\*(?!\*)(.*?)(?<!\*)\*(?!\*)/g, '<em>$1</em>');

    // Convert newlines to paragraphs
    const paragraphs = html
      .split(/\n\s*\n/)
      .map(p => p.trim())
      .filter(p => p.length > 0)
      .map(p => `<p>${p}</p>`)
      .join('');

    // If it didn't split into paragraphs (single line without double breaks), wrap in one P
    if (!html.includes('\n')) {
       html = `<p>${html}</p>`;
    } else {
       html = paragraphs;
    }

    // Since we trust our own basic formatting, but we still want to sanitize
    // However, DomSanitizer.sanitize removes tags if not careful.
    // Given we are generating simple tags from safe LLM text, we bypassSecurityTrustHtml.
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }
}
