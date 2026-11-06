import { Pokemon } from '../../pokedex/models/pokemon.model';

export interface TypeCount {
  type: string;
  count: number;
}

/**
 * Counts how many team members have each type, most common first.
 * @param members Pokémon on the team.
 */
export function typeDistribution(members: Pokemon[]): TypeCount[] {
  const counts = new Map<string, number>();
  for (const pokemon of members) {
    for (const type of pokemon.types) counts.set(type, (counts.get(type) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count || a.type.localeCompare(b.type));
}

/**
 * Sums the base-stat totals of every team member.
 * @param members Pokémon on the team.
 */
export function totalBaseStats(members: Pokemon[]): number {
  return members.reduce((sum, pokemon) => sum + pokemon.total, 0);
}
