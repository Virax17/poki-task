import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { Pokemon } from '../../../pokedex/models/pokemon.model';

/** Six (or `max`) team slots that visibly fill up as Pokémon are picked. */
@Component({
  selector: 'app-team-slots',
  standalone: true,
  templateUrl: './team-slots.component.html',
  styleUrl: './team-slots.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TeamSlotsComponent {
  readonly pokemon = input<Pokemon[]>([]);
  readonly max = input(6);
  readonly invalid = input(false);

  readonly removed = output<number>();

  /** One entry per slot; `null` marks an empty slot. */
  readonly slots = computed(() =>
    Array.from({ length: this.max() }, (_, i) => this.pokemon()[i] ?? null),
  );
}
