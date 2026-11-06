import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { PaginationComponent } from '../common/components/pagination/pagination.component';
import { PokemonDetailPanelComponent } from './components/pokemon-detail-panel/pokemon-detail-panel.component';
import { PokemonFiltersComponent } from './components/pokemon-filters/pokemon-filters.component';
import { PokemonTableComponent } from './components/pokemon-table/pokemon-table.component';
import { Pokemon } from './models/pokemon.model';
import { PokemonStore } from './state/pokemon.store';

@Component({
  selector: 'app-pokedex-page',
  standalone: true,
  imports: [
    PaginationComponent,
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

  /** Store selector bridged into the template. */
  readonly view = toSignal(this.store.view$, { requireSync: false });

  // UI state
  readonly selectedPokemon = signal<Pokemon | null>(null);
  readonly isPanelOpen = signal(false);

  constructor() {
    this.store.init();
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
