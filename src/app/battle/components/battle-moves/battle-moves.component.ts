import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { getTypeColor } from '../../../common/utils/type-colors.util';
import { Pokemon } from '../../../pokedex/models/pokemon.model';
import { MOVES, MOVE_ICONS, MOVE_ORDER } from '../../constants/battle.constants';
import { MoveId } from '../../models/battle.model';
import { moveTypeOf } from '../../utils/battle-engine.util';

/** The four move buttons, tinted by the elemental type each move will deal. */
@Component({
  selector: 'app-battle-moves',
  standalone: true,
  templateUrl: './battle-moves.component.html',
  styleUrl: './battle-moves.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BattleMovesComponent {
  readonly pokemon = input.required<Pokemon>();
  readonly disabled = input(false);

  readonly chosen = output<MoveId>();

  readonly moves = computed(() =>
    MOVE_ORDER.map((id) => {
      const move = MOVES[id];
      const type = move.kind === 'status' ? null : moveTypeOf(this.pokemon(), id);
      return {
        ...move,
        icon: MOVE_ICONS[id],
        type,
        color: type ? getTypeColor(type) : '#26a69a',
      };
    }),
  );
}
