import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { Subject, catchError, map, merge, of, startWith, switchMap } from 'rxjs';
import { SkeletonComponent } from '../../../common/components/skeleton/skeleton.component';
import { StateMessageComponent } from '../../../common/components/state-message/state-message.component';
import { toErrorMessage } from '../../../common/utils/error.util';
import { getTypeColor } from '../../../common/utils/type-colors.util';
import { MAX_STAT_TOTAL } from '../../../pokedex/constants/pokedex.constants';
import { Pokemon } from '../../../pokedex/models/pokemon.model';
import { PokemonStore } from '../../../pokedex/state/pokemon.store';
import { Team } from '../../models/team.model';
import { totalBaseStats, typeDistribution } from '../../utils/team-stats.util';

interface MembersState {
  status: 'idle' | 'loading' | 'success' | 'error';
  members: Pokemon[];
  error: string | null;
}

const IDLE: MembersState = { status: 'idle', members: [], error: null };
const RING_CIRCUMFERENCE = 2 * Math.PI * 34;

/** Details for the selected team: power ring, type mix bar and member list. */
@Component({
  selector: 'app-team-summary',
  standalone: true,
  imports: [SkeletonComponent, StateMessageComponent],
  templateUrl: './team-summary.component.html',
  styleUrl: './team-summary.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TeamSummaryComponent {
  readonly team = input<Team | null>(null);

  private readonly pokemonStore = inject(PokemonStore);
  private readonly retry$ = new Subject<void>();

  readonly circumference = RING_CIRCUMFERENCE;
  readonly maxTotal = MAX_STAT_TOTAL;

  /** Resolved team members with loading / error / success states. */
  readonly membersState = toSignal(
    merge(toObservable(this.team), this.retry$.pipe(map(() => this.team()))).pipe(
      switchMap((team) =>
        !team || team.pending
          ? of(IDLE)
          : this.pokemonStore.getByIds$(team.pokemonIds).pipe(
              map((members): MembersState => ({ status: 'success', members, error: null })),
              catchError((err: unknown) =>
                of<MembersState>({ status: 'error', members: [], error: toErrorMessage(err) }),
              ),
              startWith<MembersState>({ status: 'loading', members: [], error: null }),
            ),
      ),
    ),
    { initialValue: IDLE },
  );

  readonly distribution = computed(() =>
    typeDistribution(this.membersState().members).map((entry) => ({
      ...entry,
      color: getTypeColor(entry.type),
    })),
  );
  readonly total = computed(() => totalBaseStats(this.membersState().members));
  readonly ringOffset = computed(() => {
    const members = this.membersState().members.length;
    const ratio = members ? this.total() / (members * MAX_STAT_TOTAL) : 0;
    return RING_CIRCUMFERENCE * (1 - Math.min(1, ratio));
  });

  onRetry(): void {
    this.retry$.next();
  }
}
