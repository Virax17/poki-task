import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, throwError } from 'rxjs';
import { ApiError, toApiError } from '../../common/utils/error.util';
import { LoggerService } from '../logger.service';

interface GraphqlResponse<T> {
  data?: T;
  errors?: { message: string }[];
}

/** Minimal GraphQL-over-HTTP client that normalises every failure to an {@link ApiError}. */
@Injectable({ providedIn: 'root' })
export class GraphqlClientService {
  private readonly http = inject(HttpClient);
  private readonly logger = inject(LoggerService);

  /**
   * Executes a GraphQL query or mutation.
   * @param url GraphQL endpoint.
   * @param query Query / mutation document.
   * @param variables Optional operation variables.
   * @returns Cold observable emitting the `data` payload, or erroring with a user-friendly {@link ApiError}.
   */
  execute$<T>(
    url: string,
    query: string,
    variables?: Record<string, unknown>,
  ): Observable<T> {
    return this.http
      .post<GraphqlResponse<T>>(url, { query, variables })
      .pipe(
        map((response) => {
          if (response.errors?.length || !response.data) {
            throw new ApiError(
              'The server could not complete the request.',
              response.errors,
            );
          }
          return response.data;
        }),
        catchError((error: unknown) => {
          this.logger.error('GraphQL request failed', { url, error });
          return throwError(() => toApiError(error));
        }),
      );
  }
}
