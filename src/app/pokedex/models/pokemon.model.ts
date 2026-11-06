export const STAT_KEYS = [
  'hp',
  'attack',
  'defense',
  'special-attack',
  'special-defense',
  'speed',
] as const;

export type StatKey = (typeof STAT_KEYS)[number];

export type SortKey = 'id' | 'name' | StatKey | 'total';
export type SortDirection = 'asc' | 'desc';

export interface Pokemon {
  id: number;
  name: string;
  height: number;
  weight: number;
  types: string[];
  stats: Record<StatKey, number>;
  total: number;
  spriteUrl: string;
  artworkUrl: string;
}

export interface PokemonAbility {
  name: string;
  shortEffect: string | null;
  isHidden: boolean;
}

export type LoadStatus = 'idle' | 'loading' | 'success' | 'error';

/** Raw shapes returned by the PokéAPI GraphQL endpoint. */
export interface RawPokemon {
  id: number;
  name: string;
  height: number;
  weight: number;
  pokemon_v2_pokemontypes: { pokemon_v2_type: { name: string } }[];
  pokemon_v2_pokemonstats: {
    base_stat: number;
    pokemon_v2_stat: { name: string };
  }[];
  pokemon_v2_pokemonsprites: { sprites: unknown }[];
}

export interface RawAbility {
  is_hidden: boolean;
  pokemon_v2_ability: {
    name: string;
    pokemon_v2_abilityeffecttexts: { short_effect: string }[];
  };
}
