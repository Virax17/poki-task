import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { MOCK_GRAPHQL_URL } from '../../common/constants/constants';
import { GraphqlClientService } from '../../core/graphql/graphql-client.service';
import { CURRENT_TRAINER_ID } from '../constants/team.constants';
import { NewTeamInput, RawTeam, Team } from '../models/team.model';

const TEAM_FIELDS = /* GraphQL */ `
  id
  trainer_id
  name
  pokemon_ids
  created_at
`;

const GET_TEAMS = /* GraphQL */ `
  query GetTeams {
    allTeams {
      ${TEAM_FIELDS}
    }
  }
`;

const CREATE_TEAM = /* GraphQL */ `
  mutation CreateTeam(
    $trainer_id: ID!
    $name: String!
    $pokemon_ids: [Int]!
    $created_at: String!
  ) {
    createTeam(
      trainer_id: $trainer_id
      name: $name
      pokemon_ids: $pokemon_ids
      created_at: $created_at
    ) {
      ${TEAM_FIELDS}
    }
  }
`;

const DELETE_TEAM = /* GraphQL */ `
  mutation DeleteTeam($id: ID!) {
    removeTeam(id: $id) {
      id
    }
  }
`;

function mapTeam(raw: RawTeam): Team {
  return {
    id: String(raw.id),
    trainerId: String(raw.trainer_id),
    name: raw.name,
    pokemonIds: raw.pokemon_ids,
    createdAt: raw.created_at,
  };
}

/** GraphQL access to the local mock server (teams). */
@Injectable({ providedIn: 'root' })
export class TeamApiService {
  private readonly client = inject(GraphqlClientService);

  /** Fetches every team. */
  getTeams$(): Observable<Team[]> {
    return this.client
      .execute$<{ allTeams: RawTeam[] }>(MOCK_GRAPHQL_URL, GET_TEAMS)
      .pipe(map((data) => data.allTeams.map(mapTeam)));
  }

  /**
   * Creates a team for the current trainer.
   * @param input Team name and Pokémon ids.
   * @returns The saved team with its server-assigned id.
   */
  createTeam$(input: NewTeamInput): Observable<Team> {
    return this.client
      .execute$<{ createTeam: RawTeam }>(MOCK_GRAPHQL_URL, CREATE_TEAM, {
        trainer_id: CURRENT_TRAINER_ID,
        name: input.name,
        pokemon_ids: input.pokemonIds,
        created_at: new Date().toISOString(),
      })
      .pipe(map((data) => mapTeam(data.createTeam)));
  }

  /**
   * Deletes a team.
   * @param id Team id.
   */
  deleteTeam$(id: string): Observable<void> {
    return this.client
      .execute$<{ removeTeam: { id: string } }>(MOCK_GRAPHQL_URL, DELETE_TEAM, { id })
      .pipe(map(() => undefined));
  }
}
