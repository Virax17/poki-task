import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { SkeletonComponent } from '../../../common/components/skeleton/skeleton.component';
import { StateMessageComponent } from '../../../common/components/state-message/state-message.component';
import { SPRITE_BASE_URL } from '../../../pokedex/constants/pokedex.constants';
import { MAX_TEAM_SIZE } from '../../constants/team.constants';
import { Team, TeamsView } from '../../models/team.model';

/** Gradient pairs cycled across team cards to keep the list lively. */
const PALETTES: readonly [string, string][] = [
  ['#42a5f5', '#26c6da'],
  ['#ab47bc', '#ec407a'],
  ['#ffa726', '#ffca28'],
  ['#66bb6a', '#26a69a'],
  ['#ef5350', '#ff7043'],
];

@Component({
  selector: 'app-team-list',
  standalone: true,
  imports: [DatePipe, SkeletonComponent, StateMessageComponent],
  templateUrl: './team-list.component.html',
  styleUrl: './team-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TeamListComponent {
  readonly view = input.required<TeamsView>();
  readonly selectedId = input<string | null>(null);

  readonly selected = output<Team>();
  readonly deleted = output<Team>();
  readonly retry = output<void>();

  readonly skeletonCards = [1, 2, 3];
  readonly maxSize = MAX_TEAM_SIZE;

  spriteUrl(id: number): string {
    return `${SPRITE_BASE_URL}/other/official-artwork/${id}.png`;
  }

  gradient(index: number): string {
    const [a, b] = PALETTES[index % PALETTES.length];
    return `linear-gradient(135deg, ${a}, ${b})`;
  }
}
