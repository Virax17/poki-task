import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { POKEMON_TYPES, STAT_LABELS } from '../../constants/pokedex.constants';
import { SortDirection, SortKey, STAT_KEYS } from '../../models/pokemon.model';

export type ViewMode = 'cards' | 'table';

@Component({
  selector: 'app-pokemon-filters',
  standalone: true,
  templateUrl: './pokemon-filters.component.html',
  styleUrl: './pokemon-filters.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PokemonFiltersComponent {
  readonly typeFilter = input<string | null>(null);
  readonly viewMode = input<ViewMode>('cards');
  readonly sortKey = input<SortKey>('id');
  readonly sortDirection = input<SortDirection>('asc');

  readonly searchChange = output<string>();
  readonly typeChange = output<string | null>();
  readonly viewModeChange = output<ViewMode>();
  readonly sortChange = output<SortKey>();

  readonly types = POKEMON_TYPES;
  readonly sortOptions: { key: SortKey; label: string }[] = [
    { key: 'id', label: 'Number' },
    { key: 'name', label: 'Name' },
    { key: 'total', label: 'Total power' },
    ...STAT_KEYS.map((key) => ({ key: key as SortKey, label: STAT_LABELS[key] })),
  ];
  readonly text = signal('');

  onSearchInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.text.set(value);
    this.searchChange.emit(value);
  }

  clearSearch(): void {
    this.text.set('');
    this.searchChange.emit('');
  }

  onTypeChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.typeChange.emit(value || null);
  }

  onSortSelect(event: Event): void {
    const key = (event.target as HTMLSelectElement).value as SortKey;
    // The store toggles direction when the same key is chosen, so only emit real changes.
    if (key !== this.sortKey()) this.sortChange.emit(key);
  }
}
