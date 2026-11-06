import { Pokemon } from '../../pokedex/models/pokemon.model';
import {
  CRIT_CHANCE,
  CRIT_MULTIPLIER,
  GUARD_HEAL_RATIO,
  MOVES,
  TYPE_CHART,
} from '../constants/battle.constants';
import {
  BattleState,
  Combatant,
  MoveId,
  Side,
  TurnEvent,
  TurnResult,
} from '../models/battle.model';

type RandomFn = () => number;

/** Max HP derived from the base HP stat (≈ 100–470). */
export function maxHpOf(pokemon: Pokemon): number {
  return pokemon.stats.hp * 2 + 60;
}

/**
 * Creates a fresh combatant at full health.
 * @param pokemon Fighter.
 */
export function createCombatant(pokemon: Pokemon): Combatant {
  const maxHp = maxHpOf(pokemon);
  return { pokemon, hp: maxHp, maxHp, guarding: false };
}

/**
 * Combined type multiplier of an attack against a defender's types.
 * @param moveType Attacking type.
 * @param defenderTypes Types of the defending Pokémon.
 * @returns 0 (immune), 0.25, 0.5, 1, 2 or 4.
 */
export function typeMultiplier(moveType: string, defenderTypes: string[]): number {
  const relations = TYPE_CHART[moveType];
  if (!relations) return 1;
  return defenderTypes.reduce((multiplier, defending) => {
    if (relations.none?.includes(defending)) return multiplier * 0;
    if (relations.double?.includes(defending)) return multiplier * 2;
    if (relations.half?.includes(defending)) return multiplier * 0.5;
    return multiplier;
  }, 1);
}

/**
 * Elemental type a move deals. Quick Attack is always Normal;
 * Strike uses the first type and Blast the second (or first) type.
 */
export function moveTypeOf(pokemon: Pokemon, moveId: MoveId): string {
  if (moveId === 'quick' || moveId === 'guard') return 'normal';
  if (moveId === 'blast') return pokemon.types[1] ?? pokemon.types[0] ?? 'normal';
  return pokemon.types[0] ?? 'normal';
}

/** Whether `actor` moves first this turn: Guard has priority, otherwise speed (ties are random). */
export function playerGoesFirst(
  state: BattleState,
  playerMove: MoveId,
  opponentMove: MoveId,
  random: RandomFn,
): boolean {
  const playerPriority = playerMove === 'guard' ? 1 : 0;
  const opponentPriority = opponentMove === 'guard' ? 1 : 0;
  if (playerPriority !== opponentPriority) return playerPriority > opponentPriority;

  const playerSpeed = state.player.pokemon.stats.speed;
  const opponentSpeed = state.opponent.pokemon.stats.speed;
  if (playerSpeed !== opponentSpeed) return playerSpeed > opponentSpeed;
  return random() < 0.5;
}

/** Simple opponent AI: guards when low on HP sometimes, otherwise a weighted attack. */
export function chooseOpponentMove(state: BattleState, random: RandomFn = Math.random): MoveId {
  const { opponent } = state;
  if (opponent.hp / opponent.maxHp < 0.3 && random() < 0.35) return 'guard';

  const roll = random();
  if (roll < 0.35) return 'strike';
  if (roll < 0.65) return 'blast';
  return 'quick';
}

/** Capitalises a Pokémon name for display. */
export function capitalise(name: string): string {
  return name.charAt(0).toUpperCase() + name.slice(1);
}

function effectivenessText(effectiveness: number): string {
  if (effectiveness === 0) return " It doesn't affect the target…";
  if (effectiveness > 1) return " It's super effective!";
  if (effectiveness < 1) return " It's not very effective…";
  return '';
}

/**
 * Resolves one full turn (both sides act, unless someone faints first).
 * Pure: returns new state plus the ordered events for the UI to animate.
 * @param state Combatants at the start of the turn.
 * @param playerMove Move chosen by the player.
 * @param opponentMove Move chosen by the opponent.
 * @param random Random source (injectable for tests).
 */
export function resolveTurn(
  state: BattleState,
  playerMove: MoveId,
  opponentMove: MoveId,
  random: RandomFn = Math.random,
): TurnResult {
  const combatants: Record<Side, Combatant> = {
    player: { ...state.player, guarding: false },
    opponent: { ...state.opponent, guarding: false },
  };
  const moves: Record<Side, MoveId> = { player: playerMove, opponent: opponentMove };
  const order: Side[] = playerGoesFirst(state, playerMove, opponentMove, random)
    ? ['player', 'opponent']
    : ['opponent', 'player'];

  const events: TurnEvent[] = [];

  for (const actor of order) {
    if (combatants.player.hp <= 0 || combatants.opponent.hp <= 0) break;

    const target: Side = actor === 'player' ? 'opponent' : 'player';
    const attacker = combatants[actor];
    const defender = combatants[target];
    const move = MOVES[moves[actor]];
    const name = capitalise(attacker.pokemon.name);

    let damage = 0;
    let heal = 0;
    let missed = false;
    let crit = false;
    let effectiveness = 1;
    let text = `${name} used ${move.label}!`;

    if (move.kind === 'status') {
      heal = Math.min(attacker.maxHp - attacker.hp, Math.round(attacker.maxHp * GUARD_HEAL_RATIO));
      combatants[actor] = { ...attacker, hp: attacker.hp + heal, guarding: true };
      text += ' It braces for impact.';
    } else if (random() * 100 >= move.accuracy) {
      missed = true;
      text += ' But it missed!';
    } else {
      const attack =
        move.kind === 'physical' ? attacker.pokemon.stats.attack : attacker.pokemon.stats['special-attack'];
      const defense =
        move.kind === 'physical' ? defender.pokemon.stats.defense : defender.pokemon.stats['special-defense'];
      effectiveness = typeMultiplier(moveTypeOf(attacker.pokemon, move.id), defender.pokemon.types);
      crit = effectiveness > 0 && random() < CRIT_CHANCE;

      const base = (22 * move.power * (attack / Math.max(1, defense))) / 50 + 2;
      const variance = 0.85 + 0.15 * random();
      const raw =
        base * effectiveness * variance * (crit ? CRIT_MULTIPLIER : 1) * (defender.guarding ? 0.5 : 1);
      damage = effectiveness === 0 ? 0 : Math.max(1, Math.floor(raw));
      damage = Math.min(damage, defender.hp);

      combatants[target] = { ...defender, hp: defender.hp - damage };
      text += effectivenessText(effectiveness) + (crit ? ' A critical hit!' : '');
    }

    events.push({
      actor,
      moveId: move.id,
      text,
      damage,
      heal,
      missed,
      crit,
      effectiveness,
      playerHp: combatants.player.hp,
      opponentHp: combatants.opponent.hp,
    });
  }

  const winner: Side | null =
    combatants.opponent.hp <= 0 ? 'player' : combatants.player.hp <= 0 ? 'opponent' : null;

  return { events, state: { player: combatants.player, opponent: combatants.opponent }, winner };
}
