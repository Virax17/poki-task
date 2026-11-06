import { describe, expect, it } from 'vitest';
import { Pokemon } from '../../pokedex/models/pokemon.model';
import { buildRounds, shuffle } from './round-builder.util';

const pool = Array.from({ length: 20 }, (_, i) => ({ id: i + 1, name: `mon-${i + 1}` }) as Pokemon);

describe('buildRounds', () => {
  it('builds unique answers, each with the answer among distinct options', () => {
    const rounds = buildRounds(pool, 10, 4);

    expect(rounds).toHaveLength(10);
    expect(new Set(rounds.map((r) => r.answer.id)).size).toBe(10);
    for (const round of rounds) {
      expect(round.options).toHaveLength(4);
      expect(new Set(round.options.map((o) => o.id)).size).toBe(4);
      expect(round.options.some((o) => o.id === round.answer.id)).toBe(true);
    }
  });

  it('caps rounds at the pool size and returns none for a pool that is too small', () => {
    expect(buildRounds(pool.slice(0, 5), 10, 4)).toHaveLength(5);
    expect(buildRounds(pool.slice(0, 3), 10, 4)).toEqual([]);
  });

  it('shuffle does not mutate its input', () => {
    const input = [1, 2, 3, 4];
    const result = shuffle(input, () => 0);
    expect(input).toEqual([1, 2, 3, 4]);
    expect(result).toHaveLength(4);
  });
});
