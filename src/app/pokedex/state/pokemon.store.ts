import { DestroyRef, Injectable, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  BehaviorSubject,
  Observable,
  Subject,
  catchError,
  debounceTime,
  defer,
  distinctUntilChanged,
  map,
  merge,
  of,
  switchMap,
  tap,
} from 'rxjs';
import { DEFAULT_PAGE_SIZE, SEARCH_DEBOUNCE_MS } from '../../common/constants/constants';
import { toErrorMessage } from '../../common/utils/error.util';
import { POKEMON_FETCH_LIMIT } from '../constants/pokedex.constants';
import { EvolutionNode } from '../models/evolution.model';
import { PokedexView, PokemonState } from '../models/pokemon-state.model';
import { Pokemon, PokemonAbility, SortKey } from '../models/pokemon.model';
import { PokemonApiService } from '../services/pokemon-api.service';
import { PokemonPool, selectPokedexView$, selectPool$ } from './pokemon.selectors';

export const INITIAL_POKEMON_STATE: PokemonState = {
  byId: {},
  listIds: [],
  status: 'idle',
  error: null,
  hasMore: true,
  loadingMore: false,
  loadMoreError: null,
  searchTerm: '',
  searchResultIds: [],
  searchStatus: 'idle',
  searchError: null,
  typeFilter: null,
  sortKey: 'id',
  sortDirection: 'asc',
  page: 0,
  pageSize: DEFAULT_PAGE_SIZE,
};

/**
 * BehaviorSubject-based store for the Pokédex.
 * Caches every fetched Pokémon and exposes derived streams via selectors.
 */
