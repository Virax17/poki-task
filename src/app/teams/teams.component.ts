import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { CacheService } from '../common/services/cache.service';
import { TeamFormComponent } from './components/team-form/team-form.component';
import { TeamListComponent } from './components/team-list/team-list.component';
import { TeamSummaryComponent } from './components/team-summary/team-summary.component';
import { SELECTED_TEAM_STORAGE_KEY } from './constants/team.constants';
import { Team } from './models/team.model';
import { TeamStore } from './state/team.store';

@Component({
  selector: 'app-teams-page',
  standalone: true,
  imports: [TeamFormComponent, TeamListComponent, TeamSummaryComponent],
  templateUrl: './teams.component.html',
  styleUrl: './teams.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TeamsPage {
  protected readonly store = inject(TeamStore);
  private readonly cache = inject(CacheService);

  /** Store selector bridged into the template. */
  readonly view = toSignal(this.store.view$, { requireSync: false });

  // UI state: selected team id is restored from / persisted to localStorage
  readonly selectedTeamId = signal<string | null>(
    this.cache.get<string>(SELECTED_TEAM_STORAGE_KEY),
  );

  readonly selectedTeam = computed(
    () => this.view()?.teams.find((t) => t.id === this.selectedTeamId()) ?? null,
  );

  constructor() {
    this.store.init();

    effect(() => {
      const id = this.selectedTeamId();
      if (id) this.cache.set(SELECTED_TEAM_STORAGE_KEY, id);
      else this.cache.remove(SELECTED_TEAM_STORAGE_KEY);
    });
  }

  onSelect(team: Team): void {
    if (!team.pending) this.selectedTeamId.set(team.id);
  }

  onDelete(team: Team): void {
    if (team.id === this.selectedTeamId()) this.selectedTeamId.set(null);
    this.store.delete(team.id);
  }
}
