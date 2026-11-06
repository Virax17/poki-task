import { Pokemon } from '../../pokedex/models/pokemon.model';
import { GameRound } from '../models/game.model';

type RandomFn = () => number;

/** Returns a shuffled copy of `items` (Fisher–Yates). */
export function shuffle<T>(items: T[], random: RandomFn = Math.random): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * Builds the rounds for one game. Every answer is unique within the game and each
 * round's options contain the answer plus distinct distractors, in random order.
 * @param pool Pokémon to draw from.
 * @param roundCount Desired number of rounds (capped by the pool size).
 * @param optionCount Choices shown per round.
 * @param random Random source (injectable for tests).
 * @returns Rounds, or an empty array when the pool is too small to build a round.
 */
export function buildRounds(
  pool: Pokemon[],
  roundCount: number,
  optionCount: number,
  random: RandomFn = Math.random,
): GameRound[] {
  if (pool.length < optionCount) return [];

  const answers = shuffle(pool, random).slice(0, Math.min(roundCount, pool.length));
  return answers.map((answer) => {
    const distractors = shuffle(
      pool.filter((p) => p.id !== answer.id),
      random,
    ).slice(0, optionCount - 1);
    return { answer, options: shuffle([answer, ...distractors], random) };
  });
}
