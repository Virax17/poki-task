import { BehaviorSubject, firstValueFrom } from 'rxjs';
import { describe, expect, it } from 'vitest';
import { PokemonState } from '../models/pokemon-state.model';
import { Pokemon, STAT_KEYS } from '../models/pokemon.model';
import { INITIAL_POKEMON_STATE } from './pokemon.store';
import {
  deriveViewStatus,
  filterByType,
  paginate,
  selectPokedexView$,
  sortPokemon,
} from './pokemon.selectors';

function makePokemon(id: number, name: string, types: string[], attack: number): Pokemon {
  const stats = Object.fromEntries(STAT_KEYS.map((k) => [k, 50])) as Pokemon['stats'];
  stats.attack = attack;
  return {
    id,
    name,
    height: 1,
    weight: 1,
    types,
    stats,
    total: Object.values(stats).reduce((a, b) => a + b, 0),
    spriteUrl: '',
    artworkUrl: '',
  };
}

const bulbasaur = makePokemon(1, 'bulbasaur', ['grass', 'poison'], 49);
const charmander = makePokemon(4, 'charmander', ['fire'], 52);
const squirtle = makePokemon(7, 'squirtle', ['water'], 48);

function stateWith(partial: Partial<PokemonState>): PokemonState {
  return {
    ...INITIAL_POKEMON_STATE,
    status: 'success',
    byId: { 1: bulbasaur, 4: charmander, 7: squirtle },
    listIds: [1, 4, 7],
    ...partial,
  };
}

describe('pokemon selectors', () => {
  it('filters by type and sorts by a stat column', async () => {
    const state$ = new BehaviorSubject(
      stateWith({ sortKey: 'attack', sortDirection: 'desc' }),
    );
    const view = await firstValueFrom(selectPokedexView$(state$));
    expect(view.rows.map((p) => p.name)).toEqual(['charmander', 'bulbasaur', 'squirtle']);

    state$.next(stateWith({ typeFilter: 'poison' }));
    const filtered = await firstValueFrom(selectPokedexView$(state$));
    expect(filtered.rows.map((p) => p.name)).toEqual(['bulbasaur']);
    expect(filtered.totalFiltered).toBe(1);
  });

  it('clamps the page and slices by page size', async () => {
    const state$ = new BehaviorSubject(stateWith({ page: 99, pageSize: 2 }));
    const view = await firstValueFrom(selectPokedexView$(state$));
    expect(view.page).toBe(1);
    expect(view.rows.map((p) => p.id)).toEqual([7]);
  });

  it('uses search results while searching and reports an empty state', async () => {
    const state$ = new BehaviorSubject(
      stateWith({ searchTerm: 'zzz', searchStatus: 'success', searchResultIds: [] }),
    );
    const view = await firstValueFrom(selectPokedexView$(state$));
    expect(view.status).toBe('empty');
    expect(view.isSearching).toBe(true);
  });

  it('derives loading, error and success view statuses', () => {
    expect(deriveViewStatus(stateWith({ status: 'loading' }), 0)).toBe('loading');
    expect(deriveViewStatus(stateWith({ status: 'error' }), 0)).toBe('error');
    expect(deriveViewStatus(stateWith({}), 3)).toBe('success');
    expect(
      deriveViewStatus(stateWith({ searchTerm: 'a', searchStatus: 'error' }), 0),
    ).toBe('error');
  });

  it('sortPokemon is stable and does not mutate its input', () => {
    const input = [squirtle, bulbasaur, charmander];
    const sorted = sortPokemon(input, 'name', 'asc');
    expect(sorted.map((p) => p.name)).toEqual(['bulbasaur', 'charmander', 'squirtle']);
    expect(input[0]).toBe(squirtle);
  });

  it('filterByType(null) and paginate behave as identity / slice', () => {
    expect(filterByType([bulbasaur], null)).toEqual([bulbasaur]);
    expect(paginate([1, 2, 3, 4, 5], 1, 2)).toEqual([3, 4]);
  });
});
