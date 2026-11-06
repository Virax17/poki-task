export interface Team {
  id: string;
  trainerId: string;
  name: string;
  pokemonIds: number[];
  createdAt: string;
  /** True while an optimistic create has not been confirmed by the server. */
  pending?: boolean;
}

export interface NewTeamInput {
  name: string;
  pokemonIds: number[];
}

/** Raw shape returned by the mock GraphQL server. */
export interface RawTeam {
  id: string;
  trainer_id: string;
  name: string;
  pokemon_ids: number[];
  created_at: string;
}

export interface TeamState {
  teams: Team[];
  status: 'idle' | 'loading' | 'success' | 'error';
  error: string | null;
}

export interface TeamsView {
  status: 'loading' | 'error' | 'empty' | 'success';
  error: string | null;
  teams: Team[];
}
