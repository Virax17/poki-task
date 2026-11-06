import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  effect,
  inject,
  input,
  viewChild,
} from '@angular/core';
import { RadarChart } from 'echarts/charts';
import { RadarComponent, TooltipComponent } from 'echarts/components';
import * as echarts from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { STAT_LABELS } from '../../constants/pokedex.constants';
import { STAT_KEYS, StatKey } from '../../models/pokemon.model';

echarts.use([RadarChart, RadarComponent, TooltipComponent, CanvasRenderer]);

const MAX_STAT_VALUE = 255;

/** Radar chart of the six base stats. Animates whenever `stats` changes. */
@Component({
  selector: 'app-stat-radar-chart',
  standalone: true,
  templateUrl: './stat-radar-chart.component.html',
  styleUrl: './stat-radar-chart.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatRadarChartComponent {
  readonly stats = input.required<Record<StatKey, number>>();
  readonly label = input<string>('Base stats');
  readonly color = input<string>('#ef5350');

  private readonly host = viewChild.required<ElementRef<HTMLDivElement>>('chart');
  private chart?: echarts.ECharts;
  private resizeObserver?: ResizeObserver;

  constructor() {
    const destroyRef = inject(DestroyRef);

    effect(() => {
      const el = this.host().nativeElement;
      const stats = this.stats();
      const color = this.color();
      const name = this.label();

      if (!this.chart) {
        this.chart = echarts.init(el);
        this.resizeObserver = new ResizeObserver(() => this.chart?.resize());
        this.resizeObserver.observe(el);
      }

      this.chart.setOption({
        animationDuration: 600,
        animationDurationUpdate: 700,
        animationEasingUpdate: 'cubicOut',
        tooltip: {},
        radar: {
          radius: '62%',
          indicator: STAT_KEYS.map((key) => ({
            name: STAT_LABELS[key],
            max: MAX_STAT_VALUE,
          })),
          axisName: { color: '#d0d4d4' },
          splitArea: { areaStyle: { color: ['transparent'] } },
          splitLine: { lineStyle: { color: 'rgba(255,255,255,0.12)' } },
          axisLine: { lineStyle: { color: 'rgba(255,255,255,0.12)' } },
        },
        series: [
          {
            type: 'radar',
            data: [{ value: STAT_KEYS.map((key) => stats[key]), name }],
            lineStyle: { color, width: 2 },
            itemStyle: { color },
            areaStyle: { color, opacity: 0.35 },
          },
        ],
      });
    });

    destroyRef.onDestroy(() => {
      this.resizeObserver?.disconnect();
      this.chart?.dispose();
    });
  }
}
