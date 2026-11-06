import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/**
 * Validates that an array-valued control has between `min` and `max` items.
 * Produces `{ minItems }` or `{ maxItems }` errors.
 */
export function itemCountValidator(min: number, max: number): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const count = Array.isArray(control.value) ? control.value.length : 0;
    if (count < min) return { minItems: { min, actual: count } };
    if (count > max) return { maxItems: { max, actual: count } };
    return null;
  };
}
