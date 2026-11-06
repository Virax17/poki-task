import { Pokemon } from '../../pokedex/models/pokemon.model';

/** One question: guess `answer` from the shuffled `options` (which include the answer). */
export interface GameRound {
  answer: Pokemon;
  options: Pokemon[];
}