@Injectable({ providedIn: 'root' })
export class PokemonStore {
  private readonly api = inject(PokemonApiService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly state$ = new BehaviorSubject<PokemonState>(INITIAL_POKEMON_STATE);
  private readonly searchInput$ = new Subject<string>();
  private readonly searchRetry$ = new Subject<void>();
  private readonly abilitiesCache = new Map<number, PokemonAbility[]>();
  private readonly evolutionCache = new Map<number, EvolutionNode[]>();

  /** View model (filtered → sorted → paged) for the Pokédex page. */
  readonly view$: Observable<PokedexView> = selectPokedexView$(this.state$);

  /** Browse list with load status (used by the game). */
  readonly pool$: Observable<PokemonPool> = selectPool$(this.state$);

  constructor() {
    this.wireSearch();
  }

  /** Current state snapshot. */
  get snapshot(): PokemonState {
    return this.state$.value;
  }

  /** Loads the first page if nothing has been fetched yet. */
  init(): void {
    if (this.snapshot.status === 'idle') this.loadNextPage();
  }

  /**
   * Fetches the next page of Pokémon and appends it to the cache.
   * Also used as the Retry action after a failed (initial or incremental) load.
   */
  loadNextPage(): void {
    const { status, loadingMore, listIds, hasMore } = this.snapshot;
    if (status === 'loading' || loadingMore || !hasMore) return;

    const initial = listIds.length === 0;
    this.patch(
      initial
        ? { status: 'loading', error: null }
        : { loadingMore: true, loadMoreError: null },
    );

    this.api
      .getPokemonPage$(POKEMON_FETCH_LIMIT, listIds.length)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (items) => {
          const s = this.snapshot;
          this.patch({
            byId: this.merge(s.byId, items),
            listIds: [...s.listIds, ...items.map((p) => p.id)],
            hasMore: items.length === POKEMON_FETCH_LIMIT,
            status: 'success',
            loadingMore: false,
          });
        },
        error: (err: unknown) =>
          this.patch(
            initial
              ? { status: 'error', error: toErrorMessage(err) }
              : { loadingMore: false, loadMoreError: toErrorMessage(err) },
          ),
      });
  }

  /**
   * Updates the search box value. Debounced (300 ms) before hitting the API.
   * @param term Raw text typed by the user.
   */
  setSearchTerm(term: string): void {
    this.searchInput$.next(term);
  }

  /** Re-runs the last committed search (Retry after an error). */
  retrySearch(): void {
    this.searchRetry$.next();
  }

  /** Filters by a Pokémon type; `null` clears the filter. */
  setTypeFilter(type: string | null): void {
    this.patch({ typeFilter: type, page: 0 });
  }

  /**
   * Sorts by a column. Selecting the active column toggles direction.
   * @param key Column to sort by.
   */
  setSort(key: SortKey): void {
    const { sortKey, sortDirection } = this.snapshot;
    this.patch(
      key === sortKey
        ? { sortDirection: sortDirection === 'asc' ? 'desc' : 'asc', page: 0 }
        : { sortKey: key, sortDirection: key === 'name' ? 'asc' : 'desc', page: 0 },
    );
  }

  /** Goes to a zero-based page. */
  setPage(page: number): void {
    this.patch({ page });
  }

  /** Changes rows-per-page and returns to the first page. */
  setPageSize(pageSize: number): void {
    this.patch({ pageSize, page: 0 });
  }

  /**
   * Searches the API for typeahead use without touching table state.
   * Results are cached so they can later be resolved by id.
   * @param term Search text.
   */
  search$(term: string): Observable<Pokemon[]> {
    return this.api
      .searchPokemon$(term)
      .pipe(tap((items) => this.patch({ byId: this.merge(this.snapshot.byId, items) })));
  }

  /**
   * Resolves Pokémon by id, fetching only those missing from the cache.
   * @param ids Pokémon ids.
   * @returns Pokémon found, in the order of `ids`.
   */
  getByIds$(ids: number[]): Observable<Pokemon[]> {
    return defer(() => {
      const missing = [...new Set(ids)].filter((id) => !this.snapshot.byId[id]);
      const fetch$ = missing.length ? this.api.getPokemonByIds$(missing) : of([]);
      return fetch$.pipe(
        tap((items) => this.patch({ byId: this.merge(this.snapshot.byId, items) })),
        map(() =>
          ids.map((id) => this.snapshot.byId[id]).filter((p): p is Pokemon => !!p),
        ),
      );
    });
  }

  /**
   * Returns a Pokémon's abilities, cached after the first successful fetch.
   * @param pokemonId Pokémon id.
   */
  getAbilities$(pokemonId: number): Observable<PokemonAbility[]> {
    const cached = this.abilitiesCache.get(pokemonId);
    if (cached) return of(cached);
    return this.api
      .getAbilities$(pokemonId)
      .pipe(tap((abilities) => this.abilitiesCache.set(pokemonId, abilities)));
  }

  /**
   * Returns the evolution chain of a Pokémon, cached after the first successful fetch.
   * @param pokemonId Pokémon id.
   */
  getEvolution$(pokemonId: number): Observable<EvolutionNode[]> {
    const cached = this.evolutionCache.get(pokemonId);
    if (cached) return of(cached);
    return this.api
      .getEvolutionChain$(pokemonId)
      .pipe(tap((chain) => this.evolutionCache.set(pokemonId, chain)));
  }

  private wireSearch(): void {
    const term$ = this.searchInput$.pipe(
      map((term) => term.trim()),
      debounceTime(SEARCH_DEBOUNCE_MS),
      distinctUntilChanged(),
    );

    merge(term$, this.searchRetry$.pipe(map(() => this.snapshot.searchTerm)))
      .pipe(
        switchMap((term) => {
          if (!term) {
            this.patch({
              searchTerm: '',
              searchResultIds: [],
              searchStatus: 'idle',
              searchError: null,
              page: 0,
            });
            return of(null);
          }
          this.patch({
            searchTerm: term,
            searchStatus: 'loading',
            searchError: null,
            page: 0,
          });
          return this.api.searchPokemon$(term).pipe(
            tap((items) =>
              this.patch({
                byId: this.merge(this.snapshot.byId, items),
                searchResultIds: items.map((p) => p.id),
                searchStatus: 'success',
              }),
            ),
            catchError((err: unknown) => {
              this.patch({ searchStatus: 'error', searchError: toErrorMessage(err) });
              return of(null);
            }),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  private merge(
    byId: Record<number, Pokemon>,
    items: Pokemon[],
  ): Record<number, Pokemon> {
    const next = { ...byId };
    for (const item of items) next[item.id] = item;
    return next;
  }

  private patch(partial: Partial<PokemonState>): void {
    this.state$.next({ ...this.state$.value, ...partial });
  }
}
