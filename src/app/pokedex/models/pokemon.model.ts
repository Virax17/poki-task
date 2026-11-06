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
  pokemontypes: { type: { name: string } }[];
  pokemonstats: {
    base_stat: number;
    stat: { name: string };
  }[];
  pokemonsprites: { sprites: unknown }[];
}

export interface RawAbility {
  is_hidden: boolean;
  ability: {
    name: string;
    abilityeffecttexts: { short_effect: string }[];
  };
}
