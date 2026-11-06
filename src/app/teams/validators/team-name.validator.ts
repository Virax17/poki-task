import { AbstractControl, AsyncValidatorFn, ValidationErrors } from '@angular/forms';
import { map, of, timer } from 'rxjs';
import { NAME_VALIDATION_DEBOUNCE_MS } from '../constants/team.constants';

/**
 * Async validator: the team name must not match an existing team (case-insensitive).
 * Angular unsubscribes from the previous validation when the value changes,
 * so the `timer` acts as the debounce.
 * @param getExistingNames Returns the normalised (trimmed, lowercase) names currently in use.
 * @param debounceMs Delay before the check runs.
 */
export function uniqueTeamNameValidator(
  getExistingNames: () => string[],
  debounceMs = NAME_VALIDATION_DEBOUNCE_MS,
): AsyncValidatorFn {
  return (control: AbstractControl) => {
    const value = String(control.value ?? '')
      .trim()
      .toLowerCase();
    if (!value) return of(null);

    return timer(debounceMs).pipe(
      map((): ValidationErrors | null =>
        getExistingNames().includes(value) ? { nameTaken: true } : null,
      ),
    );
  };
}
