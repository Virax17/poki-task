import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { getTypeColor } from '../../utils/type-colors.util';

@Component({
  selector: 'app-type-badge',
  standalone: true,
  templateUrl: './type-badge.component.html',
  styleUrl: './type-badge.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TypeBadgeComponent {
  readonly type = input.required<string>();

  readonly color = computed(() => getTypeColor(this.type()));
}
