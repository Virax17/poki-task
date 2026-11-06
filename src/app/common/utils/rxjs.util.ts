import { MonoTypeOperatorFunction, retry, timer } from 'rxjs';
import { API_RETRY_COUNT, API_RETRY_DELAY_MS } from '../constants/constants';

/**
 * Retries a failed source with a linearly growing delay
 * (delay, 2×delay, 3×delay …) before surfacing the error.
 */
export function retryWithDelay<T>(
  count = API_RETRY_COUNT,
  delayMs = API_RETRY_DELAY_MS,
): MonoTypeOperatorFunction<T> {
  return retry({
    count,
    delay: (_error, attempt) => timer(delayMs * attempt),
  });
}
