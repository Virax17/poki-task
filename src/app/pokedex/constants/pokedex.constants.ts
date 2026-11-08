import { StatKey } from '../models/pokemon.model';

/** Number of Pokémon fetched per GraphQL request. Smaller batches render sooner. */
export const POKEMON_FETCH_LIMIT = 60;

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

/** Approximate number of Pokémon species, used for the "discovered" progress bar. */
export const TOTAL_SPECIES = 1025;

/** Highest stat total used to scale the circular progress ring on cards. */
export const MAX_STAT_TOTAL = 720;

/** Highest single stat used to scale the stat bars on cards. */
export const MAX_SINGLE_STAT = 160;

export const VIEW_MODE_STORAGE_KEY = 'miniPokedex.viewMode';

export const STAT_SHORT_LABELS: Readonly<Record<StatKey, string>> = {
  hp: 'HP',
  attack: 'ATK',
  defense: 'DEF',
  'special-attack': 'SpA',
  'special-defense': 'SpD',
  speed: 'SPD',
};
