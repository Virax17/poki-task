import { Observable, combineLatest, distinctUntilChanged, map, shareReplay } from 'rxjs';
import { Team, TeamState, TeamsView } from '../models/team.model';

/** Teams only (re-emits when the array reference changes). */
export function selectTeams$(state$: Observable<TeamState>): Observable<Team[]> {
  return state$.pipe(
    map((s) => s.teams),
    distinctUntilChanged(),
  );
}

/** Normalised (trimmed, lowercase) names of all teams, used for uniqueness checks. */
export function selectTeamNames$(state$: Observable<TeamState>): Observable<string[]> {
  return selectTeams$(state$).pipe(
    map((teams) => teams.map((t) => t.name.trim().toLowerCase())),
  );
}

/** Collapses load status + data into a single view status. */
export function deriveTeamsStatus(
  status: TeamState['status'],
  count: number,
): TeamsView['status'] {
  if (status === 'idle' || status === 'loading') return count === 0 ? 'loading' : 'success';
  if (status === 'error') return 'error';
  return count === 0 ? 'empty' : 'success';
}

/** Team list view model, shared between subscribers via `shareReplay(1)`. */
export function selectTeamsView$(state$: Observable<TeamState>): Observable<TeamsView> {
  return combineLatest([
    selectTeams$(state$),
    state$.pipe(
      map((s) => s.status),
      distinctUntilChanged(),
    ),
    state$.pipe(
      map((s) => s.error),
      distinctUntilChanged(),
    ),
  ]).pipe(
    map(([teams, status, error]) => ({
      teams,
      error,
      status: deriveTeamsStatus(status, teams.length),
    })),
    shareReplay({ bufferSize: 1, refCount: true }),
  );
}
