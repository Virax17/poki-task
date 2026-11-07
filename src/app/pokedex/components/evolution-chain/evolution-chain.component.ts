import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { Subject, catchError, map, merge, of, startWith, switchMap } from 'rxjs';
import { SkeletonComponent } from '../../../common/components/skeleton/skeleton.component';
import { StateMessageComponent } from '../../../common/components/state-message/state-message.component';
import { toErrorMessage } from '../../../common/utils/error.util';
import { SPRITE_BASE_URL } from '../../constants/pokedex.constants';
import { EvolutionNode, EvolutionStage } from '../../models/evolution.model';
import { LoadStatus } from '../../models/pokemon.model';
import { PokemonStore } from '../../state/pokemon.store';
import { buildEvolutionStages } from '../../utils/evolution.util';

interface ChainState {
  status: LoadStatus;
  stages: EvolutionStage[];
  error: string | null;
}

const IDLE: ChainState = { status: 'idle', stages: [], error: null };

/** Animated evolution chain: stages left → right, branches stacked, current form highlighted. */
@Component({
  selector: 'app-evolution-chain',
  standalone: true,
  imports: [SkeletonComponent, StateMessageComponent],
  templateUrl: './evolution-chain.component.html',
  styleUrl: './evolution-chain.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EvolutionChainComponent {
  /** Pokémon whose chain is shown; also the highlighted node. */
  readonly pokemonId = input.required<number>();
  readonly accent = input('#ef5350');

  /** Emits the id of another chain member the user wants to inspect. */
  readonly picked = output<number>();

  private readonly store = inject(PokemonStore);
  private readonly retry$ = new Subject<void>();

  readonly state = toSignal(
    merge(toObservable(this.pokemonId), this.retry$.pipe(map(() => this.pokemonId()))).pipe(
      switchMap((id) =>
        this.store.getEvolution$(id).pipe(
          map(
            (nodes): ChainState => ({
              status: 'success',
              stages: buildEvolutionStages(nodes),
              error: null,
            }),
          ),
          catchError((err: unknown) =>
            of<ChainState>({ status: 'error', stages: [], error: toErrorMessage(err) }),
          ),
          startWith<ChainState>({ status: 'loading', stages: [], error: null }),
        ),
      ),
    ),
    { initialValue: IDLE },
  );

  /** A chain with a single member means the Pokémon does not evolve. */
  readonly evolves = computed(() => this.state().stages.flat().length > 1);

  artwork(id: number): string {
    return `${SPRITE_BASE_URL}/other/official-artwork/${id}.png`;
  }

  select(node: EvolutionNode): void {
    if (node.id !== this.pokemonId()) this.picked.emit(node.id);
  }

  onRetry(): void {
    this.retry$.next();
  }
}
