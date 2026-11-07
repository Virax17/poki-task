import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { STAT_LABELS } from '../../constants/pokedex.constants';
import { SortDirection, SortKey, STAT_KEYS } from '../../models/pokemon.model';
import { ViewMode } from '../../models/view-mode.model';

/**
 * Floating glass control dock (search · sort · view). Press "/" anywhere to jump to the search box.
 */
@Component({
  selector: 'app-pokedex-dock',
  standalone: true,
  templateUrl: './pokedex-dock.component.html',
  styleUrl: './pokedex-dock.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(document:keydown)': 'onKeydown($event)' },
})
export class PokedexDockComponent {
  readonly viewMode = input<ViewMode>('cards');
  readonly sortKey = input<SortKey>('id');
  readonly sortDirection = input<SortDirection>('asc');

  readonly searchChange = output<string>();
  readonly viewModeChange = output<ViewMode>();
  readonly sortChange = output<SortKey>();

  readonly text = signal('');
  private readonly searchInput = viewChild.required<ElementRef<HTMLInputElement>>('search');

  readonly sortOptions: { key: SortKey; label: string }[] = [
    { key: 'id', label: 'Number' },
    { key: 'name', label: 'Name' },
    { key: 'total', label: 'Total power' },
    ...STAT_KEYS.map((key) => ({ key: key as SortKey, label: STAT_LABELS[key] })),
  ];

  onSearchInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.text.set(value);
    this.searchChange.emit(value);
  }

  clearSearch(): void {
    this.text.set('');
    this.searchChange.emit('');
    this.searchInput().nativeElement.focus();
  }

  onSortSelect(event: Event): void {
    const key = (event.target as HTMLSelectElement).value as SortKey;
    // The store toggles direction when the same key is chosen, so only emit real changes.
    if (key !== this.sortKey()) this.sortChange.emit(key);
  }

  /** "/" focuses search unless the user is already typing somewhere. */
  onKeydown(event: KeyboardEvent): void {
    const target = event.target as HTMLElement | null;
    const typing = !!target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);
    if (event.key === '/' && !typing) {
      event.preventDefault();
      this.searchInput().nativeElement.focus();
    } else if (event.key === 'Escape' && target === this.searchInput().nativeElement) {
      this.searchInput().nativeElement.blur();
    }
  }
}
