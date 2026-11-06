import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { CacheService } from '../common/services/cache.service';
import { PaginationComponent } from '../common/components/pagination/pagination.component';
import { PokemonCardGridComponent } from './components/pokemon-card-grid/pokemon-card-grid.component';
import { PokemonDetailPanelComponent } from './components/pokemon-detail-panel/pokemon-detail-panel.component';
import { PokemonFiltersComponent, ViewMode } from './components/pokemon-filters/pokemon-filters.component';
import { PokemonTableComponent } from './components/pokemon-table/pokemon-table.component';
import { TOTAL_SPECIES, VIEW_MODE_STORAGE_KEY } from './constants/pokedex.constants';
import { Pokemon } from './models/pokemon.model';
import { PokemonStore } from './state/pokemon.store';

@Component({
  selector: 'app-pokedex-page',
  standalone: true,
  imports: [
    PaginationComponent,
    PokemonCardGridComponent,
    PokemonDetailPanelComponent,
    PokemonFiltersComponent,
    PokemonTableComponent,
  ],
  templateUrl: './pokedex.component.html',
  styleUrl: './pokedex.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PokedexPage {
  protected readonly store = inject(PokemonStore);
  private readonly cache = inject(CacheService);

  readonly totalSpecies = TOTAL_SPECIES;

  /** Store selector bridged into the template. */
  readonly view = toSignal(this.store.view$, { requireSync: false });

  // UI state
  readonly selectedPokemon = signal<Pokemon | null>(null);
  readonly isPanelOpen = signal(false);
  readonly viewMode = signal<ViewMode>(
    this.cache.get<ViewMode>(VIEW_MODE_STORAGE_KEY) === 'table' ? 'table' : 'cards',
  );

  constructor() {
    this.store.init();

    // Remember the chosen view between visits.
    effect(() => this.cache.set(VIEW_MODE_STORAGE_KEY, this.viewMode()));
  }

  onRowSelected(pokemon: Pokemon): void {
    this.selectedPokemon.set(pokemon);
    this.isPanelOpen.set(true);
  }

  closePanel(): void {
    this.isPanelOpen.set(false);
  }

  onRetry(): void {
    const view = this.view();
    if (view?.isSearching) this.store.retrySearch();
    else this.store.loadNextPage();
  }
}
