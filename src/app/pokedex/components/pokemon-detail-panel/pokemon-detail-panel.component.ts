import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
} from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { Subject, catchError, map, merge, of, startWith, switchMap } from 'rxjs';
import { SkeletonComponent } from '../../../common/components/skeleton/skeleton.component';
import { StateMessageComponent } from '../../../common/components/state-message/state-message.component';
import { TypeBadgeComponent } from '../../../common/components/type-badge/type-badge.component';
import { toErrorMessage } from '../../../common/utils/error.util';
import { getTypeColor } from '../../../common/utils/type-colors.util';
import { STAT_LABELS } from '../../constants/pokedex.constants';
import { LoadStatus, Pokemon, PokemonAbility, STAT_KEYS } from '../../models/pokemon.model';
import { PokemonStore } from '../../state/pokemon.store';
import { StatRadarChartComponent } from '../stat-radar-chart/stat-radar-chart.component';

interface AbilitiesState {
  status: LoadStatus;
  data: PokemonAbility[];
  error: string | null;
}

const IDLE_ABILITIES: AbilitiesState = { status: 'idle', data: [], error: null };

/** Slide-in side panel with full details, abilities and a stat radar chart. */
@Component({
  selector: 'app-pokemon-detail-panel',
  standalone: true,
  imports: [
    SkeletonComponent,
    StateMessageComponent,
    TypeBadgeComponent,
    StatRadarChartComponent,
  ],
  templateUrl: './pokemon-detail-panel.component.html',
  styleUrl: './pokemon-detail-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PokemonDetailPanelComponent {
  readonly pokemon = input<Pokemon | null>(null);
  readonly open = input(false);
  readonly closed = output<void>();

  private readonly store = inject(PokemonStore);
  private readonly retry$ = new Subject<void>();
  private readonly pokemonId = computed(() => this.pokemon()?.id ?? null);

  readonly statRows = computed(() => {
    const pokemon = this.pokemon();
    if (!pokemon) return [];
    return STAT_KEYS.map((key) => ({
      label: STAT_LABELS[key],
      value: pokemon.stats[key],
      percent: Math.min(100, Math.round((pokemon.stats[key] / 255) * 100)),
    }));
  });

  readonly accent = computed(() => {
    const first = this.pokemon()?.types[0];
    return first ? getTypeColor(first) : '#ef5350';
  });

  /** Abilities for the selected Pokémon with loading / error / empty / success states. */
  readonly abilities = toSignal(
    merge(
      toObservable(this.pokemonId),
      this.retry$.pipe(map(() => this.pokemonId())),
    ).pipe(
      switchMap((id) =>
        id === null
          ? of(IDLE_ABILITIES)
          : this.store.getAbilities$(id).pipe(
              map(
                (data): AbilitiesState => ({
                  status: 'success',
                  data,
                  error: null,
                }),
              ),
              catchError((err: unknown) =>
                of<AbilitiesState>({
                  status: 'error',
                  data: [],
                  error: toErrorMessage(err),
                }),
              ),
              startWith<AbilitiesState>({ status: 'loading', data: [], error: null }),
            ),
      ),
    ),
    { initialValue: IDLE_ABILITIES },
  );

  onRetryAbilities(): void {
    this.retry$.next();
  }
}
