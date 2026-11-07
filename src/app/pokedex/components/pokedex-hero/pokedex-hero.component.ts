import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/** Page banner with an animated Poké Ball and a "discovered" progress bar. */
@Component({
  selector: 'app-pokedex-hero',
  standalone: true,
  templateUrl: './pokedex-hero.component.html',
  styleUrl: './pokedex-hero.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PokedexHeroComponent {
  readonly discovered = input.required<number>();
  readonly total = input.required<number>();

  readonly percent = computed(() => Math.min(100, (this.discovered() / this.total()) * 100));
}
