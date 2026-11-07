export const ROUNDS_PER_GAME = 10;
export const OPTIONS_PER_ROUND = 4;
export const POINTS_PER_CORRECT = 10;
/** Extra points per consecutive correct answer beyond the first. */
export const STREAK_BONUS = 5;

/** Seconds the player has to answer each round. */
export const ROUND_SECONDS = 10;
/** Marker stored as the picked id when the timer runs out. */
export const TIMEOUT_PICK = -1;

export const BEST_SCORE_STORAGE_KEY = 'miniPokedex.gameBestScore';

/** Rating tiers by number of correct answers (out of 10): [minCorrect, stars, title]. */
export const RATINGS: readonly [number, number, string][] = [
  [9, 3, 'Pokémon Master!'],
  [6, 2, 'Great trainer!'],
  [3, 1, 'Rookie trainer'],
  [0, 0, 'Keep training!'],
];
