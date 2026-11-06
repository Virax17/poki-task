import { SPRITE_BASE_URL } from '../constants/pokedex.constants';
import {
  Pokemon,
  PokemonAbility,
  RawAbility,
  RawPokemon,
  STAT_KEYS,
  StatKey,
} from '../models/pokemon.model';

function parseSprites(raw: unknown): Record<string, unknown> {
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw) as Record<string, unknown>;
    } catch {
      return {};
    }
  }
  return (raw as Record<string, unknown> | null) ?? {};
}

function readString(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null;
}

/**
 * Maps a raw GraphQL Pokémon into the app model.
 * Missing sprites fall back to the public sprite repository by id.
 */
export function mapPokemon(raw: RawPokemon): Pokemon {
  const stats = Object.fromEntries(STAT_KEYS.map((key) => [key, 0])) as Record<
    StatKey,
    number
  >;
  for (const stat of raw.pokemonstats) {
    const key = stat.stat.name as StatKey;
    if (key in stats) stats[key] = stat.base_stat;
  }

  const sprites = parseSprites(raw.pokemonsprites[0]?.sprites);
  const other = sprites['other'] as
    | Record<string, Record<string, unknown>>
    | undefined;
  const fallback = `${SPRITE_BASE_URL}/${raw.id}.png`;

  return {
    id: raw.id,
    name: raw.name,
    height: raw.height,
    weight: raw.weight,
    types: raw.pokemontypes.map((t) => t.type.name),
    stats,
    total: STAT_KEYS.reduce((sum, key) => sum + stats[key], 0),
    spriteUrl: readString(sprites['front_default']) ?? fallback,
    artworkUrl:
      readString(other?.['official-artwork']?.['front_default']) ??
      `${SPRITE_BASE_URL}/other/official-artwork/${raw.id}.png`,
  };
}

/** Maps a raw GraphQL ability row into the app model. */
export function mapAbility(raw: RawAbility): PokemonAbility {
  return {
    name: raw.ability.name,
    shortEffect:
      raw.ability.abilityeffecttexts[0]?.short_effect ?? null,
    isHidden: raw.is_hidden,
  };
}
