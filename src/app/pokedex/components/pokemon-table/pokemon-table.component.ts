import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { SkeletonComponent } from '../../../common/components/skeleton/skeleton.component';
import { StateMessageComponent } from '../../../common/components/state-message/state-message.component';
import { TypeBadgeComponent } from '../../../common/components/type-badge/type-badge.component';
import { STAT_LABELS } from '../../constants/pokedex.constants';
import { PokedexView } from '../../models/pokemon-state.model';
import { Pokemon, STAT_KEYS, SortKey, StatKey } from '../../models/pokemon.model';

interface Column {
  key: StatKey;
  label: string;
}

@Component({
  selector: 'app-pokemon-table',
  standalone: true,
  imports: [SkeletonComponent, StateMessageComponent, TypeBadgeComponent],
  templateUrl: './pokemon-table.component.html',
  styleUrl: './pokemon-table.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PokemonTableComponent {
  readonly view = input.required<PokedexView>();
  readonly selectedId = input<number | null>(null);

  readonly sortChange = output<SortKey>();
  readonly rowSelected = output<Pokemon>();
  readonly retry = output<void>();

  readonly statColumns: Column[] = STAT_KEYS.map((key) => ({
    key,
    label: STAT_LABELS[key],
  }));

  /** Skeleton rows match the page size so the table height never jumps. */
  readonly skeletonRows = computed(() =>
    Array.from({ length: this.view().pageSize }, (_, i) => i),
  );

  readonly emptyMessage = computed(() => {
    const v = this.view();
    if (v.isSearching) return `No Pokémon match "${v.searchTerm}". Try another name.`;
    if (v.typeFilter) return `No ${v.typeFilter}-type Pokémon loaded yet. Try another type.`;
    return 'No Pokémon to show.';
  });

  ariaSort(key: SortKey): 'ascending' | 'descending' | 'none' {
    const v = this.view();
    if (v.sortKey !== key) return 'none';
    return v.sortDirection === 'asc' ? 'ascending' : 'descending';
  }
}
