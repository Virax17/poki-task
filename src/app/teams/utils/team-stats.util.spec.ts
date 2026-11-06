import { describe, expect, it } from 'vitest';
import { Pokemon } from '../../pokedex/models/pokemon.model';
import { totalBaseStats, typeDistribution } from './team-stats.util';

const make = (types: string[], total: number) => ({ types, total }) as Pokemon;

describe('team stats', () => {
  const members = [make(['fire', 'flying'], 534), make(['water'], 530), make(['fire'], 309)];

  it('counts types, most common first', () => {
    expect(typeDistribution(members)).toEqual([
      { type: 'fire', count: 2 },
      { type: 'flying', count: 1 },
      { type: 'water', count: 1 },
    ]);
  });

  it('sums base stat totals', () => {
    expect(totalBaseStats(members)).toBe(1373);
    expect(totalBaseStats([])).toBe(0);
  });
});
