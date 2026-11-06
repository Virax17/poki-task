import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { DatePipe } from '@angular/common';
import { SkeletonComponent } from '../../../common/components/skeleton/skeleton.component';
import { StateMessageComponent } from '../../../common/components/state-message/state-message.component';
import { SPRITE_BASE_URL } from '../../../pokedex/constants/pokedex.constants';
import { Team, TeamsView } from '../../models/team.model';

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

  spriteUrl(id: number): string {
    return `${SPRITE_BASE_URL}/${id}.png`;
  }
}
