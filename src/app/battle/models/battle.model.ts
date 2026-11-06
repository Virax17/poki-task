import { Pokemon } from '../../pokedex/models/pokemon.model';

export type MoveId = 'quick' | 'strike' | 'blast' | 'guard';
export type Side = 'player' | 'opponent';

export interface Move {
  id: MoveId;
  label: string;
  description: string;
  /** 0 for non-damaging moves. */
  power: number;
  /** Hit chance, 0–100. */
  accuracy: number;
  kind: 'physical' | 'special' | 'status';
}

export interface Combatant {
  pokemon: Pokemon;
  hp: number;
  maxHp: number;
  /** True for the rest of the turn after using Guard. */
  guarding: boolean;
}

export interface BattleState {
  player: Combatant;
  opponent: Combatant;
}

/** One thing that happened during a turn; the UI replays these with animations. */
export interface TurnEvent {
  actor: Side;
  moveId: MoveId;
  text: string;
  damage: number;
  heal: number;
  missed: boolean;
  crit: boolean;
  /** 1 = normal, 2 / 4 = super effective, 0.5 / 0.25 = not very effective, 0 = no effect. */
  effectiveness: number;
  /** HP of each side right after this event. */
  playerHp: number;
  opponentHp: number;
}

export interface TurnResult {
  events: TurnEvent[];
  state: BattleState;
  winner: Side | null;
}
