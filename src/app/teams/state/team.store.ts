import { DestroyRef, Injectable, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BehaviorSubject, Observable, catchError, tap, throwError } from 'rxjs';
import { toErrorMessage } from '../../common/utils/error.util';
import { ToastService } from '../../core/toast/toast.service';
import { CURRENT_TRAINER_ID } from '../constants/team.constants';
import { NewTeamInput, Team, TeamState, TeamsView } from '../models/team.model';
import { TeamApiService } from '../services/team-api.service';
import { selectTeamsView$ } from './team.selectors';

const INITIAL_TEAM_STATE: TeamState = { teams: [], status: 'idle', error: null };

/**
 * BehaviorSubject-based store for teams.
 * Create and delete are optimistic and roll back (with a toast) when the mutation fails.
 */
@Injectable({ providedIn: 'root' })
export class TeamStore {
  private readonly api = inject(TeamApiService);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly state$ = new BehaviorSubject<TeamState>(INITIAL_TEAM_STATE);
  private tempCounter = 0;

  /** View model for the team list (status + teams). */
  readonly view$: Observable<TeamsView> = selectTeamsView$(this.state$);

  /** Current state snapshot. */
  get snapshot(): TeamState {
    return this.state$.value;
  }

  /** Loads teams from the server. Also used as the Retry action. */
  load(): void {
    this.patch({ status: 'loading', error: null });
    this.api
      .getTeams$()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (teams) => this.patch({ teams, status: 'success' }),
        error: (err: unknown) =>
          this.patch({ status: 'error', error: toErrorMessage(err) }),
      });
  }

  /** Loads teams once; no-op if already loaded or loading. */
  init(): void {
    if (this.snapshot.status === 'idle') this.load();
  }

  /**
   * Creates a team optimistically: it appears in the list immediately,
   * is swapped for the server copy on success, and removed on failure.
   * @param input Team name and Pokémon ids.
   * @returns Observable of the saved team; errors with a user-friendly message after rollback.
   */
  create$(input: NewTeamInput): Observable<Team> {
    const tempId = `temp-${++this.tempCounter}`;
    const optimistic: Team = {
      id: tempId,
      trainerId: CURRENT_TRAINER_ID,
      name: input.name,
      pokemonIds: input.pokemonIds,
      createdAt: new Date().toISOString(),
      pending: true,
    };
    this.patch({ teams: [optimistic, ...this.snapshot.teams], status: 'success' });

    return this.api.createTeam$(input).pipe(
      tap((saved) => {
        this.patch({
          teams: this.snapshot.teams.map((t) => (t.id === tempId ? saved : t)),
        });
        this.toast.success(`Team "${saved.name}" created.`);
      }),
      catchError((err: unknown) => {
        this.patch({ teams: this.snapshot.teams.filter((t) => t.id !== tempId) });
        const message = toErrorMessage(err);
        this.toast.error(`Could not create "${input.name}". ${message}`);
        return throwError(() => err);
      }),
    );
  }

  /**
   * Deletes a team optimistically, restoring it at its old position if the mutation fails.
   * @param id Team id.
   */
  delete(id: string): void {
    const teams = this.snapshot.teams;
    const index = teams.findIndex((t) => t.id === id);
    const removed = teams[index];
    if (!removed || removed.pending) return;

    this.patch({ teams: teams.filter((t) => t.id !== id) });

    this.api
      .deleteTeam$(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.toast.success(`Team "${removed.name}" deleted.`),
        error: (err: unknown) => {
          const restored = [...this.snapshot.teams];
          restored.splice(Math.min(index, restored.length), 0, removed);
          this.patch({ teams: restored });
          this.toast.error(`Could not delete "${removed.name}". ${toErrorMessage(err)}`);
        },
      });
  }

  private patch(partial: Partial<TeamState>): void {
    this.state$.next({ ...this.state$.value, ...partial });
  }
}
