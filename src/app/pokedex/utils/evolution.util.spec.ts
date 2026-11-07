import { describe, expect, it } from 'vitest';
import { RawEvolutionSpecies } from '../models/evolution.model';
import { buildEvolutionStages, describeCondition, mapEvolutionChain } from './evolution.util';

const rule = (over: Partial<RawEvolutionSpecies['pokemonevolutions'][number]> = {}) => ({
  min_level: null,
  min_happiness: null,
  time_of_day: '',
  item: null,
  evolutiontrigger: { name: 'level-up' },
  ...over,
});

const charmander: RawEvolutionSpecies[] = [
  { id: 4, name: 'charmander', evolves_from_species_id: null, pokemonevolutions: [] },
  { id: 5, name: 'charmeleon', evolves_from_species_id: 4, pokemonevolutions: [rule({ min_level: 16 })] },
  { id: 6, name: 'charizard', evolves_from_species_id: 5, pokemonevolutions: [rule({ min_level: 36 })] },
];

describe('describeCondition', () => {
  it('describes levels, items, friendship, trade and base forms', () => {
    expect(describeCondition([rule({ min_level: 16 })])).toBe('Lv. 16');
    expect(
      describeCondition([rule({ item: { name: 'fire-stone' }, evolutiontrigger: { name: 'use-item' } })]),
    ).toBe('Use Fire stone');
    expect(describeCondition([rule({ min_happiness: 160, time_of_day: 'night' })])).toBe(
      'Friendship, night',
    );
    expect(describeCondition([rule({ evolutiontrigger: { name: 'trade' } })])).toBe('Trade');
    expect(describeCondition([])).toBeNull();
  });

  it('prefers the first informative rule when several exist', () => {
    const rules = [rule(), rule({ item: { name: 'leaf-stone' }, evolutiontrigger: { name: 'use-item' } })];
    expect(describeCondition(rules)).toBe('Use Leaf stone');
  });
});

describe('evolution stages', () => {
  it('groups a linear chain into one node per stage', () => {
    const stages = buildEvolutionStages(mapEvolutionChain(charmander));
    expect(stages.map((s) => s.map((n) => n.name))).toEqual([
      ['charmander'],
      ['charmeleon'],
      ['charizard'],
    ]);
    expect(stages[1][0].condition).toBe('Lv. 16');
  });

  it('puts branching evolutions in the same stage', () => {
    const eevee: RawEvolutionSpecies[] = [
      { id: 133, name: 'eevee', evolves_from_species_id: null, pokemonevolutions: [] },
      { id: 134, name: 'vaporeon', evolves_from_species_id: 133, pokemonevolutions: [rule()] },
      { id: 135, name: 'jolteon', evolves_from_species_id: 133, pokemonevolutions: [rule()] },
    ];
    const stages = buildEvolutionStages(mapEvolutionChain(eevee));
    expect(stages).toHaveLength(2);
    expect(stages[1].map((n) => n.name)).toEqual(['vaporeon', 'jolteon']);
  });

  it('survives a cyclic parent reference without hanging', () => {
    const stages = buildEvolutionStages([
      { id: 1, name: 'a', parentId: 2, condition: null },
      { id: 2, name: 'b', parentId: 1, condition: null },
    ]);
    expect(stages.flat()).toHaveLength(2);
  });
});
