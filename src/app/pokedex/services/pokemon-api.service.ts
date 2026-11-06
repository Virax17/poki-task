import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { POKEAPI_GRAPHQL_URL } from '../../common/constants/constants';
import { retryWithDelay } from '../../common/utils/rxjs.util';
import { GraphqlClientService } from '../../core/graphql/graphql-client.service';
import {
  MAX_SPECIES_ID,
  SEARCH_RESULT_LIMIT,
} from '../constants/pokedex.constants';
import { Pokemon, PokemonAbility, RawAbility, RawPokemon } from '../models/pokemon.model';
import { mapAbility, mapPokemon } from '../utils/pokemon-mapper.util';

const POKEMON_FIELDS = /* GraphQL */ `
  id
  name
  height
  weight
  pokemontypes {
    type {
      name
    }
  }
  pokemonstats {
    base_stat
    stat {
      name
    }
  }
  pokemonsprites {
    sprites
  }
`;

const GET_POKEMON = /* GraphQL */ `
  query GetPokemon($limit: Int, $offset: Int) {
    pokemon(
      limit: $limit
      offset: $offset
      order_by: { id: asc }
      where: { id: { _lt: ${MAX_SPECIES_ID} } }
    ) {
      ${POKEMON_FIELDS}
    }
  }
`;

const SEARCH_POKEMON = /* GraphQL */ `
  query SearchPokemon($pattern: String, $limit: Int) {
    pokemon(
      limit: $limit
      order_by: { id: asc }
      where: { name: { _ilike: $pattern }, id: { _lt: ${MAX_SPECIES_ID} } }
    ) {
      ${POKEMON_FIELDS}
    }
  }
`;

const GET_POKEMON_BY_IDS = /* GraphQL */ `
  query GetPokemonByIds($ids: [Int!]) {
    pokemon(where: { id: { _in: $ids } }, order_by: { id: asc }) {
      ${POKEMON_FIELDS}
    }
  }
`;

const GET_ABILITIES = /* GraphQL */ `
  query GetAbilities($pokemonId: Int) {
    pokemonability(where: { pokemon_id: { _eq: $pokemonId } }) {
      ability {
        name
        abilityeffecttexts(where: { language_id: { _eq: 9 } }) {
          short_effect
        }
      }
      is_hidden
    }
  }
`;

interface PokemonListData {
  pokemon: RawPokemon[];
}

interface AbilitiesData {
  pokemonability: RawAbility[];
}

/** PokéAPI GraphQL access. Every call retries with a delay before surfacing an error. */
@Injectable({ providedIn: 'root' })
export class PokemonApiService {
  private readonly client = inject(GraphqlClientService);

  /**
   * Fetches one page of Pokémon ordered by id.
   * @param limit Page size.
   * @param offset Number of Pokémon to skip.
   */
  getPokemonPage$(limit: number, offset: number): Observable<Pokemon[]> {
    return this.client
      .execute$<PokemonListData>(POKEAPI_GRAPHQL_URL, GET_POKEMON, { limit, offset })
      .pipe(
        retryWithDelay(),
        map((data) => data.pokemon.map(mapPokemon)),
      );
  }

  /**
   * Searches Pokémon whose name contains `term` (case-insensitive).
   * @param term Search text.
   */
  searchPokemon$(term: string): Observable<Pokemon[]> {
    return this.client
      .execute$<PokemonListData>(POKEAPI_GRAPHQL_URL, SEARCH_POKEMON, {
        pattern: `%${term}%`,
        limit: SEARCH_RESULT_LIMIT,
      })
      .pipe(
        retryWithDelay(),
        map((data) => data.pokemon.map(mapPokemon)),
      );
  }

  /**
   * Fetches specific Pokémon by id.
   * @param ids Pokémon ids.
   */
  getPokemonByIds$(ids: number[]): Observable<Pokemon[]> {
    return this.client
      .execute$<PokemonListData>(POKEAPI_GRAPHQL_URL, GET_POKEMON_BY_IDS, { ids })
      .pipe(
        retryWithDelay(),
        map((data) => data.pokemon.map(mapPokemon)),
      );
  }

  /**
   * Fetches the abilities of a single Pokémon.
   * @param pokemonId Pokémon id.
   */
  getAbilities$(pokemonId: number): Observable<PokemonAbility[]> {
    return this.client
      .execute$<AbilitiesData>(POKEAPI_GRAPHQL_URL, GET_ABILITIES, { pokemonId })
      .pipe(
        retryWithDelay(),
        map((data) => data.pokemonability.map(mapAbility)),
      );
  }
}
