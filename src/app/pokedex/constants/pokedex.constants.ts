import { StatKey } from '../models/pokemon.model';

/** Number of Pokémon fetched per GraphQL request. */
export const POKEMON_FETCH_LIMIT = 150;

/** Pokémon with ids above this value are alternate forms and are excluded. */
export const MAX_SPECIES_ID = 10000;

/** Max results requested by name search / typeahead. */
export const SEARCH_RESULT_LIMIT = 20;

export const SPRITE_BASE_URL =
  'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon';

export const POKEMON_TYPES = [
  'normal',
  'fire',
  'water',
  'electric',
  'grass',
  'ice',
  'fighting',
  'poison',
  'ground',
  'flying',
  'psychic',
  'bug',
  'rock',
  'ghost',
  'dragon',
  'dark',
  'steel',
  'fairy',
] as const;

export const STAT_LABELS: Readonly<Record<StatKey, string>> = {
  hp: 'HP',
  attack: 'Attack',
  defense: 'Defense',
  'special-attack': 'Sp.Atk',
  'special-defense': 'Sp.Def',
  speed: 'Speed',
};
