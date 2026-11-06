import { Move, MoveId } from '../models/battle.model';

export const MOVES: Readonly<Record<MoveId, Move>> = {
  quick: {
    id: 'quick',
    label: 'Quick Attack',
    description: 'Weak but reliable Normal-type hit.',
    power: 40,
    accuracy: 100,
    kind: 'physical',
  },
  strike: {
    id: 'strike',
    label: 'Strike',
    description: 'Physical hit using your main type.',
    power: 70,
    accuracy: 90,
    kind: 'physical',
  },
  blast: {
    id: 'blast',
    label: 'Blast',
    description: 'Powerful special attack, may miss.',
    power: 95,
    accuracy: 78,
    kind: 'special',
  },
  guard: {
    id: 'guard',
    label: 'Guard',
    description: 'Goes first, halves damage this turn, heals 12%.',
    power: 0,
    accuracy: 100,
    kind: 'status',
  },
};

export const MOVE_ORDER: readonly MoveId[] = ['quick', 'strike', 'blast', 'guard'];

export const FIGHTER_CHOICES = 8;
export const CRIT_CHANCE = 1 / 12;
export const CRIT_MULTIPLIER = 1.5;
export const GUARD_HEAL_RATIO = 0.12;
/** Delay between animation steps while a turn is replayed. */
export const ATTACK_ANIMATION_MS = 450;
export const HIT_ANIMATION_MS = 800;

export const BATTLE_BEST_STREAK_KEY = 'miniPokedex.battleBestStreak';

interface TypeRelations {
  double?: string[];
  half?: string[];
  none?: string[];
}

/** Attacking type → defending types it is strong / weak / ineffective against. */
export const TYPE_CHART: Readonly<Record<string, TypeRelations>> = {
  normal: { half: ['rock', 'steel'], none: ['ghost'] },
  fire: { double: ['grass', 'ice', 'bug', 'steel'], half: ['fire', 'water', 'rock', 'dragon'] },
  water: { double: ['fire', 'ground', 'rock'], half: ['water', 'grass', 'dragon'] },
  electric: { double: ['water', 'flying'], half: ['electric', 'grass', 'dragon'], none: ['ground'] },
  grass: {
    double: ['water', 'ground', 'rock'],
    half: ['fire', 'grass', 'poison', 'flying', 'bug', 'dragon', 'steel'],
  },
  ice: { double: ['grass', 'ground', 'flying', 'dragon'], half: ['fire', 'water', 'ice', 'steel'] },
  fighting: {
    double: ['normal', 'ice', 'rock', 'dark', 'steel'],
    half: ['poison', 'flying', 'psychic', 'bug', 'fairy'],
    none: ['ghost'],
  },
  poison: { double: ['grass', 'fairy'], half: ['poison', 'ground', 'rock', 'ghost'], none: ['steel'] },
  ground: {
    double: ['fire', 'electric', 'poison', 'rock', 'steel'],
    half: ['grass', 'bug'],
    none: ['flying'],
  },
  flying: { double: ['grass', 'fighting', 'bug'], half: ['electric', 'rock', 'steel'] },
  psychic: { double: ['fighting', 'poison'], half: ['psychic', 'steel'], none: ['dark'] },
  bug: {
    double: ['grass', 'psychic', 'dark'],
    half: ['fire', 'fighting', 'poison', 'flying', 'ghost', 'steel', 'fairy'],
  },
  rock: { double: ['fire', 'ice', 'flying', 'bug'], half: ['fighting', 'ground', 'steel'] },
  ghost: { double: ['psychic', 'ghost'], half: ['dark'], none: ['normal'] },
  dragon: { double: ['dragon'], half: ['steel'], none: ['fairy'] },
  dark: { double: ['psychic', 'ghost'], half: ['fighting', 'dark', 'fairy'] },
  steel: { double: ['ice', 'rock', 'fairy'], half: ['fire', 'water', 'electric', 'steel'] },
  fairy: { double: ['fighting', 'dragon', 'dark'], half: ['fire', 'poison', 'steel'] },
};
