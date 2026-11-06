import { ChangeDetectionStrategy, Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { SkeletonComponent } from '../common/components/skeleton/skeleton.component';
import { StateMessageComponent } from '../common/components/state-message/state-message.component';
import { CacheService } from '../common/services/cache.service';
import { PokemonPool } from '../pokedex/state/pokemon.selectors';
import { PokemonStore } from '../pokedex/state/pokemon.store';
import { Pokemon } from '../pokedex/models/pokemon.model';
import {
  BEST_SCORE_STORAGE_KEY,
  OPTIONS_PER_ROUND,
  POINTS_PER_CORRECT,
  ROUNDS_PER_GAME,
  STREAK_BONUS,
} from './constants/game.constants';
import { GameRound } from './models/game.model';
import { buildRounds } from './utils/round-builder.util';

const LOADING_POOL: PokemonPool = { status: 'loading', error: null, pokemon: [] };

/** "Who's that Pokémon?" — guess the silhouette from four choices over ten rounds. */
@Component({
  selector: 'app-game-page',
  standalone: true,
  imports: [SkeletonComponent, StateMessageComponent],
  templateUrl: './game.component.html',
  styleUrl: './game.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(document:keydown)': 'onKeydown($event)' },
})
export class GamePage {
  protected readonly store = inject(PokemonStore);
  private readonly cache = inject(CacheService);

  readonly roundsPerGame = ROUNDS_PER_GAME;

  /** Pokémon pool (browse list) bridged from the store, with load status. */
  readonly pool = toSignal(this.store.pool$, { initialValue: LOADING_POOL });

  // Game state
  readonly rounds = signal<GameRound[]>([]);
  readonly roundIndex = signal(0);
  readonly score = signal(0);
  readonly streak = signal(0);
  readonly correctCount = signal(0);
  readonly pickedId = signal<number | null>(null);
  readonly artFailed = signal(false);
  readonly bestScore = signal(this.cache.get<number>(BEST_SCORE_STORAGE_KEY) ?? 0);
  readonly isNewBest = signal(false);

  readonly currentRound = computed(() => this.rounds()[this.roundIndex()] ?? null);
  readonly isRevealed = computed(() => this.pickedId() !== null);
  readonly isFinished = computed(
    () => this.rounds().length > 0 && this.roundIndex() >= this.rounds().length,
  );
  readonly isLastRound = computed(() => this.roundIndex() === this.rounds().length - 1);
  readonly wasCorrect = computed(() => this.pickedId() === this.currentRound()?.answer.id);

  /** Loading / error / empty / success for the whole screen. */
  readonly status = computed(() => {
    const pool = this.pool();
    if (pool.status !== 'success') return pool.status;
    return pool.pokemon.length >= OPTIONS_PER_ROUND ? 'success' : 'empty';
  });

  constructor() {
    this.store.init();

    // Start the first game as soon as the Pokémon pool is available.
    effect(() => {
      const pool = this.pool();
      if (pool.status === 'success' && untracked(() => this.rounds().length === 0)) {
        untracked(() => this.startGame());
      }
    });
  }

  /** Starts (or restarts) a game with freshly shuffled rounds. */
  startGame(): void {
    this.rounds.set(buildRounds(this.pool().pokemon, ROUNDS_PER_GAME, OPTIONS_PER_ROUND));
    this.roundIndex.set(0);
    this.score.set(0);
    this.streak.set(0);
    this.correctCount.set(0);
    this.pickedId.set(null);
    this.artFailed.set(false);
    this.isNewBest.set(false);
  }

  /**
   * Submits a guess for the current round. Ignored once the round is revealed.
   * @param pokemon The chosen option.
   */
  choose(pokemon: Pokemon): void {
    const round = this.currentRound();
    if (!round || this.isRevealed()) return;

    this.pickedId.set(pokemon.id);
    if (pokemon.id === round.answer.id) {
      this.streak.set(this.streak() + 1);
      this.correctCount.set(this.correctCount() + 1);
      this.score.set(
        this.score() + POINTS_PER_CORRECT + STREAK_BONUS * (this.streak() - 1),
      );
    } else {
      this.streak.set(0);
    }
  }

  /** Moves to the next round, or finishes the game after the last one. */
  next(): void {
    if (!this.isRevealed()) return;
    this.pickedId.set(null);
    this.artFailed.set(false);
    this.roundIndex.set(this.roundIndex() + 1);

    if (this.isFinished() && this.score() > this.bestScore()) {
      this.bestScore.set(this.score());
      this.isNewBest.set(true);
      this.cache.set(BEST_SCORE_STORAGE_KEY, this.score());
    }
  }

  /** Number keys 1–4 pick an option; N / → advances. */
  onKeydown(event: KeyboardEvent): void {
    if (this.status() !== 'success' || this.isFinished()) return;
    const round = this.currentRound();
    if (!round) return;

    const index = Number(event.key) - 1;
    if (Number.isInteger(index) && index >= 0 && index < round.options.length) {
      this.choose(round.options[index]);
    } else if (event.key.toLowerCase() === 'n' || event.key === 'ArrowRight') {
      this.next();
    }
  }

  /** CSS modifier for an option button after the round is revealed. */
  optionState(option: Pokemon): 'correct' | 'wrong' | 'dim' | null {
    if (!this.isRevealed()) return null;
    if (option.id === this.currentRound()?.answer.id) return 'correct';
    return option.id === this.pickedId() ? 'wrong' : 'dim';
  }

  onRetry(): void {
    this.store.loadNextPage();
  }
}
