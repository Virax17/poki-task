import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { TypeBadgeComponent } from '../../../common/components/type-badge/type-badge.component';
import { getTypeColor } from '../../../common/utils/type-colors.util';
import { Pokemon } from '../../../pokedex/models/pokemon.model';

/** "Choose your fighter" grid of type-coloured trading-card style options. */
@Component({
  selector: 'app-battle-select',
  standalone: true,
  imports: [TypeBadgeComponent],
  templateUrl: './battle-select.component.html',
  styleUrl: './battle-select.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BattleSelectComponent {
  readonly choices = input.required<Pokemon[]>();

  readonly picked = output<Pokemon>();
  readonly reroll = output<void>();

  primary(pokemon: Pokemon): string {
    return getTypeColor(pokemon.types[0] ?? 'normal');
  }

  secondary(pokemon: Pokemon): string {
    return getTypeColor(pokemon.types[1] ?? pokemon.types[0] ?? 'normal');
  }
}
