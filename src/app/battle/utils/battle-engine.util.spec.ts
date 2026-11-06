import { describe, expect, it } from 'vitest';
import { Pokemon, STAT_KEYS } from '../../pokedex/models/pokemon.model';
import { BattleState } from '../models/battle.model';
import {
  chooseOpponentMove,
  createCombatant,
  moveTypeOf,
  resolveTurn,
  typeMultiplier,
} from './battle-engine.util';

function make(name: string, types: string[], overrides: Partial<Pokemon['stats']> = {}): Pokemon {
  const stats = Object.fromEntries(STAT_KEYS.map((k) => [k, 60])) as Pokemon['stats'];
  Object.assign(stats, overrides);
  return {
    id: 1,
    name,
    height: 1,
    weight: 1,
    types,
    stats,
    total: 0,
    spriteUrl: '',
    artworkUrl: '',
  };
}

const state = (player: Pokemon, opponent: Pokemon): BattleState => ({
  player: createCombatant(player),
  opponent: createCombatant(opponent),
});

/** Never misses, never crits, no damage variance roll beyond the minimum. */
const noLuck = () => 0.5;
const alwaysHit = () => 0;
const rolls = (...values: number[]) => {
  let i = 0;
  return () => values[Math.min(i++, values.length - 1)];
};

describe('typeMultiplier', () => {
  it('handles super effective, resisted, immune and dual types', () => {
    expect(typeMultiplier('water', ['fire'])).toBe(2);
    expect(typeMultiplier('fire', ['water'])).toBe(0.5);
    expect(typeMultiplier('electric', ['ground'])).toBe(0);
    expect(typeMultiplier('ice', ['grass', 'flying'])).toBe(4);
    expect(typeMultiplier('normal', ['normal'])).toBe(1);
  });
});

describe('resolveTurn', () => {
  it('lets the faster Pokémon act first', () => {
    const s = state(make('slow', ['normal'], { speed: 10 }), make('fast', ['normal'], { speed: 120 }));
    const result = resolveTurn(s, 'quick', 'quick', alwaysHit);
    expect(result.events[0].actor).toBe('opponent');
  });

  it('gives Guard priority and halves incoming damage that turn', () => {
    const attacker = make('fast', ['normal'], { speed: 200, attack: 100 });
    const defender = make('slow', ['normal'], { speed: 10 });
    const s = state(defender, attacker);

    const guarded = resolveTurn(s, 'guard', 'strike', rolls(0.5, 0, 0.99, 0.5));
    const open = resolveTurn(s, 'quick', 'strike', rolls(0.5, 0, 0.99, 0.5));

    expect(guarded.events[0]).toMatchObject({ actor: 'player', moveId: 'guard' });
    const guardedHit = guarded.events.find((e) => e.actor === 'opponent')!;
    const openHit = open.events.find((e) => e.actor === 'opponent')!;
    expect(guardedHit.damage).toBeLessThan(openHit.damage);
  });

  it('skips the slower Pokémon when it is knocked out first', () => {
    const glass = make('glass', ['normal'], { hp: 1, speed: 1, defense: 1 });
    const brute = make('brute', ['fighting'], { attack: 250, speed: 250 });
    const result = resolveTurn(state(glass, brute), 'quick', 'strike', alwaysHit);

    expect(result.winner).toBe('opponent');
    expect(result.events).toHaveLength(1);
    expect(result.state.player.hp).toBe(0);
  });

  it('records a miss without dealing damage', () => {
    const s = state(make('a', ['normal']), make('b', ['normal']));
    const result = resolveTurn(s, 'blast', 'guard', rolls(0.99));
    const miss = result.events.find((e) => e.actor === 'player')!;
    expect(miss.missed).toBe(true);
    expect(miss.damage).toBe(0);
    expect(result.state.opponent.hp).toBe(s.opponent.hp);
  });

  it('deals no damage to immune targets and reports the effectiveness', () => {
    const s = state(make('sparky', ['electric']), make('digger', ['ground']));
    const result = resolveTurn(s, 'strike', 'guard', alwaysHit);
    const hit = result.events.find((e) => e.actor === 'player')!;
    expect(hit.effectiveness).toBe(0);
    expect(hit.damage).toBe(0);
  });

  it('never heals above max HP and never mutates the input state', () => {
    const s = state(make('a', ['normal']), make('b', ['normal']));
    const before = JSON.stringify(s);
    const result = resolveTurn(s, 'guard', 'guard', noLuck);
    expect(result.state.player.hp).toBe(s.player.maxHp);
    expect(JSON.stringify(s)).toBe(before);
  });
});

describe('helpers', () => {
  it('picks move types from the Pokémon types', () => {
    const dual = make('d', ['grass', 'poison']);
    expect(moveTypeOf(dual, 'strike')).toBe('grass');
    expect(moveTypeOf(dual, 'blast')).toBe('poison');
    expect(moveTypeOf(dual, 'quick')).toBe('normal');
  });

  it('opponent AI returns a valid move and can guard when hurt', () => {
    const s = state(make('a', ['normal']), make('b', ['normal']));
    expect(['strike', 'blast', 'quick']).toContain(chooseOpponentMove(s, () => 0.9));
    s.opponent.hp = 1;
    expect(chooseOpponentMove(s, () => 0.1)).toBe('guard');
  });
});
