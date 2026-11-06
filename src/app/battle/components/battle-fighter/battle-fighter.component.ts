import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { TypeBadgeComponent } from '../../../common/components/type-badge/type-badge.component';
import { Combatant, FloatingText, Side } from '../../models/battle.model';

/** One side of the arena: name, types, animated HP bar, artwork and floating damage numbers. */
@Component({
  selector: 'app-battle-fighter',
  standalone: true,
  imports: [NgTemplateOutlet, TypeBadgeComponent],
  templateUrl: './battle-fighter.component.html',
  styleUrl: './battle-fighter.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BattleFighterComponent {
  readonly side = input.required<Side>();
  readonly combatant = input.required<Combatant>();
  /** HP currently displayed (updated step by step while a turn is replayed). */
  readonly hp = input.required<number>();
  readonly imageUrl = input.required<string>();
  readonly attacking = input(false);
  readonly hurt = input(false);
  readonly floating = input<FloatingText | null>(null);

  readonly imageError = output<void>();

  readonly percent = computed(() =>
    Math.max(0, Math.round((this.hp() / this.combatant().maxHp) * 100)),
  );
  readonly hpLevel = computed(() => {
    const p = this.percent();
    return p > 50 ? 'high' : p > 20 ? 'mid' : 'low';
  });
  readonly isKnockedOut = computed(() => this.hp() === 0);
  readonly floatingHere = computed(() => {
    const f = this.floating();
    return f && f.side === this.side() ? f : null;
  });
}
