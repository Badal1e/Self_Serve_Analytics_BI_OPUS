import {
  Component,
  Input,
  OnChanges,
  SimpleChanges,
  ElementRef,
  ViewChild,
  AfterViewInit,
} from '@angular/core';

declare const vegaEmbed: any;

@Component({
  selector: 'app-chart-display',
  standalone: true,
  template: `
    <div class="chart-container">
      <div #chartEl class="chart-element"></div>
    </div>
  `,
  styles: [
    `
      .chart-container {
        border: 1px solid #e0e0e0;
        border-radius: 8px;
        padding: 16px;
        background: white;
      }
      .chart-element {
        width: 100%;
      }
    `,
  ],
})
export class ChartDisplayComponent implements OnChanges, AfterViewInit {
  @Input() spec: any = null;
  @ViewChild('chartEl') chartEl!: ElementRef;
  private viewReady = false;

  ngAfterViewInit(): void {
    this.viewReady = true;
    this.renderChart();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['spec'] && this.viewReady) {
      this.renderChart();
    }
  }

  private renderChart(): void {
    if (!this.spec || !this.chartEl) return;

    try {
      if (typeof vegaEmbed !== 'undefined') {
        vegaEmbed(this.chartEl.nativeElement, this.spec, {
          actions: false,
          theme: 'latimes',
        }).catch((err: any) => console.error('Vega embed error:', err));
      }
    } catch {
      console.warn('Vega-embed not available');
    }
  }
}
