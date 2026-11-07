import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { CacheService } from '../common/services/cache.service';
import { ToastService } from '../core/toast/toast.service';
import { toErrorMessage } from '../common/utils/error.util';
import { PaginationComponent } from '../common/components/pagination/pagination.component';
import { PokemonCardGridComponent } from './components/pokemon-card-grid/pokemon-card-grid.component';
import { PokemonDetailPanelComponent } from './components/pokemon-detail-panel/pokemon-detail-panel.component';
import { PokedexDockComponent } from './components/pokedex-dock/pokedex-dock.component';
import { PokedexHeroComponent } from './components/pokedex-hero/pokedex-hero.component';
import { TypeRailComponent } from './components/type-rail/type-rail.component';
import { PokemonTableComponent } from './components/pokemon-table/pokemon-table.component';
import { TOTAL_SPECIES, VIEW_MODE_STORAGE_KEY } from './constants/pokedex.constants';
import { Pokemon } from './models/pokemon.model';
import { ViewMode } from './models/view-mode.model';
import { PokemonStore } from './state/pokemon.store';

@Component({
  selector: 'app-pokedex-page',
  standalone: true,
  imports: [
    PaginationComponent,
    PokemonCardGridComponent,
    PokemonDetailPanelComponent,
    PokedexDockComponent,
    PokedexHeroComponent,
    TypeRailComponent,
    PokemonTableComponent,
  ],
  templateUrl: './pokedex.component.html',
  styleUrl: './pokedex.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PokedexPage {
  protected readonly store = inject(PokemonStore);
  private readonly cache = inject(CacheService);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  readonly totalSpecies = TOTAL_SPECIES;
  private readonly dock = viewChild(PokedexDockComponent);

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

  /** Opens another member of the evolution chain in the panel. */
  onEvolutionPicked(id: number): void {
    this.store
      .getByIds$([id])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ([pokemon]) => {
          if (pokemon) this.selectedPokemon.set(pokemon);
        },
        error: (err: unknown) => this.toast.error(toErrorMessage(err)),
      });
  }

  /** Removes the search text and type filter. */
  clearFilters(): void {
    this.dock()?.clearSearch(false);
    this.store.setTypeFilter(null);
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
