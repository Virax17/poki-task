import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { SkeletonComponent } from '../../../common/components/skeleton/skeleton.component';
import { StateMessageComponent } from '../../../common/components/state-message/state-message.component';
import { TypeBadgeComponent } from '../../../common/components/type-badge/type-badge.component';
import { getTypeColor } from '../../../common/utils/type-colors.util';
import {
  MAX_SINGLE_STAT,
  MAX_STAT_TOTAL,
  STAT_SHORT_LABELS,
} from '../../constants/pokedex.constants';
import { PokedexView } from '../../models/pokemon-state.model';
import { Pokemon, STAT_KEYS } from '../../models/pokemon.model';

/** Circumference of the progress ring (radius 26). */
const RING_CIRCUMFERENCE = 2 * Math.PI * 26;

interface CardVm {
  pokemon: Pokemon;
  primary: string;
  secondary: string;
  ringOffset: number;
  bars: { label: string; value: number; percent: number }[];
}

/** Animated card grid: staggered entry, floating artwork, filling stat bars and a total-power ring. */
@Component({
  selector: 'app-pokemon-card-grid',
  standalone: true,
  imports: [SkeletonComponent, StateMessageComponent, TypeBadgeComponent],
  templateUrl: './pokemon-card-grid.component.html',
  styleUrl: './pokemon-card-grid.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PokemonCardGridComponent {
  readonly view = input.required<PokedexView>();
  readonly selectedId = input<number | null>(null);

  readonly rowSelected = output<Pokemon>();
  readonly retry = output<void>();

  readonly ringCircumference = RING_CIRCUMFERENCE;

  readonly cards = computed<CardVm[]>(() =>
    this.view().rows.map((pokemon) => {
      const primary = getTypeColor(pokemon.types[0] ?? 'normal');
      return {
        pokemon,
        primary,
        secondary: getTypeColor(pokemon.types[1] ?? pokemon.types[0] ?? 'normal'),
        ringOffset: RING_CIRCUMFERENCE * (1 - Math.min(1, pokemon.total / MAX_STAT_TOTAL)),
        bars: STAT_KEYS.map((key) => ({
          label: STAT_SHORT_LABELS[key],
          value: pokemon.stats[key],
          percent: Math.min(100, Math.round((pokemon.stats[key] / MAX_SINGLE_STAT) * 100)),
        })),
      };
    }),
  );

  /** Skeleton cards match the page size so the grid never jumps. */
  readonly skeletons = computed(() => Array.from({ length: this.view().pageSize }, (_, i) => i));

  readonly emptyMessage = computed(() => {
    const v = this.view();
    if (v.isSearching) return `No Pokémon match "${v.searchTerm}". Try another name.`;
    if (v.typeFilter) return `No ${v.typeFilter}-type Pokémon loaded yet. Try another type.`;
    return 'No Pokémon to show.';
  });

  /** Entry animation delay index; wraps so big pages don't wait seconds to appear. */
  delayIndex(index: number): number {
    return index % 12;
  }

  padId(id: number): string {
    return String(id).padStart(3, '0');
  }

  onArtworkError(event: Event, fallbackUrl: string): void {
    const image = event.currentTarget as HTMLImageElement | null;
    if (image && image.src !== fallbackUrl) image.src = fallbackUrl;
  }
}
