import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  effect,
  inject,
  signal,
  untracked,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { concat, concatMap, defer, from, of, timer } from 'rxjs';
import { ConfettiComponent } from '../common/components/confetti/confetti.component';
import { PageBannerComponent } from '../common/components/page-banner/page-banner.component';
import { SkeletonComponent } from '../common/components/skeleton/skeleton.component';
import { StateMessageComponent } from '../common/components/state-message/state-message.component';
import { CacheService } from '../common/services/cache.service';
import { Pokemon } from '../pokedex/models/pokemon.model';
import { PokemonPool } from '../pokedex/state/pokemon.selectors';
import { PokemonStore } from '../pokedex/state/pokemon.store';
import { shuffle } from '../game/utils/round-builder.util';
import {
  ATTACK_ANIMATION_MS,
  BATTLE_BEST_STREAK_KEY,
  FIGHTER_CHOICES,
  HIT_ANIMATION_MS,
  INTRO_MS,
  MATCHMAKING_RANGE,
} from './constants/battle.constants';
import { BattleState, FloatingText, MoveId, Side, TurnEvent } from './models/battle.model';
import { BattleFighterComponent } from './components/battle-fighter/battle-fighter.component';
import { BattleMovesComponent } from './components/battle-moves/battle-moves.component';
import { BattleSelectComponent } from './components/battle-select/battle-select.component';
import { capitalise, chooseOpponentMove, createCombatant, resolveTurn } from './utils/battle-engine.util';

type Phase = 'select' | 'intro' | 'battle' | 'over';

const LOADING_POOL: PokemonPool = { status: 'loading', error: null, pokemon: [] };

/** Turn-based 1v1 battle: pick a fighter, then trade moves with a random opponent. */
@Component({
  selector: 'app-battle-page',
  standalone: true,
  imports: [
    BattleFighterComponent,
    BattleMovesComponent,
    BattleSelectComponent,
    ConfettiComponent,
    PageBannerComponent,
    SkeletonComponent,
    StateMessageComponent,
  ],
  templateUrl: './battle.component.html',
  styleUrl: './battle.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(document:keydown)': 'onKeydown($event)' },
})
export class BattlePage {
  protected readonly store = inject(PokemonStore);
  private readonly cache = inject(CacheService);
  private readonly destroyRef = inject(DestroyRef);

  readonly pool = toSignal(this.store.pool$, { initialValue: LOADING_POOL });

  // UI state
  readonly phase = signal<Phase>('select');
  readonly choices = signal<Pokemon[]>([]);
  readonly battle = signal<BattleState | null>(null);
  readonly busy = signal(false);
  readonly winner = signal<Side | null>(null);
  readonly log = signal<string[]>([]);

  // Animated, "currently displayed" values (replayed event by event)
  readonly playerHp = signal(0);
  readonly opponentHp = signal(0);
  readonly attacking = signal<Side | null>(null);
  readonly hurt = signal<Side | null>(null);
  readonly floating = signal<FloatingText | null>(null);
  readonly shake = signal(false);
  readonly artFailed = signal<Record<Side, boolean>>({ player: false, opponent: false });

  // Session stats
  readonly wins = signal(0);
  readonly losses = signal(0);
  readonly streak = signal(0);
  readonly bestStreak = signal(this.cache.get<number>(BATTLE_BEST_STREAK_KEY) ?? 0);

  readonly status = computed(() => {
    const pool = this.pool();
    if (pool.status !== 'success') return pool.status;
    return pool.pokemon.length >= 2 ? 'success' : 'empty';
  });

  constructor() {
    this.store.init();

    // Offer fighters as soon as the Pokémon pool is available.
    effect(() => {
      const pool = this.pool();
      if (pool.status === 'success' && untracked(() => this.choices().length === 0)) {
        untracked(() => this.rerollChoices());
      }
    });
  }

  /** Shows a new random set of fighters to choose from. */
  rerollChoices(): void {
    this.choices.set(shuffle(this.pool().pokemon).slice(0, FIGHTER_CHOICES));
  }

  /**
   * Starts a battle with the chosen fighter against a random opponent.
   * @param fighter Pokémon picked by the player.
   */
  startBattle(fighter: Pokemon): void {
    const rivals = this.pool().pokemon.filter((p) => p.id !== fighter.id);
    const fair = rivals.filter((p) => Math.abs(p.total - fighter.total) <= MATCHMAKING_RANGE);
    const opponent = shuffle(fair.length ? fair : rivals)[0];
    if (!opponent) return;

    const state: BattleState = { player: createCombatant(fighter), opponent: createCombatant(opponent) };
    this.begin(state);
  }

