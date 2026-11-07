import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { getTypeColor } from '../../../common/utils/type-colors.util';
import { POKEMON_TYPES } from '../../constants/pokedex.constants';

/** Horizontally scrolling rail of colour-coded type chips used to filter the Pokédex. */
@Component({
  selector: 'app-type-rail',
  standalone: true,
  templateUrl: './type-rail.component.html',
  styleUrl: './type-rail.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TypeRailComponent {
  /** Active type, or `null` for "All". */
  readonly selected = input<string | null>(null);
  readonly typeChange = output<string | null>();

  readonly types = POKEMON_TYPES;

  color(type: string): string {
    return getTypeColor(type);
  }

  /** Clicking the active chip clears the filter. */
  toggle(type: string): void {
    this.typeChange.emit(type === this.selected() ? null : type);
  }
}
