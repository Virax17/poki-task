import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type BannerTheme = 'teams' | 'quiz' | 'battle';

/** Colourful animated page header with floating emoji. Project stat chips into the default slot. */
@Component({
  selector: 'app-page-banner',
  standalone: true,
  templateUrl: './page-banner.component.html',
  styleUrl: './page-banner.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PageBannerComponent {
  readonly eyebrow = input('');
  readonly title = input.required<string>();
  readonly subtitle = input('');
  readonly theme = input<BannerTheme>('teams');
  /** Emoji that float around the banner; purely decorative. */
  readonly decor = input<string[]>([]);
}