  /** Rematch with the same fighters at full health. */
  rematch(): void {
    const current = this.battle();
    if (!current) return;
    this.begin({
      player: createCombatant(current.player.pokemon),
      opponent: createCombatant(current.opponent.pokemon),
    });
  }

  /** Returns to fighter selection. */
  chooseAnother(): void {
    this.phase.set('select');
    this.battle.set(null);
    this.rerollChoices();
  }

  /**
   * Plays a turn: the opponent picks a move, the engine resolves it,
   * then the resulting events are replayed with animations.
   * @param moveId Move chosen by the player.
   */
  useMove(moveId: MoveId): void {
    const state = this.battle();
    if (!state || this.busy() || this.phase() !== 'battle') return;

    const result = resolveTurn(state, moveId, chooseOpponentMove(state));
    this.busy.set(true);
    this.battle.set(result.state);

    from(result.events)
      .pipe(
        concatMap((event) => this.animate$(event)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        complete: () => {
          this.busy.set(false);
          if (result.winner) this.finish(result.winner);
        },
      });
  }

  onKeydown(event: KeyboardEvent): void {
    if (this.phase() !== 'battle') return;
    const moveIds: MoveId[] = ['quick', 'strike', 'blast', 'guard'];
    const index = Number(event.key) - 1;
    if (Number.isInteger(index) && index >= 0 && index < moveIds.length) {
      this.useMove(moveIds[index]);
    }
  }

  /** Art URL for a side; falls back to the small sprite if the artwork fails to load. */
  artFor(side: Side): string {
    const pokemon = this.battle()?.[side].pokemon;
    if (!pokemon) return '';
    return this.artFailed()[side] ? pokemon.spriteUrl : pokemon.artworkUrl;
  }

  onArtError(side: Side): void {
    this.artFailed.set({ ...this.artFailed(), [side]: true });
  }

  private begin(state: BattleState): void {
    this.battle.set(state);
    this.playerHp.set(state.player.hp);
    this.opponentHp.set(state.opponent.hp);
    this.winner.set(null);
    this.attacking.set(null);
    this.hurt.set(null);
    this.floating.set(null);
    this.artFailed.set({ player: false, opponent: false });
    this.log.set([
      `A wild ${capitalise(state.opponent.pokemon.name)} appears! Go, ${capitalise(state.player.pokemon.name)}!`,
    ]);
    this.shake.set(false);
    this.phase.set('intro');

    // Let the "VS" overlay play, then hand control to the player.
    timer(INTRO_MS)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        if (this.phase() === 'intro') this.phase.set('battle');
      });
  }

  /** Lunge → apply damage/heal with a hit flash and floating number → settle. */
  private animate$(event: TurnEvent) {
    const target: Side = event.actor === 'player' ? 'opponent' : 'player';
    return concat(
      defer(() => {
        if (event.moveId !== 'guard') this.attacking.set(event.actor);
        return timer(event.moveId === 'guard' ? 150 : ATTACK_ANIMATION_MS);
      }),
      defer(() => {
        this.attacking.set(null);
        this.playerHp.set(event.playerHp);
        this.opponentHp.set(event.opponentHp);
        this.log.set([...this.log(), event.text].slice(-6));

        if (event.crit) this.shake.set(true);
        if (event.damage > 0) {
          this.hurt.set(target);
          this.floating.set({
            side: target,
            text: `-${event.damage}`,
            kind: event.crit ? 'crit' : 'damage',
          });
        } else if (event.heal > 0) {
          this.floating.set({ side: event.actor, text: `+${event.heal}`, kind: 'heal' });
        } else if (event.missed || event.effectiveness === 0) {
          this.floating.set({ side: target, text: event.missed ? 'Miss!' : 'No effect', kind: 'miss' });
        }
        return timer(HIT_ANIMATION_MS);
      }),
      defer(() => {
        this.hurt.set(null);
        this.floating.set(null);
        this.shake.set(false);
        return of(null);
      }),
    );
  }

  private finish(winner: Side): void {
    this.winner.set(winner);
    this.phase.set('over');

    const state = this.battle();
    const loser = state?.[winner === 'player' ? 'opponent' : 'player'].pokemon.name;
    this.log.set([
      ...this.log(),
      winner === 'player'
        ? `${capitalise(loser ?? '')} fainted. You win!`
        : `${capitalise(state?.player.pokemon.name ?? '')} fainted. You lose…`,
    ].slice(-6));

    if (winner === 'player') {
      this.wins.set(this.wins() + 1);
      this.streak.set(this.streak() + 1);
      if (this.streak() > this.bestStreak()) {
        this.bestStreak.set(this.streak());
        this.cache.set(BATTLE_BEST_STREAK_KEY, this.streak());
      }
    } else {
      this.losses.set(this.losses() + 1);
      this.streak.set(0);
    }
  }
}
