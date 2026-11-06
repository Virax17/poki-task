import { Observable, combineLatest, distinctUntilChanged, map, shareReplay } from 'rxjs';
import { PokedexView, PokemonState, ViewStatus } from '../models/pokemon-state.model';
import { Pokemon, SortDirection, SortKey } from '../models/pokemon.model';

// ---------------------------------------------------------------------------
// Pure helpers (unit-tested without any RxJS plumbing)
// ---------------------------------------------------------------------------

/** Returns Pokémon having `type`; `null` type means "no filter". */
export function filterByType(items: Pokemon[], type: string | null): Pokemon[] {
  return type ? items.filter((pokemon) => pokemon.types.includes(type)) : items;
}

/** Returns a sorted copy of `items` (stable, ties broken by id). */
export function sortPokemon(
  items: Pokemon[],
  key: SortKey,
  direction: SortDirection,
): Pokemon[] {
  const factor = direction === 'asc' ? 1 : -1;
  return [...items].sort((a, b) => {
    const diff =
      key === 'name'
        ? a.name.localeCompare(b.name)
        : key === 'id'
          ? a.id - b.id
          : key === 'total'
            ? a.total - b.total
            : a.stats[key] - b.stats[key];
    return diff !== 0 ? diff * factor : a.id - b.id;
  });
}

/** Returns the zero-based `page` slice of `items`. */
export function paginate<T>(items: T[], page: number, pageSize: number): T[] {
  return items.slice(page * pageSize, (page + 1) * pageSize);
}

/** Highest valid zero-based page for the given item count. */
export function lastPage(totalItems: number, pageSize: number): number {
  return Math.max(0, Math.ceil(totalItems / pageSize) - 1);
}

/** Collapses list/search load state into a single status for the view. */
export function deriveViewStatus(state: PokemonState, rowCount: number): ViewStatus {
  const searching = state.searchTerm.length > 0;
  const status = searching ? state.searchStatus : state.status;
  if (status === 'loading' || status === 'idle') return 'loading';
  if (status === 'error') return 'error';
  return rowCount === 0 ? 'empty' : 'success';
}

// ---------------------------------------------------------------------------
// Selectors: derived streams over the store state
// ---------------------------------------------------------------------------

/** Ids currently feeding the table: search results when searching, else the browse list. */
export function selectSourceIds$(state$: Observable<PokemonState>): Observable<number[]> {
  return state$.pipe(
    map((s) => (s.searchTerm ? s.searchResultIds : s.listIds)),
    distinctUntilChanged(),
  );
}

/** Source ids resolved to Pokémon and narrowed by the type filter. */
export function selectFiltered$(state$: Observable<PokemonState>): Observable<Pokemon[]> {
  return combineLatest([
    selectSourceIds$(state$),
    state$.pipe(map((s) => s.byId), distinctUntilChanged()),
    state$.pipe(map((s) => s.typeFilter), distinctUntilChanged()),
  ]).pipe(
    map(([ids, byId, type]) =>
      filterByType(
        ids.map((id) => byId[id]).filter((p): p is Pokemon => !!p),
        type,
      ),
    ),
  );
}

/** Filtered Pokémon sorted by the active column. */
export function selectSorted$(state$: Observable<PokemonState>): Observable<Pokemon[]> {
  return combineLatest([
    selectFiltered$(state$),
    state$.pipe(map((s) => s.sortKey), distinctUntilChanged()),
    state$.pipe(map((s) => s.sortDirection), distinctUntilChanged()),
  ]).pipe(map(([items, key, dir]) => sortPokemon(items, key, dir)));
}

export interface PokemonPool {
  status: ViewStatus;
  error: string | null;
  pokemon: Pokemon[];
}

/** Browse list (unfiltered) with a load status, used by features such as the game. */
export function selectPool$(state$: Observable<PokemonState>): Observable<PokemonPool> {
  return state$.pipe(
    map((s) => ({ status: s.status, error: s.error, listIds: s.listIds, byId: s.byId })),
    distinctUntilChanged(
      (a, b) => a.status === b.status && a.error === b.error && a.listIds === b.listIds,
    ),
    map(({ status, error, listIds, byId }): PokemonPool => {
      const pokemon = listIds.map((id) => byId[id]).filter((p): p is Pokemon => !!p);
      const viewStatus: ViewStatus =
        status === 'error'
          ? 'error'
          : status === 'success'
            ? pokemon.length === 0
              ? 'empty'
              : 'success'
            : 'loading';
      return { status: viewStatus, error, pokemon };
    }),
    shareReplay({ bufferSize: 1, refCount: true }),
  );
}

/**
 * Builds the complete Pokédex view model (filtered → sorted → paged).
 * `shareReplay(1)` lets several template bindings share one computation.
 */
export function selectPokedexView$(
  state$: Observable<PokemonState>,
): Observable<PokedexView> {
  const sorted$ = selectSorted$(state$).pipe(shareReplay({ bufferSize: 1, refCount: true }));

  return combineLatest([sorted$, state$]).pipe(
    map(([sorted, state]) => {
      const page = Math.min(state.page, lastPage(sorted.length, state.pageSize));
      const rows = paginate(sorted, page, state.pageSize);
      return {
        status: deriveViewStatus(state, sorted.length),
        error: state.searchTerm ? state.searchError : state.error,
        rows,
        totalFiltered: sorted.length,
        page,
        pageSize: state.pageSize,
        sortKey: state.sortKey,
        sortDirection: state.sortDirection,
        searchTerm: state.searchTerm,
        typeFilter: state.typeFilter,
        isSearching: state.searchTerm.length > 0,
        hasMore: state.hasMore,
        loadingMore: state.loadingMore,
        loadMoreError: state.loadMoreError,
      };
    }),
    shareReplay({ bufferSize: 1, refCount: true }),
  );
}
