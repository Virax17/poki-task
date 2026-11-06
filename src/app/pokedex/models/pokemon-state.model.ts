import { LoadStatus, Pokemon, SortDirection, SortKey } from './pokemon.model';

/** Core state held in the BehaviorSubject of the Pokémon store. */
export interface PokemonState {
  /** Cache of every Pokémon fetched so far, keyed by id. */
  byId: Record<number, Pokemon>;
  /** Ordered ids of the paginated (browse) list. */
  listIds: number[];
  status: LoadStatus;
  error: string | null;
  hasMore: boolean;
  loadingMore: boolean;
  loadMoreError: string | null;

  /** Committed (debounced) search term. Empty string = no search. */
  searchTerm: string;
  searchResultIds: number[];
  searchStatus: LoadStatus;
  searchError: string | null;

  typeFilter: string | null;
  sortKey: SortKey;
  sortDirection: SortDirection;
  page: number;
  pageSize: number;
}

export type ViewStatus = 'loading' | 'error' | 'empty' | 'success';

/** Everything the Pokédex page needs, derived from {@link PokemonState}. */
export interface PokedexView {
  status: ViewStatus;
  error: string | null;
  rows: Pokemon[];
  totalFiltered: number;
  page: number;
  pageSize: number;
  sortKey: SortKey;
  sortDirection: SortDirection;
  searchTerm: string;
  typeFilter: string | null;
  isSearching: boolean;
  hasMore: boolean;
  loadingMore: boolean;
  loadMoreError: string | null;
}
