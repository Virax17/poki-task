/** Background colours for Pokémon type badges. */
export const TYPE_COLORS: Readonly<Record<string, string>> = {
  normal: '#8a8a59',
  fire: '#d9701f',
  water: '#4f78d6',
  electric: '#c9a40f',
  grass: '#4f9a3a',
  ice: '#5fa8a8',
  fighting: '#a82b24',
  poison: '#873e87',
  ground: '#b89a45',
  flying: '#7c6fcf',
  psychic: '#d14275',
  bug: '#8a9610',
  rock: '#8f7a21',
  ghost: '#5a4580',
  dragon: '#5527d6',
  dark: '#5a4638',
  steel: '#8a8aa6',
  fairy: '#cc7a8c',
};

const FALLBACK_TYPE_COLOR = '#6c757d';

/**
 * Returns the badge colour for a Pokémon type.
 * @param type Lowercase type name, e.g. `fire`.
 */
export function getTypeColor(type: string): string {
  return TYPE_COLORS[type] ?? FALLBACK_TYPE_COLOR;
}
