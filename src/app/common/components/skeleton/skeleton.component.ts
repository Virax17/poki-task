import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Shimmering placeholder block shown while async data loads. */
@Component({
  selector: 'app-skeleton',
  standalone: true,
  templateUrl: './skeleton.component.html',
  styleUrl: './skeleton.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SkeletonComponent {
  readonly width = input<string>('100%');
  readonly height = input<string>('16px');
  readonly circle = input(false);
}
