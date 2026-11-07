import { ChangeDetectionStrategy, Component, computed, inject, input, output, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  Subject,
  catchError,
  debounceTime,
  distinctUntilChanged,
  map,
  merge,
  of,
  startWith,
  switchMap,
} from 'rxjs';
import { SkeletonComponent } from '../../../common/components/skeleton/skeleton.component';
import { StateMessageComponent } from '../../../common/components/state-message/state-message.component';
import { SEARCH_DEBOUNCE_MS } from '../../../common/constants/constants';
import { toErrorMessage } from '../../../common/utils/error.util';
import { Pokemon } from '../../../pokedex/models/pokemon.model';
import { PokemonStore } from '../../../pokedex/state/pokemon.store';

interface PickerResults {
  status: 'idle' | 'loading' | 'success' | 'error';
  items: Pokemon[];
  error: string | null;
}

const IDLE: PickerResults = { status: 'idle', items: [], error: null };

/** Autocomplete input that searches Pokémon (debounced) and shows picks as removable chips. */
@Component({
  selector: 'app-pokemon-picker',
  standalone: true,
  imports: [SkeletonComponent, StateMessageComponent],
  templateUrl: './pokemon-picker.component.html',
  styleUrl: './pokemon-picker.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PokemonPickerComponent {
  readonly selected = input<Pokemon[]>([]);
  readonly max = input(6);
  readonly inputId = input('pokemon-picker');
  readonly invalid = input(false);

  readonly picked = output<Pokemon>();
  readonly blurred = output<void>();

  private readonly store = inject(PokemonStore);
  private readonly query$ = new Subject<string>();
  private readonly retry$ = new Subject<void>();

  readonly query = signal('');
  readonly isOpen = signal(false);
  readonly isFull = computed(() => this.selected().length >= this.max());
  readonly showDropdown = computed(() => this.isOpen() && this.query().trim().length > 0);
  readonly selectedIds = computed(() => new Set(this.selected().map((p) => p.id)));

  /** Typeahead results with loading / error / empty / success states. */
  readonly results = toSignal(
    merge(
      this.query$.pipe(
        map((t) => t.trim()),
        debounceTime(SEARCH_DEBOUNCE_MS),
        distinctUntilChanged(),
      ),
      this.retry$.pipe(map(() => this.query().trim())),
    ).pipe(
      switchMap((term) =>
        !term
          ? of(IDLE)
          : this.store.search$(term).pipe(
              map((items): PickerResults => ({ status: 'success', items, error: null })),
              catchError((err: unknown) =>
                of<PickerResults>({ status: 'error', items: [], error: toErrorMessage(err) }),
              ),
              startWith<PickerResults>({ status: 'loading', items: [], error: null }),
            ),
      ),
    ),
    { initialValue: IDLE },
  );

  onInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.query.set(value);
    this.isOpen.set(true);
    this.query$.next(value);
  }

  onRetry(): void {
    this.retry$.next();
  }

  choose(pokemon: Pokemon): void {
    if (this.isFull() || this.selectedIds().has(pokemon.id)) return;
    this.picked.emit(pokemon);
    this.query.set('');
    this.query$.next('');
    this.isOpen.set(false);
  }

  onBlur(): void {
    // Delay so a click on an option is processed before the dropdown closes.
    setTimeout(() => {
      this.isOpen.set(false);
      this.blurred.emit();
    }, 150);
  }
}
