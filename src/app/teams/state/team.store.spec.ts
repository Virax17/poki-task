import { TestBed } from '@angular/core/testing';
import { Subject, firstValueFrom, of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it } from 'vitest';
import { ApiError } from '../../common/utils/error.util';
import { ToastService } from '../../core/toast/toast.service';
import { Team } from '../models/team.model';
import { TeamApiService } from '../services/team-api.service';
import { TeamStore } from './team.store';

const existing: Team = {
  id: '1',
  trainerId: '1',
  name: 'Kanto Starters',
  pokemonIds: [25],
  createdAt: '2024-01-01T00:00:00Z',
};

describe('TeamStore', () => {
  let api: {
    getTeams$: () => unknown;
    createTeam$: (input: unknown) => unknown;
    deleteTeam$: (id: string) => unknown;
  };
  let store: TeamStore;
  let toast: ToastService;

  function setup(): void {
    TestBed.configureTestingModule({
      providers: [{ provide: TeamApiService, useValue: api }],
    });
    store = TestBed.inject(TeamStore);
    toast = TestBed.inject(ToastService);
  }

  beforeEach(() => {
    api = {
      getTeams$: () => of([existing]),
      createTeam$: () => of(existing),
      deleteTeam$: () => of(undefined),
    };
  });

  it('shows a created team immediately and swaps in the server copy on success', async () => {
    const server$ = new Subject<Team>();
    api.createTeam$ = () => server$;
    setup();
    store.load();

    const result = firstValueFrom(store.create$({ name: 'Elite', pokemonIds: [6] }));

    // Optimistic: visible right away, flagged pending
    expect(store.snapshot.teams[0]).toMatchObject({ name: 'Elite', pending: true });

    server$.next({ ...existing, id: '9', name: 'Elite', pokemonIds: [6] });
    server$.complete();
    await result;

    expect(store.snapshot.teams[0]).toMatchObject({ id: '9', name: 'Elite' });
    expect(store.snapshot.teams[0].pending).toBeUndefined();
    expect(store.snapshot.teams).toHaveLength(2);
  });

  it('rolls back the optimistic team and shows an error toast when the mutation fails', async () => {
    api.createTeam$ = () => throwError(() => new ApiError('Cannot reach the server.'));
    setup();
    store.load();

    await expect(
      firstValueFrom(store.create$({ name: 'Elite', pokemonIds: [6] })),
    ).rejects.toBeInstanceOf(ApiError);

    expect(store.snapshot.teams).toEqual([existing]);
    expect(toast.toasts()).toHaveLength(1);
    expect(toast.toasts()[0].kind).toBe('error');
  });

  it('restores a deleted team at its old position when the delete fails', () => {
    api.deleteTeam$ = () => throwError(() => new ApiError('nope'));
    setup();
    store.load();

    store.delete('1');

    expect(store.snapshot.teams).toEqual([existing]);
    expect(toast.toasts()[0].kind).toBe('error');
  });
});
